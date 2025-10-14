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
import { signInWithEmailAndPassword, type User as FirebaseAuthUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// This function will handle the activation logic after a successful login.
const activatePendingUser = async (user: FirebaseAuthUser, firestore: any): Promise<boolean> => {
    const userDocRef = doc(firestore, "users", user.uid);
    
    try {
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().status === 'pending') {
            const companyId = userDoc.data().companyId;
            if (!companyId) {
              console.error("Pending user is missing companyId.");
              return false;
            }
            
            const companyDocRef = doc(firestore, "companies", companyId);

            // Sequential writes to avoid batch permission issues.
            // 1. Activate the user.
            await updateDoc(userDocRef, { 
                status: 'active'
            });

            // 2. Increment the company's used slots.
            await updateDoc(companyDocRef, {
                usedSlots: increment(1)
            });

            return true; // The user was pending and is now active.
        }
        
        return false; // The user was not pending.

    } catch (error) {
        console.error("Error activating pending user:", error);
        // This could be a permission error on the company doc update,
        // but we'll let the user log in anyway.
        return false; 
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
      
      const wasActivated = await activatePendingUser(user, firestore);

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
