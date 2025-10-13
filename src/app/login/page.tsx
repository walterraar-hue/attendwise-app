import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" defaultValue="password" />
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Login
              </Link>
            </Button>
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
