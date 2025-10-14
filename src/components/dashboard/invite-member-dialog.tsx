

"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, writeBatch, increment } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import type { User, UserRole } from "@/lib/types";

const inviteFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
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
  const { user: adminUser } = useUser();
  
  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { name: "", email: "", role: "Miembro" },
  });

  const availableRoles = useMemo(() => {
    const limits = company.roleLimits || {};
    const roles: { value: UserRole, label: string }[] = [];

    ALL_ROLES_MAP.forEach((label, role) => {
        const limit = limits[role];
        if (limit > 0 || limit === -1) {
            roles.push({ value: role, label: label });
        }
    });

    return roles;
  }, [company.roleLimits]);


  const onSubmit = async (values: z.infer<typeof inviteFormSchema>) => {
    if (!adminUser || !company?.id || !firestore) {
        toast({ title: "Error", description: "No se pudo identificar la compañía.", variant: "destructive"});
        return;
    }

    const userExists = users.some(u => u.email === values.email);
    if(userExists) {
        toast({ title: "Usuario ya existe", description: "Un usuario con este correo electrónico ya es parte del equipo.", variant: "destructive"});
        return;
    }
    
    const roleLimits = company.roleLimits || {};
    const roleLimit = roleLimits[values.role] ?? 0;
    const usersInRole = users.filter(u => u.role === values.role).length;

    if (roleLimit !== -1 && usersInRole >= roleLimit) {
        toast({
            title: "Límite de Rol Alcanzado",
            description: `Has alcanzado el límite de cupos para el rol '${values.role}'.`,
            variant: "destructive"
        });
        return;
    }

    try {
        const batch = writeBatch(firestore);
        
        const newUserRef = doc(collection(firestore, "users"));
        batch.set(newUserRef, {
            companyId: company.id,
            name: values.name,
            email: values.email,
            role: values.role,
            status: "active" // Set status to active directly
        });

        const companyRef = doc(firestore, "companies", company.id);
        batch.update(companyRef, {
            usedSlots: increment(1)
        });

        await batch.commit();

        toast({
            title: "Usuario Invitado",
            description: `${values.name} ha sido añadido al equipo. Ahora puede registrarse con su email y código de empresa.`,
        });
        form.reset();
        setOpen(false);

    } catch(error) {
        console.error("Error creating invitation:", error);
        toast({ title: "Error", description: "No se pudo crear la invitación.", variant: "destructive" });
    }
  }

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
          <DialogTitle>Invitar a un nuevo usuario</DialogTitle>
          <DialogDescription>
            El usuario será añadido como 'activo'. Deberá registrarse con su email y el código de la compañía para acceder.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.d@example.com" {...field} />
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
                        {availableRoles.length > 0 ? (
                            availableRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))
                        ) : (
                            <SelectItem value="loading" disabled>Cargando roles...</SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
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
