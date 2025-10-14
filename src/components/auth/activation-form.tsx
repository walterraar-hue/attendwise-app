

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch, serverTimestamp, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


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
  companyCode: z.string().min(1, "Company code is required."),
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

  const isPendingUserFlow = mode === 'member';

  const form = useForm({
    resolver: zodResolver(isPendingUserFlow ? memberSchema : adminSchema),
    defaultValues: isPendingUserFlow
      ? { name: "", email: "", companyCode: "", password: "" }
      : { name: "", email: "", password: "" },
  });

  const handleAdminSubmit = async (values: z.infer<typeof adminSchema>) => {
    setIsLoading(true);
    if (!plan) {
      toast({ title: "Error", description: "No plan selected.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const newCompanyRef = doc(collection(firestore, 'companies'));

      const roleLimits: Record<string, number> = {
        'Global Admin': 0, 'CEO': 0, 'Operations Manager': 0, 'Manager': 0, 'Miembro': 0,
      };

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

      const companyData = {
        id: newCompanyRef.id,
        name: `${values.name}'s Company`,
        subscriptionPlan: plan,
        usedSlots: 1,
        createdAt: serverTimestamp(),
        roleLimits: roleLimits,
      };

      const userData = {
        id: user.uid,
        companyId: newCompanyRef.id,
        email: values.email,
        name: values.name,
        role: 'Global Admin',
        status: 'active',
      };
      
      const adminRoleData = { admin: true };

      const batch = writeBatch(firestore);
      batch.set(newCompanyRef, companyData);
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, userData);
      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      batch.set(adminRoleRef, adminRoleData);

      await batch.commit();

      toast({ title: "¡Éxito!", description: `Equipo creado correctamente. Ahora puedes iniciar sesión.`, });
      router.push('/login');

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Correo electrónico en uso",
          description: "Este correo electrónico ya está registrado. Por favor, utiliza otro.",
        });
      } else if (error.code && error.code.includes('permission-denied')) {
         const permissionError = new FirestorePermissionError({
              path: `BATCH WRITE to admin, user, and company`,
              operation: 'write', 
              requestResourceData: { 
                  "Note": "This was a batch write. The error could be on any of the following documents.",
                  "/companies/{newCompanyId}": { name: `${values.name}'s Company`, plan: plan },
                  "/users/{newUserId}": { email: values.email, role: "Global Admin" },
                  "/roles_admin/{newUserId}": { admin: true }
              }
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } finally {
        setIsLoading(false);
    }
  };

  const handleMemberSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsLoading(true);
    try {
      // Step 1: Find the pending user document that the admin created.
      const usersRef = collection(firestore, "users");
      const q = query(
        usersRef, 
        where("email", "==", values.email), 
        where("companyId", "==", values.companyCode),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Invitación no encontrada",
          description: "No se encontró una invitación pendiente para este email y código de empresa. Por favor, verifica los datos o contacta a tu administrador.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Step 2: Just create the user in Firebase Auth. The activation will happen on first login.
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      toast({
        title: "¡Cuenta Creada!",
        description: "Tu cuenta ha sido creada. Por favor, inicia sesión para completar la activación.",
      });
      router.push("/login");

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Correo electrónico en uso",
          description: "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
        });
      } else {
        console.error("Member creation error:", error);
        toast({
          title: "Error de Creación",
          description: error.message || "No se pudo crear la cuenta. Verifica tus datos e inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(mode === 'admin' ? handleAdminSubmit : handleMemberSubmit)}
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
        {isPendingUserFlow && (
          <FormField
            control={form.control}
            name="companyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de la Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="El código de tu empresa" {...field} className="font-code"/>
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
