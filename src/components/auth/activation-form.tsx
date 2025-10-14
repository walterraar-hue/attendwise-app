

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, writeBatch, serverTimestamp, getDoc, increment, collection, query, where, getDocs, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";


const memberSchema = z.object({
  name: z.string().min(2, "Por favor, introduce tu nombre completo."),
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  companyCode: z.string().min(1, "El código de compañía es requerido."),
});

const adminSchema = z.object({
  name: z.string().min(2, "Por favor, introduce tu nombre completo."),
  companyName: z.string().min(2, "Por favor, introduce el nombre de tu compañía."),
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

function SubmitButton({ mode, isLoading }: { mode: "admin" | "member", isLoading: boolean }) {
  const text = mode === "admin" ? "Crear Equipo" : "Crear Cuenta y Unirme";
  return (
    <Button type="submit" className="w-full" disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin" /> : text}
    </Button>
  );
}

export function ActivationForm({ mode, plan }: { mode: "admin" | "member", plan?: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [companyCodeError, setCompanyCodeError] = useState<string | null>(null);

  const isMemberFlow = mode === 'member';

  const form = useForm({
    resolver: zodResolver(isMemberFlow ? memberSchema : adminSchema),
    defaultValues: isMemberFlow
      ? { name: "", email: "", password: "", companyCode: "" }
      : { name: "", companyName: "", email: "", password: "" },
  });

  const handleAdminSubmit = async (values: z.infer<typeof adminSchema>) => {
    setIsLoading(true);
    if (!plan || !auth || !firestore) {
      toast({ title: "Error", description: "No se seleccionó un plan o los servicios de Firebase no están disponibles.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const batch = writeBatch(firestore);
      
      const newCompanyRef = doc(collection(firestore, 'companies')); 

      const roleLimits: Record<string, number> = { 'Global Admin': 0, 'CEO': 0, 'Operations Manager': 0, 'Miembro': 0 };

      if (plan === 'basic') {
          roleLimits['Global Admin'] = 1;
          roleLimits['Miembro'] = 50;
      } else if (plan === 'pro') {
          roleLimits['Global Admin'] = 1;
          roleLimits['Operations Manager'] = 1;
          roleLimits['Miembro'] = 80;
      } else if (plan === 'premium') {
          roleLimits['Global Admin'] = 1;
          roleLimits['CEO'] = 1;
          roleLimits['Operations Manager'] = 2;
          roleLimits['Miembro'] = -1; 
      }

      batch.set(newCompanyRef, {
        id: newCompanyRef.id,
        name: values.companyName,
        subscriptionPlan: plan,
        usedSlots: 1,
        createdAt: serverTimestamp(),
        roleLimits: roleLimits,
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, {
        id: user.uid,
        uid: user.uid,
        companyId: newCompanyRef.id,
        email: values.email,
        name: values.name,
        role: 'Global Admin',
        status: 'active',
        isRoleLocked: true, // Global Admins have their role locked by default
      });
      
      await batch.commit();

      toast({ title: "¡Éxito!", description: `Equipo creado correctamente. Ahora puedes iniciar sesión.`, });
      router.push('/login');

    } catch (error: any) {
       let description = "Ocurrió un error inesperado.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Este correo electrónico ya está registrado. Por favor, utiliza otro.";
        } else {
            console.error("Admin registration error:", error);
            description = error.message;
        }
        toast({ title: "Error al crear equipo", description, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleMemberSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsLoading(true);
    setCompanyCodeError(null);
    if (!firestore || !auth) {
        toast({ title: "Error", description: "Servicios de Firebase no disponibles.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const userRoleToAssign: UserRole = "Miembro";
    let userCredential;

    try {
        const companyRef = doc(firestore, "companies", values.companyCode);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            setCompanyCodeError("El código de compañía no es válido. Por favor, verifica e inténtalo de nuevo.");
            throw new Error("Invalid company code");
        }

        const companyData = companySnap.data();
        const roleLimit = companyData.roleLimits?.[userRoleToAssign] ?? 0;
        
        if (roleLimit === 0) {
            toast({ title: "Error de Registro", description: `El rol por defecto 'Miembro' no está disponible en el plan de esta compañía.`, variant: "destructive" });
            throw new Error("Role not available in plan");
        }
        
        if (roleLimit !== -1) {
            const usersQuery = query(collection(firestore, 'users'), where('companyId', '==', values.companyCode), where('role', '==', userRoleToAssign));
            const usersSnap = await getDocs(usersQuery);
            const currentRoleCount = usersSnap.size;

            if (currentRoleCount >= roleLimit) {
                toast({ title: "Error de Registro", description: `No hay cupos disponibles para el rol de ${userRoleToAssign}. Por favor, contacta a tu administrador.`, variant: "destructive" });
                throw new Error("Role slots are full");
            }
        }
        
        userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        const batch = writeBatch(firestore);

        const userDocRef = doc(firestore, "users", user.uid);
        batch.set(userDocRef, {
            id: user.uid,
            uid: user.uid,
            companyId: values.companyCode,
            email: values.email,
            name: values.name,
            role: userRoleToAssign,
            status: 'active',
            createdAt: serverTimestamp(),
            isRoleLocked: false, // Role is NOT locked on creation for members
        });
        
        if (userRoleToAssign === 'Miembro') {
            batch.update(companyRef, {
                usedSlots: increment(1)
            });
        }
        
        await batch.commit();
        
        toast({
            title: "¡Registro Completo!",
            description: "Tu cuenta ha sido creada y activada. ¡Bienvenido a tu dashboard!",
        });
        router.push('/dashboard');

    } catch (error: any) {
        if (userCredential) {
            await deleteUser(userCredential.user).catch(delErr => {
              console.error("Cleanup Error: Failed to delete orphaned auth user.", delErr);
            });
        }
      
        if (error.code === 'auth/email-already-in-use') {
            toast({ title: "Error de Registro", description: "Este correo electrónico ya está registrado. Por favor, inicia sesión.", variant: "destructive" });
        } else if (!companyCodeError) { // Don't show generic error if a specific one is already set
            console.error("Member Registration Error:", error);
            if (error.message !== "Invalid company code" && error.message !== "Role not available in plan" && error.message !== "Role slots are full") {
              toast({ title: "Error de Registro", description: "No se pudo crear la cuenta. Por favor, inténtalo de nuevo.", variant: "destructive" });
            }
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(isMemberFlow ? handleMemberSubmit : handleAdminSubmit)}
        className="space-y-4"
      >
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        
        {!isMemberFlow && (
            <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre de la Compañía</FormLabel>
                    <FormControl>
                    <Input placeholder="Mi Compañía Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de la Cuenta</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isMemberFlow && (
          <FormField
            control={form.control}
            name="companyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de la Compañía</FormLabel>
                <FormControl>
                  <Input placeholder="Pega el código que te dio tu administrador" {...field} />
                </FormControl>
                {companyCodeError ? (
                  <p className="text-sm font-medium text-destructive">{companyCodeError}</p>
                  ) : <FormMessage />}
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Establecer Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton mode={mode} isLoading={isLoading} />
      </form>
    </Form>
  );
}
