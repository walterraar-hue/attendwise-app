"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { activateAccount } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";

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

export function ActivationForm({ mode }: { mode: "admin" | "member" }) {
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const companyId = `COMP-${Date.now()}`;
      
      const companyData = {
        id: companyId,
        name: `${values.name}'s Company`,
        ownerId: user.uid, // Add ownerId for security rules
        subscriptionPlan: 'Pro',
        userLimit: 10,
        recordLimit: 1000,
        usedSlots: 1,
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

      batch.commit()
        .then(() => {
            toast({
              title: "Éxito!",
              description: `Team created successfully. You can now log in.`,
            });
            router.push('/login');
        })
        .catch(serverError => {
            setIsLoading(false);
            const permissionError = new FirestorePermissionError({
              path: `BATCH WRITE to companies, users, and roles_admin`,
              operation: 'write', 
              requestResourceData: {
                  company: companyData,
                  user: userData,
                  adminRole: adminRoleData
              }
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: error.code === 'auth/email-already-in-use' 
          ? "This email is already in use. Please try another one."
          : error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
    } 
  };

  const handleMemberSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsLoading(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    try {
        const result = await activateAccount({success: false, message: ""}, formData);
        
        if (result.message) {
          toast({
            title: result.success ? "Éxito!" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
          });
        }
        if (result.success) {
          form.reset();
          router.push('/login');
        }
    } catch(e) {
        // This will likely be a server action error, which is already handled
        // by Next.js's error boundary. We can add more specific client-side
        // error handling here if needed.
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
