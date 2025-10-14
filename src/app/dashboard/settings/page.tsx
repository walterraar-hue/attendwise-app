

'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import type { User as AppUser, WorkCenter } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Trash2, Building, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';


const workCenterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
});

function WorkCenterForm({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof workCenterSchema>>({
    resolver: zodResolver(workCenterSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof workCenterSchema>) => {
    setIsSubmitting(true);
    try {
      const workCentersRef = collection(firestore, `companies/${companyId}/workCenters`);
      await addDoc(workCentersRef, {
        name: values.name,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Centro de Trabajo Añadido",
        description: `El centro "${values.name}" ha sido creado.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error adding work center:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el centro de trabajo. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <Card className="h-fit">
      <CardHeader>
        <CardTitle>Añadir Nuevo Centro de Trabajo</CardTitle>
        <CardDescription>Crea un nuevo centro de trabajo para tu compañía.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Centro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Oficina Principal, Bodega Central..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
              <span className="ml-2">Añadir Centro</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function WorkCentersList({ workCenters, companyId, isLoading }: { workCenters: WorkCenter[] | null, companyId: string, isLoading: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleDelete = async (centerId: string) => {
    try {
      const docRef = doc(firestore, `companies/${companyId}/workCenters`, centerId);
      await deleteDoc(docRef);
      toast({
        title: "Centro Eliminado",
        description: "El centro de trabajo ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error deleting work center:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el centro de trabajo.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
          <CardHeader>
            <CardTitle>Centros de Trabajo Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
      </Card>
    )
  }
  
  if (!workCenters || workCenters.length === 0) {
    return (
     <Card>
        <CardHeader>
            <CardTitle>Centros de Trabajo Existentes</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg mt-8">
                <Building className="mx-auto h-12 w-12" />
                <p className="mt-4 text-sm">No hay centros de trabajo creados.</p>
                <p className="text-xs">Usa el formulario de la izquierda para añadir el primero.</p>
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centros de Trabajo Existentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workCenters.map((center) => (
              <TableRow key={center.id}>
                <TableCell className="font-medium">{center.name}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción es permanente y no se puede deshacer. Se eliminará el centro de trabajo <span className="font-bold">"{center.name}"</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(center.id)} className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData, isLoading: isUserLoading } = useDoc<AppUser>(userDocRef);
  
  const companyId = userData?.companyId;

  const workCentersQuery = useMemoFirebase(() => {
      if (!companyId || !firestore) return null;
      return collection(firestore, `companies/${companyId}/workCenters`);
  }, [companyId, firestore]);
  const { data: workCenters, isLoading: isLoadingWorkCenters } = useCollection<WorkCenter>(workCentersQuery);

  useEffect(() => {
    if (!isUserLoading && userData && userData.role !== 'Global Admin') {
      router.replace('/dashboard');
    }
  }, [userData, isUserLoading, router]);

  if (isUserLoading || !userData || userData.role !== 'Global Admin') {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="max-w-4xl mx-auto">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        No tienes permiso para acceder a esta página. Redirigiendo...
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
  }


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Configuración" />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                {companyId ? (
                    <WorkCenterForm companyId={companyId} />
                ) : (
                    <Skeleton className="h-64 w-full" />
                )}
            </div>
            <div className="lg:col-span-3">
                {companyId ? (
                    <WorkCentersList workCenters={workCenters} companyId={companyId} isLoading={isLoadingWorkCenters} />
                ) : (
                    <Skeleton className="h-96 w-full" />
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

    
