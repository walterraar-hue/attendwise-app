'use client'

import Header from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Users, Star, Server, User, Crown } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { collection, query, where, doc } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { User as UserType, UserRole } from "@/lib/types";

// A server component to display the invitation code.
// In a real app, this might be a client component to handle the copy action.
function InvitationCode({ companyId }: { companyId: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(companyId);
    // You might want to show a toast notification here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Código de Invitación del Equipo</CardTitle>
        <CardDescription>
          Comparte este código con los miembros de tu equipo para que puedan unirse.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="invitation-code" className="sr-only">
              Código de Invitación
            </Label>
            <Input
              id="invitation-code"
              defaultValue={companyId}
              readOnly
              className="font-code text-lg"
            />
          </div>
          <Button size="icon" className="h-10 w-10" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copiar</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Los nuevos miembros pueden unirse yendo a la página de registro y seleccionando &quot;Unirme a un Equipo&quot;.
        </p>
      </CardContent>
    </Card>
  );
}

function PlanUsageCard({ company, users }: { company: any, users: UserType[] }) {
    const planName = company?.subscriptionPlan || 'N/A';
    const roleLimits = company?.roleLimits;

    const roleCounts = useMemo(() => {
        return users.reduce((acc, user) => {
            if (user.role === 'Manager' || user.role === 'Employee') {
                acc['Member'] = (acc['Member'] || 0) + 1;
            } else {
                acc[user.role] = (acc[user.role] || 0) + 1;
            }
            return acc;
        }, {} as Record<UserRole | 'Member', number>);
    }, [users]);
    
    const roleDetails: { name: string, limit: number, used: number, icon: React.ReactNode }[] = [
        { name: 'Global Admin', limit: roleLimits?.['Global Admin'], used: roleCounts['Global Admin'] || 0, icon: <User className="size-5 text-red-500" /> },
        { name: 'CEO', limit: roleLimits?.['CEO'], used: roleCounts['CEO'] || 0, icon: <Crown className="size-5 text-yellow-500" /> },
        { name: 'Operations Manager', limit: roleLimits?.['Operations Manager'], used: roleCounts['Operations Manager'] || 0, icon: <Star className="size-5 text-blue-500" /> },
        { name: 'Member', limit: roleLimits?.['Member'], used: roleCounts['Member'] || 0, icon: <Users className="size-5 text-green-500" /> },
    ].filter(role => role.limit !== 0 && role.limit !== undefined);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Tu Plan Actual</span>
                    <Badge variant="secondary" className="capitalize">{planName}</Badge>
                </CardTitle>
                <CardDescription>Resumen del uso de licencias de tu equipo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Uso de Cupos por Rol</p>
                   {roleDetails.map(role => (
                        <div key={role.name} className="flex items-center justify-between p-3 bg-accent/50 rounded-md">
                            <div className="flex items-center gap-3">
                                {role.icon}
                                <span className="font-semibold">{role.name}</span>
                            </div>
                            <Badge variant="outline">
                                {role.used} / {role.limit === -1 ? 'Ilimitados' : role.limit}
                            </Badge>
                        </div>
                    ))}
                </div>

                 <Button className="w-full" variant="outline">
                    Administrar Suscripción
                </Button>
            </CardContent>
        </Card>
    );
}


export default function TeamManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userData } = useDoc(userDocRef);

    const companyId = userData?.companyId;

    const companyDocRef = useMemoFirebase(() => {
        if (!companyId || !firestore) return null;
        return doc(firestore, 'companies', companyId);
    }, [companyId, firestore]);
    const { data: companyData } = useDoc(companyDocRef);

    const usersQuery = useMemoFirebase(() => {
        if (!companyId || !firestore) return null;
        return query(collection(firestore, 'users'), where('companyId', '==', companyId));
    }, [companyId, firestore]);

    const { data: companyUsers } = useCollection(usersQuery);

    const isLoading = !companyData || !companyUsers;


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header title="Gestión de Equipo" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {isLoading ? (
            <p>Cargando...</p>
        ) : (
            <>
                <PlanUsageCard company={companyData} users={companyUsers || []} />
                <InvitationCode companyId={companyId || ''} />
            </>
        )}
      </div>
    </div>
  );
}
