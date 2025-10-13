import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  // A simple redirect to a default dashboard. In a real app, you'd handle auth.
  // We'll just default to manager view.
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="manager@example.com" defaultValue="manager@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" defaultValue="password" />
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard?role=manager">
                Login
              </Link>
            </Button>
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
