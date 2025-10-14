

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, writeBatch, serverTimestamp, getDoc, increment, query, collection, where, getDocs, updateDoc, setDoc } from "firebase/firestore";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/types";


const memberSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  companyCode: z.string().min(1, "Company code is required."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  role: z.string().min(1, "Role is required") as z.ZodType<UserRole>,
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

const ALL_ROLES_MAP = new Map<UserRole, string>([
    ['CEO', 'CEO'],
    ['Operations Manager', 'Admin de Operaciones'],
    ['Manager', 'Manager'],
    ['Miembro', 'Miembro'],
]);

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
      ? { name: "", email: "", companyCode: "", password: "", role: "Miembro" }
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
      
      const newCompanyRef = doc(firestore, 'companies', doc(firestore, 'companies').id);
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
    if (!auth || !firestore) {
      toast({ title: "Error", description: "Los servicios de Firebase no están disponibles.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { name, email, companyCode, password, role } = values;

    try {
        // Step 1: Create the Auth user FIRST. This gives us an authenticated context.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
            // Step 2: Now that we are authenticated, validate the company and its limits.
            const companyRef = doc(firestore, 'companies', companyCode);
            const companySnap = await getDoc(companyRef);

            if (!companySnap.exists()) {
                throw new Error('El código de la empresa no es válido.');
            }

            const companyData = companySnap.data();
            const roleLimit = companyData.roleLimits?.[role] ?? 0;
            const usersInRole = companyData.roleCounts?.[role] ?? 0;
            
            if (roleLimit !== -1 && usersInRole >= roleLimit) {
                throw new Error(`No hay más cupos disponibles para el rol '${role}'.`);
            }

            // Step 3: Create user document and update company atomically in a batch.
            const batch = writeBatch(firestore);

            const userDocRef = doc(firestore, 'users', user.uid);
            batch.set(userDocRef, {
                id: user.uid,
                companyId: companyCode,
                name: name,
                email: email,
                role: role,
                status: 'active',
                createdAt: serverTimestamp(),
            });

            // Atomically increment the counters.
            const newRoleCount = (companyData.roleCounts?.[role] || 0) + 1;
            batch.update(companyRef, {
                usedSlots: increment(1),
                [`roleCounts.${role}`]: newRoleCount,
            });

            await batch.commit();

            toast({
                title: "¡Cuenta Activada!",
                description: "Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.",
            });
            router.push("/login");

        } catch (validationError: any) {
            // If validation or Firestore writes fail, we must delete the created Auth user to allow retry.
            await deleteUser(user);
            throw validationError; // Re-throw the inner error to be caught by the outer catch block.
        }

    } catch (error: any) {
        let errorMessage = "No se pudo activar la cuenta. Verifica tus datos e inténtalo de nuevo.";
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
        } else {
            console.error("Client-side Member Registration Error:", error);
            errorMessage = error.message || errorMessage;
        }
        toast({ title: "Error de Activación", description: errorMessage, variant: "destructive" });
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
          <>
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
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from(ALL_ROLES_MAP.entries()).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
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
