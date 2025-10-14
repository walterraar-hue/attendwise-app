
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, writeBatch, serverTimestamp, getDoc, increment, collection, query, where, getDocs } from "firebase/firestore";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/lib/types";


const memberSchema = z.object({
  name: z.string().min(2, "Por favor, introduce tu nombre completo."),
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  companyCode: z.string().min(1, "El código de compañía es requerido."),
  role: z.enum(['Miembro', 'Operations Manager', 'CEO'], { required_error: "Debes seleccionar un rol." }),
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

  const isMemberFlow = mode === 'member';

  const form = useForm({
    resolver: zodResolver(isMemberFlow ? memberSchema : adminSchema),
    defaultValues: isMemberFlow
      ? { name: "", email: "", password: "", companyCode: "", role: "Miembro" as UserRole }
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
      });
      
      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      batch.set(adminRoleRef, { admin: true });

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
    if (!firestore || !auth) {
        toast({ title: "Error", description: "Servicios de Firebase no disponibles.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    let userCredential;
    try {
        // 1. Create user in Auth first to get a UID
        userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        // 2. Now that user is authenticated, validate company code and slots
        const companyRef = doc(firestore, "companies", values.companyCode);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            throw new Error("El código de compañía no es válido.");
        }

        const companyData = companySnap.data();
        
        // 2a. Check if the role is even available in the plan
        const roleLimit = companyData.roleLimits?.[values.role];

        if (roleLimit === undefined || roleLimit === 0) {
            throw new Error(`El rol seleccionado no está disponible en el plan de esta compañía. Por favor, contacta a tu administrador.`);
        }

        // 2b. If the role is available, check if there are open slots
        const usersQuery = query(collection(firestore, 'users'), where('companyId', '==', values.companyCode), where('role', '==', values.role));
        const usersSnap = await getDocs(usersQuery);
        const currentRoleCount = usersSnap.size;

        if (roleLimit !== -1 && currentRoleCount >= roleLimit) {
             throw new Error(`No hay cupos disponibles para el rol de ${values.role}. Por favor, contacta a tu administrador.`);
        }
        
        // 3. If validation passes, commit user data to Firestore
        const batch = writeBatch(firestore);

        const userDocRef = doc(firestore, "users", user.uid);
        batch.set(userDocRef, {
            id: user.uid,
            uid: user.uid,
            companyId: values.companyCode,
            email: values.email,
            name: values.name,
            role: values.role,
            status: 'active',
            createdAt: serverTimestamp(),
        });
        
        // Only increment usedSlots for member-like roles
        if (values.role === 'Miembro' || values.role === 'Manager') {
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
        // If user was created in Auth but Firestore operations failed, delete the Auth user to allow retry
        if (userCredential) {
            await deleteUser(userCredential.user).catch(delErr => {
              console.error("Cleanup Error: Failed to delete orphaned auth user.", delErr);
            });
        }
      
        let errorMessage = "No se pudo crear la cuenta. " + (error.message || "Por favor, inténtalo de nuevo.");
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
        }
        console.error("Member Registration Error:", error);
        toast({ title: "Error de Registro", description: errorMessage, variant: "destructive" });
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
          <>
            <FormField
              control={form.control}
              name="companyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de la Compañía</FormLabel>
                  <FormControl>
                    <Input placeholder="Pega el código que te dio tu administrador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en el Equipo</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el rol que te asignaron" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Miembro">Miembro del Equipo</SelectItem>
                      <SelectItem value="Operations Manager">Admin de Operaciones</SelectItem>
                      <SelectItem value="CEO">CEO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
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
