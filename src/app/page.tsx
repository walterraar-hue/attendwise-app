import Link from 'next/link';
import { Building, UserPlus, LogIn } from 'lucide-react';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-2xl">Bienvenido a AttendWise</CardTitle>
            <CardDescription>Tu solución moderna de asistencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <Link href="/register/admin" passHref>
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Building className="size-8 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Crear un Nuevo Equipo</CardTitle>
                        <CardDescription>Regístrate como Administrador Global para empezar a gestionar tu equipo.</CardDescription>
                    </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/register/member" passHref>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <UserPlus className="size-8 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Unirme a un Equipo</CardTitle>
                            <CardDescription>Usa un código de invitación para unirte al equipo de tu administrador.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </Link>

            <div className="flex items-center gap-4 pt-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">¿Ya tienes una cuenta?</span>
              <Separator className="flex-1" />
            </div>

            <Button asChild variant="secondary" className="w-full">
              <Link href="/login">
                <LogIn className="mr-2" />
                Inicia sesión
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
