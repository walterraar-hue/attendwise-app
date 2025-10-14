
import Link from 'next/link';
import { Building, UserPlus, LogIn } from 'lucide-react';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="justify-center" logoTextClassName="text-4xl text-primary" />
          <h1 className="mt-6 text-3xl font-bold font-headline">Bienvenido</h1>
          <p className="mt-2 text-muted-foreground">
            Tu solución moderna de asistencia. Elige una opción para empezar.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Button asChild size="lg" variant="outline">
            <Link href="/register/admin">
              <Building className="mr-2" />
              Crear un Nuevo Equipo
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register/member">
              <UserPlus className="mr-2" />
              Unirme a un Equipo
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/login">
              ¿Ya tienes una cuenta? Inicia sesión
              <LogIn className="ml-2" />
            </Link>
          </Button>
        </div>
        <footer className="text-center text-xs text-muted-foreground">
             &copy; {new Date().getFullYear()} Serlogint Attend. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
