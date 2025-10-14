

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch, serverTimestamp, collection, setDoc } from "firebase/firestore";

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
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});


const adminSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

function SubmitButton({ mode, isLoading }: { mode: "admin" | "member", isLoading: boolean }) {
  const text = mode === "admin" ? "Crear Equipo" : "Crear Cuenta";
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
      ? { name: "", email: "", password: "" }
      : { name: "", email: "", password: "" },
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
          roleLimits['Miembro'] = -1; 
          roleLimits['Manager'] = 0;
      }

      batch.set(newCompanyRef, {
        id: newCompanyRef.id,
        name: `${values.name}'s Company`,
        subscriptionPlan: plan,
        usedSlots: 1,
        createdAt: serverTimestamp(),
        roleLimits: roleLimits,
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, {
        id: user.uid,
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
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "El servicio de autenticación no está disponible.",
        });
        setIsLoading(false);
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);

        toast({
            title: "¡Cuenta Creada!",
            description: "Tu cuenta ha sido creada. Por favor, inicia sesión para activarla y unirte a tu equipo.",
        });
        router.push("/login");

    } catch (error: any) {
        let errorMessage = "No se pudo crear la cuenta.";
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
        } else {
            console.error("Member Registration Error:", error);
            errorMessage = error.message || errorMessage;
        }
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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isMemberFlow && (
          <p className="text-sm text-muted-foreground pt-2">
              Tu administrador de equipo ya te ha asignado un rol y un código de compañía. Simplemente crea tu cuenta y serás añadido automáticamente al iniciar sesión.
          </p>
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
