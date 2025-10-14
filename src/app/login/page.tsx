
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, User as FirebaseAuthUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

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

  const activatePendingUser = async (authUser: FirebaseAuthUser) => {
    // Find the user document that is 'pending' and matches the email.
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", authUser.email), where("status", "==", "pending"));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const pendingUserDoc = querySnapshot.docs[0];
        const companyId = pendingUserDoc.data().companyId;
        
        try {
            // Use a batch to ensure atomicity
            const batch = writeBatch(firestore);

            const userDocRef = doc(firestore, "users", pendingUserDoc.id);
            // Activate the user and stamp the Auth UID
            batch.update(userDocRef, {
                status: "active",
                id: authUser.uid,
            });

            // Increment the company's used slots
            const companyRef = doc(firestore, 'companies', companyId);
            batch.update(companyRef, {
                usedSlots: increment(1)
            });

            await batch.commit();

            toast({
                title: "¡Cuenta Activada!",
                description: "Tu cuenta ha sido activada correctamente."
            });
            
        } catch (error: any) {
            console.error("Error activating user:", error);
            toast({
                variant: "destructive",
                title: "Error de Activación",
                description: "No se pudo activar tu cuenta. Por favor, contacta a soporte.",
            });
            // Log out the user to prevent being in a weird state
            await auth.signOut();
            throw error; // Re-throw to stop navigation
        }
    }
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      // After successful login, check and activate if the user was pending
      await activatePendingUser(userCredential.user);
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo.",
      });

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Fallo en el Inicio de Sesión",
        description: error.message || "Email o contraseña incorrectos.",
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
