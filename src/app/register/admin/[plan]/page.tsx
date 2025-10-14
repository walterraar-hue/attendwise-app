import Link from 'next/link';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivationForm } from '@/components/auth/activation-form';
import { Badge } from '@/components/ui/badge';

export default function RegisterAdminWithPlanPage({ params }: { params: { plan: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-md">
        <Button asChild variant="ghost" className="absolute left-4 top-4">
            <Link href="/register/admin">
                <ArrowLeft className="mr-2 size-4" />
                Volver a Planes
            </Link>
        </Button>
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo className="text-primary" logoTextClassName="text-foreground" />
            <CardTitle className="font-headline text-2xl">Crear un Nuevo Equipo</CardTitle>
            <CardDescription>
              Estás a punto de registrarte con el plan <Badge variant="secondary" className="capitalize">{params.plan}</Badge>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivationForm mode="admin" plan={params.plan} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
