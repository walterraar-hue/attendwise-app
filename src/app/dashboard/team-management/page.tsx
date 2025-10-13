import Header from "@/components/dashboard/header";
import { users, company } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

// A server component to display the invitation code.
// In a real app, this might be a client component to handle the copy action.
function InvitationCode() {
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
              defaultValue={company.id}
              readOnly
              className="font-code text-lg"
            />
          </div>
          <Button size="icon" className="h-10 w-10">
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


export default function TeamManagementPage() {
  const currentUser = users.find(u => u.role === 'Global Admin')!;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header user={currentUser} title="Gestión de Equipo" />
      </div>
      <div className="max-w-2xl">
        <InvitationCode />
      </div>
    </div>
  );
}
