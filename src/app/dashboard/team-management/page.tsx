

'use client'

import Header from "@/components/dashboard/header";
import { company as mockCompany, users as mockUsers } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Users, Star, Server } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { useDoc, useCollection } from "@/firebase/firestore/use-doc";
import { doc, collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

function PlanUsageCard({ company, users }: { company: any, users: any[] }) {
    const usedSlots = company?.usedSlots || 0;
    const userLimit = company?.userLimit || 0;
    const planName = company?.subscriptionPlan || 'N/A';
    const progressValue = userLimit > 0 ? (usedSlots / userLimit) * 100 : 0;

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
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Cupos Usados</span>
                        <span className="text-sm font-bold">{usedSlots} / {userLimit === Infinity || userLimit === -1 ? 'Ilimitados' : userLimit}</span>
                    </div>
                    <Progress value={progressValue} aria-label={`${usedSlots} de ${userLimit} cupos usados`} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md">
                        <Users className="size-5 text-primary" />
                        <div>
                            <p className="font-semibold">Usuarios Totales</p>
                            <p className="text-muted-foreground">{users.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md">
                        <Star className="size-5 text-amber-500" />
                        <div>
                            <p className="font-semibold">Managers</p>
                            <p className="text-muted-foreground">{users.filter(u => u.role === 'Manager').length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md">
                        <Server className="size-5 text-green-500" />
                        <div>
                            <p className="font-semibold">Employees</p>
                            <p className="text-muted-foreground">{users.filter(u => u.role === 'Employee').length}</p>
                        </div>
                    </div>
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
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userData } = useDoc(userDocRef);

    const companyId = userData?.companyId;

    const companyDocRef = useMemoFirebase(() => {
        if (!companyId) return null;
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

