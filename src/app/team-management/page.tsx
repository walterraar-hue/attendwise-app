
'use client'

import Header from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Users, Star, User as UserIcon, Crown, UserCog } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { collection, query, where, doc } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { User, UserRole } from "@/lib/types";
import { InviteMemberDialog } from "@/components/dashboard/invite-member-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MembersTable } from "@/components/dashboard/members-table";
import { Skeleton } from "@/components/ui/skeleton";


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

function PlanUsageCard({ company, users }: { company: any; users: User[] }) {
    const planName = company?.subscriptionPlan || 'N/A';

    const allPossibleRoles: { name: UserRole; icon: React.ReactNode; displayName: string }[] = [
        { name: 'Global Admin', icon: <UserIcon className="size-5 text-red-500" />, displayName: 'Global Admin' },
        { name: 'CEO', icon: <Crown className="size-5 text-yellow-500" />, displayName: 'CEO' },
        { name: 'Operations Manager', icon: <Star className="size-5 text-blue-500" />, displayName: 'Admin de Operaciones' },
        { name: 'Manager', icon: <UserCog className="size-5 text-indigo-500" />, displayName: 'Manager' },
        { name: 'Miembro', icon: <Users className="size-5 text-green-500" />, displayName: 'Miembros' },
    ];

    const { roleDetails, totalMemberLimit, usedSlots } = useMemo(() => {
        if (!company?.roleLimits) {
            return { roleDetails: [], totalMemberLimit: 0, usedSlots: 0 };
        }
        
        const companyRoleLimits = company.roleLimits;

        const roles = allPossibleRoles
            .map(roleInfo => {
                const limit = companyRoleLimits[roleInfo.name] ?? 0;
                const used = users.filter(u => u.role === roleInfo.name).length;
                return { ...roleInfo, limit, used };
            })
            .filter(role => role.limit > 0 || role.limit === -1); 

        const totalLimit = roles.reduce((acc, role) => {
            if (role.name === 'Global Admin' || role.name === 'CEO' || role.name === 'Operations Manager') {
                return acc;
            }
            if (role.limit === -1) return Infinity;
            if (acc === Infinity) return Infinity;
            return acc + role.limit;
        }, 0);

        const currentUsedSlots = users.filter(u => u.role === 'Miembro' || u.role === 'Manager').length;
        
        return { roleDetails: roles, totalMemberLimit: totalLimit, usedSlots: currentUsedSlots };
    }, [company, users]);


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
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium">Uso Total de Miembros</p>
                        <p className="text-lg font-bold">
                            {usedSlots} / {totalMemberLimit === Infinity ? 'Ilimitados' : totalMemberLimit}
                        </p>
                    </div>
                     <Progress value={totalMemberLimit === Infinity || totalMemberLimit === 0 ? 0 : (usedSlots / totalMemberLimit) * 100} />
                </div>
                 
                <Separator />

                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-medium">Uso de Cupos por Rol</h4>
                   {roleDetails.length > 0 ? roleDetails.map(role => (
                        <div key={role.name} className="space-y-2">
                            <div className="flex items-center gap-3">
                                {role.icon}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm">{role.displayName}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {role.used} / {role.limit === -1 ? 'Ilimitados' : role.limit}
                                        </Badge>
                                    </div>
                                    <Progress value={role.limit === -1 || role.limit === 0 ? 0 : (role.used / role.limit) * 100} className="h-2 mt-1" />
                                </div>
                            </div>
                        </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay información de cupos disponible para este plan.</p>
                    )}
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
    const { data: companyData, isLoading: companyLoading } = useDoc(companyDocRef);

    const usersQuery = useMemoFirebase(() => {
        if (!companyId || !firestore) return null;
        return query(collection(firestore, 'users'), where('companyId', '==', companyId));
    }, [companyId, firestore]);

    const { data: companyUsers, isLoading: usersLoading } = useCollection<User>(usersQuery);

    const isLoading = companyLoading || usersLoading;


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header title="Gestión de Equipo" />
        {companyData && companyUsers && <InviteMemberDialog company={companyData as any} users={companyUsers} />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        {isLoading || !companyData || !companyUsers ? (
             <Card className="lg:col-span-2">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </CardContent>
            </Card>
        ) : (
            <div className="lg:col-span-2 grid grid-cols-1 gap-8">
              <PlanUsageCard company={companyData} users={companyUsers || []} />
            </div>
        )}
         <div className="lg:col-span-1">
            {isLoading || !companyId ? <Skeleton className="h-48 w-full" /> : <InvitationCode companyId={companyId} />}
         </div>
      </div>
      
      <Separator />

      <div className="space-y-4 mt-8">
        <Header title="Miembros del Equipo" />
        {isLoading || !companyUsers ? (
            <p>Cargando miembros...</p>
        ) : (
            <MembersTable data={companyUsers || []} />
        )}
      </div>

    </div>
  );
}
