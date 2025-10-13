import Link from 'next/link';
import { ArrowRight, Building, KeyRound } from 'lucide-react';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline text-2xl">Welcome to AttendWise</CardTitle>
            <CardDescription>Your modern attendance solution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">Select a role to continue</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button asChild size="lg" className="h-auto py-3">
                <Link href="/dashboard?role=admin">
                  <div className="flex flex-col items-center gap-2">
                    <Building className="size-6" />
                    <span>Login as Admin</span>
                    <span className="text-xs font-normal text-primary-foreground/70">Full access</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-auto py-3">
                <Link href="/dashboard?role=manager">
                  <div className="flex flex-col items-center gap-2">
                    <KeyRound className="size-6" />
                    <span>Login as Manager</span>
                    <span className="text-xs font-normal text-secondary-foreground/70">Team overview</span>
                  </div>
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>
             <p className="text-center text-sm text-muted-foreground">
              New user? Activate your account. Your company ID is: <br />
              <span className="font-code text-primary">ATTEND-WISE-DEMO</span>
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/activate">
                Activate Account
                <ArrowRight className="ml-2 size-4" />
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
