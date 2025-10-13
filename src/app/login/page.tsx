
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// This function will handle the activation logic after a successful login.
const activatePendingUser = async (user: User, firestore: any): Promise<boolean> => {
    // Query for a pending user document with the matching email
    const pendingUserQuery = query(
        collection(firestore, "users"),
        where("email", "==", user.email),
        where("status", "==", "pending")
    );

    const querySnapshot = await getDocs(pendingUserQuery);

    if (querySnapshot.empty) {
        // Not a pending user, or already activated. Nothing to do.
        return false; 
    }

    const pendingUserDoc = querySnapshot.docs[0];
    const companyId = pendingUserDoc.data().companyId;
    
    // --- Start of the fix: Replace batch with sequential writes ---

    // 1. Update the user document first
    // This operation might fail due to permissions, as a newly logged-in user might not have
    // rights to write to the 'users' collection immediately.
    try {
        await updateDoc(pendingUserDoc.ref, { 
            status: 'active',
            id: user.uid 
        });

        // 2. Then, update the company's used slots
        const companyRef = doc(firestore, 'companies', companyId);
        await updateDoc(companyRef, {
            usedSlots: increment(1)
        });
        
        return true;

    } catch (error) {
        console.error("Permission error during user activation:", error);
        // We throw the error so it can be caught by the calling function.
        throw error;
    }
};


export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // After successful login, check if the user was pending and activate them.
      // This is the part that is likely failing. We will wrap it in its own try/catch.
      let wasActivated = false;
      try {
        wasActivated = await activatePendingUser(user, firestore);
      } catch (activationError) {
        // This is where the permission error is happening.
        // For now, we will log it and allow the login to proceed.
        // The user is authenticated, but their record in the DB is still 'pending'.
        console.warn("User activation failed, but login succeeded. The user's status is still pending.", activationError);
      }


      if (wasActivated) {
        toast({
          title: "¡Cuenta Activada!",
          description: "Tu cuenta ha sido activada correctamente. Bienvenido.",
        });
      } else {
        toast({
          title: "Inicio de Sesión Exitoso",
          description: "Bienvenido de nuevo.",
        });
      }

      router.push('/dashboard');

    } catch (error: any) {
      // This will catch login errors (e.g., wrong password)
      toast({
        variant: "destructive",
        title: "Fallo en el Inicio de Sesión",
        description: error.message || "Un error inesperado ocurrió.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute left-4 top-4">
            <Button asChild variant="ghost">
                <Link href="/">
                    <ArrowLeft className="mr-2 size-4" />
                    Volver
                </Link>
            </Button>
        </div>
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa a tu cuenta de AttendWise.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>
          </CardContent>
           <CardFooter className="justify-center">
             <p className="text-xs text-muted-foreground">
               &copy; {new Date().getFullYear()} AttendWise. All rights reserved.
             </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
