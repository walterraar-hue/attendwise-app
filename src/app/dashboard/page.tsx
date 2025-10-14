

'use client';
import { Clock, AlertTriangle, UserCheck, UserX, ArrowRight, ClipboardCheck, History, Users, Settings, BarChartHorizontal } from 'lucide-react';
import Header from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


const QUICK_ACTIONS = {
    'Global Admin': [
        {
            title: 'Registrar Asistencia',
            description: 'Inicia tu jornada laboral registrando tu llegada al centro asignado.',
            href: '/dashboard/register-attendance',
            icon: ClipboardCheck
        },
        {
            title: 'Mi Historial',
            description: 'Consulta tus registros de entrada y gestiona tus jornadas.',
            href: '/dashboard/my-history',
            icon: History
        },
        {
            title: 'Gestión de Equipo',
            description: 'Administra los miembros, roles y permisos de tu equipo.',
            href: '/dashboard/team-management',
            icon: Users
        },
        {
            title: 'Configuración',
            description: 'Añade centros de trabajo y ajusta las opciones de la compañía.',
            href: '/dashboard/settings',
            icon: Settings
        },
    ],
    'CEO': [
        {
            title: 'Ver Indicadores',
            description: 'Accede al dashboard con las métricas clave de la compañía.',
            href: '/dashboard/gm-indicators',
            icon: BarChartHorizontal
        },
        {
            title: 'Gestión de Equipo',
            description: 'Supervisa los miembros y la estructura del equipo.',
            href: '/dashboard/team-management',
icon: Users
        },
    ],
    'Operations Manager': [
        {
            title: 'Ver Indicadores',
            description: 'Revisa las métricas de asistencia y puntualidad del equipo.',
            href: '/dashboard/om-indicators',
            icon: BarChartHorizontal
        },
        {
            title: 'Gestión de Equipo',
            description: 'Administra los miembros del equipo y sus roles operativos.',
            href: '/dashboard/team-management',
            icon: Users
        },
         {
            title: 'Registrar Asistencia',
            description: 'Inicia tu jornada laboral registrando tu llegada al centro asignado.',
            href: '/dashboard/register-attendance',
            icon: ClipboardCheck
        },
    ],
    'Miembro': [
        {
            title: 'Registrar Asistencia',
            description: 'Inicia tu jornada laboral registrando tu llegada al centro asignado.',
            href: '/dashboard/register-attendance',
            icon: ClipboardCheck
        },
        {
            title: 'Mi Historial',
            description: 'Consulta tus registros de entrada y gestiona tus jornadas.',
            href: '/dashboard/my-history',
            icon: History
        },
    ],
    // Default empty state
    'Manager': []
}


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData, isLoading } = useDoc<AppUser>(userDocRef);

  const userRole = userData?.role || 'Miembro';
  const userName = userData?.name?.split(' ')[0] || 'Usuario';
  const relevantActions = QUICK_ACTIONS[userRole] || QUICK_ACTIONS['Miembro'];

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">¡Hola de nuevo, <span className="text-primary">{userName}</span>!</h1>
        <p className="text-muted-foreground">¿Qué te gustaría hacer hoy?</p>
      </div>

      <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
        {relevantActions.map((action) => (
          <Card key={action.title} className="flex flex-col hover:border-primary/80 transition-all duration-200 group">
             <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
                <div className="bg-primary/10 p-3 rounded-full">
                    <action.icon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">{action.description}</p>
            </CardContent>
            <div className="p-6 pt-0">
                <Button asChild variant="ghost" className="p-0 h-auto text-primary">
                    <Link href={action.href}>
                        Ir a {action.title}
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
