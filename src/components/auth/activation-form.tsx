"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch, serverTimestamp, getDoc, increment } from "firebase/firestore";

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
      
      const newCompanyRef = doc(firestore, 'companies', user.uid); // Use user's UID for company ID for simplicity

      const roleLimits: Record<string, number> = { 'Global Admin': 0, 'CEO': 0, 'Operations Manager': 0, 'Manager': 0, 'Miembro': 0 };

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
          roleLimits['Manager'] = 5;
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

      try {
          // Invert flow: First, create the Auth user.
          const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user;

          // Now that the user is authenticated, validate company and slots.
          const companyRef = doc(firestore, "companies", values.companyCode);
          const companySnap = await getDoc(companyRef);

          if (!companySnap.exists()) {
              throw new Error("El código de compañía no es válido.");
          }

          const companyData = companySnap.data();
          const memberLimit = companyData.roleLimits?.['Miembro'] ?? 0;
          const managerLimit = companyData.roleLimits?.['Manager'] ?? 0;
          const totalLimit = (memberLimit === -1 || managerLimit === -1) ? Infinity : (memberLimit + managerLimit);

          if (totalLimit !== Infinity && companyData.usedSlots >= totalLimit) {
              throw new Error("La compañía ha alcanzado su límite de usuarios.");
          }
          
          // If all validations pass, commit the user document and update company slots.
          const batch = writeBatch(firestore);

          const userDocRef = doc(firestore, "users", user.uid);
          batch.set(userDocRef, {
              id: user.uid,
              uid: user.uid,
              companyId: values.companyCode,
              email: values.email,
              name: values.name,
              role: 'Miembro',
              status: 'active', // STATUS IS ACTIVE FROM THE START
              createdAt: serverTimestamp(),
          });
          
          batch.update(companyRef, {
              usedSlots: increment(1)
          });
          
          await batch.commit();

          toast({
              title: "¡Registro Completo!",
              description: "Tu cuenta ha sido creada y activada. ¡Bienvenido!",
          });
          router.push('/dashboard');

      } catch (error: any) {
          let errorMessage = "No se pudo crear la cuenta. " + error.message;
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
