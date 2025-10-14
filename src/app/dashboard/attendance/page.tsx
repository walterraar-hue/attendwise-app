
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, doc, getDocs, orderBy, FirestoreError } from 'firebase/firestore';
import type { AttendanceRecord, WorkCenter, User as AppUser } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building, User as UserIcon, AlertTriangle, LogIn, LogOut, Camera, MapPin, Wand2, MessageSquareWarning } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type AggregatedRecord = AttendanceRecord & { userName: string; userEmail: string };

function AttendanceDetailsDialog({ record, workCenterName, isOpen, onClose }: { record: AggregatedRecord | null; workCenterName: string; isOpen: boolean; onClose: () => void; }) {
  if (!record) return null;

  const checkInMapLink = record.checkInLocation ? `https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}` : '#';
  const checkOutMapLink = record.checkOutLocation ? `https://www.google.com/maps?q=${record.checkOutLocation.latitude},${record.checkOutLocation.longitude}` : '#';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Detalles del Registro de {record.userName}</AlertDialogTitle>
          <AlertDialogDescription>
            {`Jornada del ${format(record.checkInTimestamp.toDate(), "eeee, d 'de' MMMM", { locale: es })} en ${workCenterName}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          
          <div className="space-y-2">
            {record.aiPunctualityAnalysis && (
              <div className="p-3 rounded-md bg-purple-50 border border-purple-200">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-purple-800"><Wand2 className="size-4" />Análisis de Puntualidad (Entrada)</h3>
                  <p className="text-purple-700 text-sm mt-1">{record.aiPunctualityAnalysis}</p>
              </div>
            )}
             {record.aiCheckoutAnalysis && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-800"><Wand2 className="size-4" />Análisis de Salida</h3>
                  <p className="text-blue-700 text-sm mt-1">{record.aiCheckoutAnalysis}</p>
              </div>
            )}
            {record.checkOutJustification && (
              <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-yellow-800"><MessageSquareWarning className="size-4" />Justificación de Salida Temprana</h3>
                  <p className="text-yellow-700 text-sm mt-1">{record.checkOutJustification}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><LogIn className="text-green-500" /> Entrada</h3>
              <Separator />
              <p className="text-sm"><span className="font-semibold">Hora Citado:</span> {record.appointmentTime}</p>
              <p className="text-sm"><span className="font-semibold">Hora Registro:</span> {format(record.checkInTimestamp.toDate(), "p", { locale: es })}</p>
              <div>
                <Label className="flex items-center gap-2 mb-1"><Camera className="size-4" /> Foto de Entrada</Label>
                <div className="rounded-md overflow-hidden border"><Image src={record.checkInImageUrl} alt="Foto de entrada" width={300} height={225} className="w-full h-auto object-cover" /></div>
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-1"><MapPin className="size-4" /> Ubicación de Entrada</Label>
                <p className="text-xs text-muted-foreground">Precisión: {record.checkInLocation.accuracy.toFixed(0)} metros.</p>
                <Button variant="link" asChild className="p-0 h-auto text-xs"><a href={checkInMapLink} target="_blank" rel="noopener noreferrer">Ver en Google Maps</a></Button>
              </div>
            </div>
            {/* Check-out Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><LogOut className="text-red-500" /> Salida</h3>
              <Separator />
              {record.checkOutTimestamp ? (
                <>
                 {record.appointmentEndTime && <p className="text-sm"><span className="font-semibold">Hora Fin Citado:</span> {record.appointmentEndTime}</p>}
                 <p className="text-sm"><span className="font-semibold">Hora Registro:</span> {format(record.checkOutTimestamp.toDate(), "p", { locale: es })}</p>
                  <div>
                    <Label className="flex items-center gap-2 mb-1"><Camera className="size-4" /> Foto de Salida</Label>
                    <div className="rounded-md overflow-hidden border"><Image src={record.checkOutImageUrl!} alt="Foto de salida" width={300} height={225} className="w-full h-auto object-cover" /></div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-1"><MapPin className="size-4" /> Ubicación de Salida</Label>
                    <p className="text-xs text-muted-foreground">Precisión: {record.checkOutLocation!.accuracy.toFixed(0)} metros.</p>
                    <Button variant="link" asChild className="p-0 h-auto text-xs"><a href={checkOutMapLink} target="_blank" rel="noopener noreferrer">Ver en Google Maps</a></Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">El empleado aún no ha registrado su salida.</p>
              )}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Cerrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function AttendancePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [allRecords, setAllRecords] = useState<AggregatedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AggregatedRecord | null>(null);

  // 1. Get current user's data to find companyId and role
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData, isLoading: isUserLoading } = useDoc<AppUser>(userDocRef);
  const companyId = userData?.companyId;
  const userRole = userData?.role;

  // 2. Protect route
  useEffect(() => {
    if (!isUserLoading && userData && userRole !== 'Global Admin' && userRole !== 'Operations Manager') {
      router.replace('/dashboard');
    }
  }, [userData, isUserLoading, userRole, router]);

  // 3. Get all users in the company
  const companyUsersQuery = useMemoFirebase(() => {
    if (!companyId || !firestore) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', companyId));
  }, [companyId, firestore]);
  const { data: companyUsers, isLoading: areUsersLoading, error: usersError } = useCollection<AppUser>(companyUsersQuery);

  // 4. Fetch all attendance records for all users (Optimized with Promise.all)
  useEffect(() => {
    if (usersError) {
      setGlobalError(usersError.message);
      setIsLoading(false);
      return;
    }

    if (!companyUsers || !firestore) {
        if (!areUsersLoading && !isUserLoading) setIsLoading(false);
        return;
    }

    const fetchAllRecords = async () => {
      setIsLoading(true);
      setGlobalError(null);
      let permissionErrorOccurred = false;

      try {
        const recordPromises = companyUsers.map(async (member) => {
          const attendanceRef = collection(firestore, `users/${member.id}/attendanceRecords`);
          const q = query(attendanceRef, orderBy('checkInTimestamp', 'desc'));
          const attendanceSnap = await getDocs(q);
          return attendanceSnap.docs.map(doc => {
            const docData = doc.data() as AttendanceRecord;
            return { 
              ...docData,
              id: doc.id,
              userName: member.name,
              userEmail: member.email,
            };
          });
        });

        const results = await Promise.allSettled(recordPromises);
        
        const aggregatedRecords: AggregatedRecord[] = [];
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            aggregatedRecords.push(...result.value);
          } else {
            const error = result.reason;
            if (error instanceof FirestoreError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
              permissionErrorOccurred = true;
            }
          }
        });

        if (permissionErrorOccurred) {
           setGlobalError("No tienes permisos para ver los registros de asistencia de todos los miembros. Por favor, contacta a tu administrador para ajustar las reglas de seguridad de Firestore y permitir que los administradores lean los registros de otros usuarios.");
        }
        
        // Sort all records together by timestamp
        aggregatedRecords.sort((a, b) => {
          const timeA = a.checkInTimestamp?.toDate?.().getTime() || 0;
          const timeB = b.checkInTimestamp?.toDate?.().getTime() || 0;
          return timeB - timeA;
        });
        
        setAllRecords(aggregatedRecords);

      } catch (e) {
        setGlobalError("Ocurrió un error inesperado al cargar los registros.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRecords();
  }, [companyUsers, firestore, usersError]);


  // 5. Fetch work centers for names
  const workCentersQuery = useMemoFirebase(() => {
      if (!companyId || !firestore) return null;
      return collection(firestore, `companies/${companyId}/workCenters`);
  }, [companyId, firestore]);
  const { data: workCenters, isLoading: isLoadingWorkCenters } = useCollection<WorkCenter>(workCentersQuery);
  
  const workCenterMap = useMemo(() => {
    if (!workCenters) return {};
    return workCenters.reduce((acc, center) => {
      acc[center.id] = center.name;
      return acc;
    }, {} as { [key: string]: string });
  }, [workCenters]);

  const isLoadingData = isLoading || isLoadingWorkCenters || areUsersLoading || isUserLoading;

  if (!isUserLoading && userData && userRole !== 'Global Admin' && userRole !== 'Operations Manager') {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="max-w-4xl mx-auto">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        No tienes permiso para acceder a esta página.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
  }
  
  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Asistencia del Equipo" />

       {globalError && (
          <Alert variant="destructive" className="max-w-4xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de Permisos</AlertTitle>
              <AlertDescription>{globalError}</AlertDescription>
          </Alert>
       )}

      <Card>
        <CardHeader>
          <CardTitle>Todos los Registros</CardTitle>
          <CardDescription>
            Visualiza el historial de asistencia de todos los miembros de tu equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingData && !allRecords.length ? (
                <>
                  <div className="md:hidden space-y-4">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                  </div>
                  <div className="hidden md:block">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                  <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                  <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                                  <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                                  <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                                  <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {[...Array(5)].map((_, i) => (
                                  <TableRow key={i}>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
                </>
            ) : (
                <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {allRecords && allRecords.length > 0 ? (
                        allRecords.map((record) => (
                            <Card key={record.id} className="w-full">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{record.userName}</CardTitle>
                                            <CardDescription className="text-xs">{record.userEmail}</CardDescription>
                                        </div>
                                        <Badge variant={record.status === 'open' ? 'secondary' : 'default'} className="capitalize">
                                            {record.status === 'open' ? 'Abierto' : 'Cerrado'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Fecha:</span>
                                        <span className="font-medium capitalize">{format(record.checkInTimestamp.toDate(), "d MMM, yyyy", { locale: es })}</span>
                                    </div>
                                     <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Centro:</span>
                                        <span className="font-medium">{workCenterMap[record.workCenterId] || 'N/A'}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Entrada:</span>
                                        <span className="font-medium">{format(record.checkInTimestamp.toDate(), "p", { locale: es })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Salida:</span>
                                        <span className="font-medium">
                                            {record.checkOutTimestamp ? format(record.checkOutTimestamp.toDate(), "p", { locale: es }) : <Badge variant="outline">Pendiente</Badge>}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="pt-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedRecord(record)} className="w-full">
                                            Ver Detalles
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <div className="h-24 text-center flex flex-col justify-center items-center">
                            {!globalError && "No hay registros de asistencia en el equipo todavía."}
                        </div>
                    )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Centro de Trabajo</TableHead>
                                <TableHead>Entrada (Registro)</TableHead>
                                <TableHead>Salida (Registro)</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {allRecords && allRecords.length > 0 ? (
                            allRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                    <UserIcon className="size-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">{record.userName}</div>
                                        <div className="text-xs text-muted-foreground">{record.userEmail}</div>
                                    </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {record.checkInTimestamp?.toDate ? (
                                        <>
                                            <div className="font-medium capitalize">{format(record.checkInTimestamp.toDate(), "d MMM, yyyy", { locale: es })}</div>
                                            <div className="text-sm text-muted-foreground">{format(record.checkInTimestamp.toDate(), "eeee", { locale: es })}</div>
                                        </>
                                    ) : 'Fecha inválida'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                    <Building className="size-4 text-muted-foreground" />
                                    <span className="font-medium">{workCenterMap[record.workCenterId] || 'N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {record.checkInTimestamp?.toDate ? (
                                        <div className="font-medium">{format(record.checkInTimestamp.toDate(), "p", { locale: es })}</div>
                                    ) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {record.checkOutTimestamp?.toDate ? (
                                        <div className="font-medium">{format(record.checkOutTimestamp.toDate(), "p", { locale: es })}</div>
                                    ) : (
                                        <Badge variant="outline">Pendiente</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={record.status === 'open' ? 'secondary' : 'default'} className="capitalize">
                                        {record.status === 'open' ? 'Abierto' : 'Cerrado'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedRecord(record)}>
                                        Ver Detalles
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {!globalError && "No hay registros de asistencia en el equipo todavía."}
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
                </>
            )}
        </CardContent>
      </Card>
    </div>
    
    <AttendanceDetailsDialog
      isOpen={!!selectedRecord}
      onClose={() => setSelectedRecord(null)}
      record={selectedRecord}
      workCenterName={selectedRecord ? workCenterMap[selectedRecord.workCenterId] || 'N/A' : ''}
    />
    </>
  );
}

    