

"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/lib/types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Copy } from "lucide-react";


export function InviteMemberDialog({ company, users }: { company: { id: string, roleLimits?: Record<string, number>, usedSlots: number }; users: User[] }) {
  const [open, setOpen] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(company.id);
    toast({
        title: "Copiado",
        description: "El código de la compañía ha sido copiado al portapapeles.",
    });
  };
  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invitar a un nuevo miembro</DialogTitle>
          <DialogDescription>
            Comparte el código de la compañía con los nuevos miembros para que puedan unirse a tu equipo desde la página de registro.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
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
                <Button size="icon" className="h-10 w-10" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar</span>
                </Button>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
                Los nuevos miembros deben seleccionar su rol al registrarse. Asegúrate de que haya cupos disponibles para el rol que elegirán.
            </p>
        </div>
        <DialogFooter>
            <Button type="button" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
