
"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// This component is now simplified. It no longer invites users directly.
// It only serves to display the company's invitation code.
export function InviteMemberDialog({ company }: { company: { id: string };}) {
  const { toast } = useToast();
  
  const copyToClipboard = () => {
    if (!company?.id) return;
    navigator.clipboard.writeText(company.id);
    toast({
      title: "¡Copiado!",
      description: "El código de la compañía ha sido copiado a tu portapapeles.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comparte el Código de Invitación</DialogTitle>
          <DialogDescription>
            Copia y comparte este código con los nuevos miembros para que puedan unirse a tu equipo usando la opción "Unirme a un Equipo" en la página de inicio.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Label htmlFor="invitation-code" className="font-semibold">
              Código de la Compañía
            </Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                id="invitation-code"
                defaultValue={company?.id || ''}
                readOnly
                className="font-code text-base"
              />
              <Button size="icon" className="h-10 w-10" onClick={copyToClipboard} disabled={!company?.id}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copiar</span>
              </Button>
            </div>
             <p className="text-sm text-muted-foreground mt-3">
              Los nuevos miembros deben usar este código en el formulario de registro "Unirme a un Equipo".
            </p>
        </div>
        <DialogFooter>
            <DialogTrigger asChild>
                <Button type="button" variant="secondary">Cerrar</Button>
            </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
