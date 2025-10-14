
'use client';

import Link from 'next/link';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';


const loginSchema = z.object({
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(1, "La contraseña es requerida"),
});

export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoginError(null);
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "El servicio de autenticación no está disponible.",
        });
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo a tu dashboard.",
      });

      router.push('/dashboard');

    } catch (error: any) {
      if(process.env.NODE_ENV !== 'production') console.error("Login error:", error);
      
      let description = "Error desconocido. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        description = "El email o la contraseña no son correctos. Por favor, inténtalo de nuevo.";
      } else if (error.code === 'auth/invalid-email') {
        description = "El formato del email no es válido.";
      }
      setLoginError(description);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="items-center text-center space-y-4">
            <Logo className="text-primary" showSubtitle={true} logoTextClassName="text-foreground" />
            <div className="w-full">
              <CardTitle className="font-headline text-2xl">Bienvenido de Nuevo</CardTitle>
              <CardDescription className="mt-1">Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loginError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {loginError}
                    </AlertDescription>
                </Alert>
            )}
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
                       <div className="flex justify-between items-center">
                          <FormLabel>Contraseña</FormLabel>
                          <Button asChild variant="link" className="p-0 h-auto text-xs">
                             <Link href="#">¿Olvidaste tu contraseña?</Link>
                          </Button>
                       </div>
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
           <CardFooter className="flex-col items-start text-sm space-y-4">
            <Separator />
            <div className="w-full text-center">
                <p className="text-muted-foreground">
                    ¿No tienes una cuenta?{' '}
                    <Button variant="link" asChild className="p-0 h-auto">
                        <Link href="/register/admin">Crear una compañía</Link>
                    </Button>
                </p>
            </div>
            <div className="w-full text-center">
                <p className="text-muted-foreground">
                    ¿Fuiste invitado?{' '}
                    <Button variant="link" asChild className="p-0 h-auto">
                        <Link href="/register/member">Regístrate aquí</Link>
                    </Button>
                </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
