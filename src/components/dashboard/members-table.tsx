

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Company, User, UserRole, UserStatus } from "@/lib/types";
import { MoreHorizontal, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { useFirestore } from "@/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const statusVariant: Record<UserStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  pending: "secondary",
  inactive: "destructive",
};

const statusColor: Record<UserStatus, string> = {
    active: 'bg-green-500',
    pending: 'bg-amber-500',
    inactive: 'bg-red-500',
}

const availableRoles: UserRole[] = ['CEO', 'Operations Manager', 'Miembro'];

export function MembersTable({ data, company, users }: { data: User[], company: Company | null, users: User[] }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    if (!firestore || !user.id || !company) return;
    if (user.role === newRole) return;

    //--- Validation Logic ---
    const roleLimit = company.roleLimits?.[newRole] ?? 0;
    
    if (roleLimit === 0) {
        toast({
            variant: "destructive",
            title: "Rol no disponible",
            description: `El rol '${newRole}' no está incluido en el plan actual de la compañía.`,
        });
        return;
    }

    if (roleLimit !== -1) { // -1 means unlimited
        const currentRoleCount = users.filter(u => u.role === newRole).length;
        if (currentRoleCount >= roleLimit) {
            toast({
                variant: "destructive",
                title: "Cupos Agotados",
                description: `No hay cupos disponibles para el rol de ${newRole}.`,
            });
            return;
        }
    }
    // --- End Validation ---

    try {
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', user.id);
      batch.update(userDocRef, { role: newRole });

      const adminRoleRef = doc(firestore, 'roles_admin', user.id);
      const isAdminRoleNew = newRole === 'CEO' || newRole === 'Operations Manager';
      const isAdminRoleOld = user.role === 'CEO' || user.role === 'Operations Manager';

      if (isAdminRoleNew) {
        batch.set(adminRoleRef, { admin: true, role: newRole });
      } else if (isAdminRoleOld && !isAdminRoleNew) {
        batch.delete(adminRoleRef);
      }
      
      await batch.commit();

      toast({
        title: "Rol Actualizado",
        description: `El rol de ${user.name} ha sido cambiado a ${newRole}.`,
      });

    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el rol. Por favor, inténtalo de nuevo.",
      });
    }
  };


  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden md:table-cell">Rol</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">
                    <p>{user.name}</p>
                    <p className="text-sm text-muted-foreground hidden sm:block">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[user.status]} className="capitalize flex items-center gap-2">
                    <span className={ `h-2 w-2 rounded-full ${statusColor[user.status]}`}></span>
                    {user.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{user.role}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={user.role === 'Global Admin'}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <UserCog className="mr-2 h-4 w-4" />
                        Cambiar Rol
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {availableRoles.map(role => (
                           <DropdownMenuItem 
                              key={role} 
                              onClick={() => handleChangeRole(user, role)}
                              disabled={user.role === role}
                           >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {role}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Desactivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
