

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { UserPlus, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { User, UserRole } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, writeBatch, increment } from "firebase/firestore";


const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.string().min(1, "Role is required") as z.ZodType<UserRole>,
});

const ALL_ROLES_MAP = new Map<UserRole, string>([
    ['CEO', 'CEO'],
    ['Operations Manager', 'Admin de Operaciones'],
    ['Manager', 'Manager'],
    ['Miembro', 'Miembro'],
]);


export function InviteMemberDialog({ company, users }: { company: { id: string, roleLimits?: Record<string, number>, usedSlots: number }; users: User[] }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "Miembro" },
  });

  const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
    if (!firestore) {
        toast({ title: "Error", description: "Firestore no está disponible.", variant: "destructive" });
        return;
    }
    
    // Logic to check role limits
    const roleLimit = company.roleLimits?.[values.role] ?? 0;
    const usersInRole = users.filter(u => u.role === values.role).length;
    
    if (roleLimit !== -1 && usersInRole >= roleLimit) {
        toast({
            title: "Límite de Rol Alcanzado",
            description: `No puedes añadir más usuarios con el rol '${values.role}'.`,
            variant: "destructive",
        });
        return;
    }
    
    try {
        const batch = writeBatch(firestore);

        const newUserDocRef = doc(collection(firestore, "users"));
        batch.set(newUserDocRef, {
            id: newUserDocRef.id,
            companyId: company.id,
            email: values.email,
            role: values.role,
            status: 'pending',
            name: 'Usuario Pendiente',
            createdAt: serverTimestamp(),
        });
        
        const companyRef = doc(firestore, "companies", company.id);
        batch.update(companyRef, { usedSlots: increment(1) });
        
        await batch.commit();
        
        toast({
            title: "Invitación Enviada",
            description: `${values.email} ha sido invitado al equipo. Necesitan registrarse para activar su cuenta.`,
        });
        form.reset();
        setOpen(false);

    } catch (error) {
        console.error("Error inviting user:", error);
        toast({
            title: "Error al Invitar",
            description: "No se pudo enviar la invitación. Por favor, inténtalo de nuevo.",
            variant: "destructive",
        });
    }
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
            Introduce el email y el rol del nuevo miembro. Recibirá una invitación para unirse y crear su cuenta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="nuevo.miembro@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {Array.from(ALL_ROLES_MAP.entries()).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar Invitación"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
