
import Link from 'next/link';
import { Building, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function WelcomePage() {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[400px] gap-8">
          <div className="grid gap-2 text-center">
            <Logo className="justify-center" logoTextClassName="text-4xl" showSubtitle={false} />
            <h1 className="text-3xl font-bold tracking-tight mt-4">Bienvenido</h1>
            <p className="text-muted-foreground">
              Tu solución moderna de asistencia. Elige una opción para empezar.
            </p>
          </div>
          
          <div className="grid gap-6">
            <Link href="/register/admin" passHref>
              <div className="group flex items-start gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/5 cursor-pointer">
                <div className="bg-primary/10 text-primary p-3 rounded-md">
                    <Building className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Crear un Nuevo Equipo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Regístrate como Administrador para empezar a gestionar tu equipo.
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/register/member" passHref>
              <div className="group flex items-start gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/5 cursor-pointer">
                <div className="bg-primary/10 text-primary p-3 rounded-md">
                    <UserPlus className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Unirme a un Equipo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usa un código de invitación para unirte al equipo de tu administrador.
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Inicia sesión aquí
              <ArrowRight className="inline-block ml-1 size-4" />
            </Link>
          </div>
          <footer className="text-center text-xs text-muted-foreground">
             &copy; {new Date().getFullYear()} Serlogint Attend. All rights reserved.
          </footer>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://picsum.photos/seed/welcome/1200/1800"
          alt="Abstract background image representing technology and connectivity"
          data-ai-hint="office building"
          width="1200"
          height="1800"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
