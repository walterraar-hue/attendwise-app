"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch, getDoc, serverTimestamp } from "firebase/firestore";

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
  const text = mode === "admin" ? "Crear Equipo" : "Activar Cuenta";
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
      ? { email: "", companyCode: "", password: "" }
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

      const companyId = `COMP-${Date.now()}`;
      
      const companyData = {
        id: companyId,
        name: `${values.name}'s Company`,
        subscriptionPlan: plan,
        userLimit: plan === 'basic' ? 50 : plan === 'pro' ? 80 : Infinity,
        recordLimit: 1000, // Placeholder
        usedSlots: 1,
        createdAt: serverTimestamp()
      };

      const userData = {
        id: user.uid,
        companyId: companyId,
        email: values.email,
        name: values.name,
        role: 'Global Admin',
        status: 'active',
      };
      
      const adminRoleData = { admin: true };

      const batch = writeBatch(firestore);

      const companyDocRef = doc(firestore, 'companies', companyId);
      batch.set(companyDocRef, companyData);

      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, userData);

      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      batch.set(adminRoleRef, adminRoleData);

      await batch.commit();

      toast({
        title: "Éxito!",
        description: `Team created successfully. You can now log in.`,
      });
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
              path: `BATCH WRITE to companies, users, and roles_admin`,
              operation: 'write', 
              requestResourceData: {
                company: {
                    id: `COMP-TIMESTAMP`,
                    name: `${values.name}'s Company`,
                    subscriptionPlan: plan,
                    userLimit: plan === 'basic' ? 50 : plan === 'pro' ? 80 : -1,
                    recordLimit: 1000,
                    usedSlots: 1,
                },
                user: {
                    id: 'NEW_USER_UID',
                    companyId: `COMP-TIMESTAMP`,
                    email: values.email,
                    name: values.name,
                    role: 'Global Admin',
                    status: 'active',
                },
                adminRole: {
                    admin: true,
                },
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
      setIsLoading(false);
    } 
  };

  const handleMemberSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsLoading(true);
    try {
        const companyRef = doc(firestore, "companies", values.companyCode);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            toast({ title: "Error", description: "Invalid Company Code", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        const companyData = companySnap.data();

        const userData = {
          id: user.uid,
          companyId: values.companyCode,
          email: values.email,
          name: user.displayName || "New User", // Placeholder name
          role: 'Employee',
          status: 'active',
        };

        const batch = writeBatch(firestore);
        
        const userDocRef = doc(firestore, 'users', user.uid);
        batch.set(userDocRef, userData);

        batch.update(companyRef, { usedSlots: companyData.usedSlots + 1 });

        await batch.commit();
        
        toast({ title: "Éxito!", description: "Account activated. You can now log in." });
        router.push('/login');

    } catch (error: any) {
        console.error("Error activating member account:", error);
        toast({
            title: "Error",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(mode === 'admin' ? handleAdminSubmit : handleMemberSubmit)}
        className="space-y-4"
      >
        {!isPendingUserFlow && (
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
        )}
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
