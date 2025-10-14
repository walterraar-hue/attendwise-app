import Link from 'next/link';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivationForm } from '@/components/auth/activation-form';

export default function RegisterMemberPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-md">
        <Button asChild variant="ghost" className="absolute left-4 top-4">
            <Link href="/">
                <ArrowLeft className="mr-2 size-4" />
                Volver
            </Link>
        </Button>
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-2xl">Unirme a un Equipo</CardTitle>
            <CardDescription>Introduce tus datos y el código de compañía para unirte.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivationForm mode="member" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
