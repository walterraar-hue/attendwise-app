'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, doc, getDocs, orderBy } from 'firebase/firestore';
import type { AttendanceRecord, WorkCenter, User as AppUser } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AggregatedRecord = AttendanceRecord & { userName: string; userEmail: string };

export default function AttendancePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [allRecords, setAllRecords] = useState<AggregatedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const userMap = useMemo(() => {
      if (!companyUsers) return new Map();
      return new Map(companyUsers.map(u => [u.id, { name: u.name, email: u.email }]));
  }, [companyUsers]);

  // 4. Fetch all attendance records for all users
  useEffect(() => {
    if (!companyUsers || companyUsers.length === 0 || !firestore) {
        if (!areUsersLoading) setIsLoading(false);
        return;
    }

    const fetchAllRecords = async () => {
      setIsLoading(true);
      const records: AggregatedRecord[] = [];
      
      for (const member of companyUsers) {
        // Since we already have the list of users, we can fetch their attendance records.
        // This assumes that a user can read other users' attendance if they have the right role,
        // which might require a security rule adjustment on the attendanceRecords subcollection.
        // For now, let's assume the rules allow it for admins.
        try {
            const attendanceRef = collection(firestore, `users/${member.id}/attendanceRecords`);
            const attendanceSnap = await getDocs(query(attendanceRef, orderBy('checkInTimestamp', 'desc')));
            attendanceSnap.forEach(doc => {
              const docData = doc.data() as AttendanceRecord;
               // Ensure checkInTimestamp is a Firestore Timestamp before calling toDate()
              if (docData.checkInTimestamp && typeof docData.checkInTimestamp.toDate === 'function') {
                  records.push({ 
                    ...docData,
                    id: doc.id,
                    userName: member.name,
                    userEmail: member.email,
                  });
              }
            });
        } catch (e) {
            // This might fail if security rules don't allow reading other users' subcollections.
            // We'll log it but continue, so the app doesn't crash.
            console.error(`Could not fetch attendance for user ${member.id}:`, e);
        }
      }
      
      // Sort by check-in time, descending
      records.sort((a, b) => {
        const timeA = a.checkInTimestamp?.toDate?.().getTime() || 0;
        const timeB = b.checkInTimestamp?.toDate?.().getTime() || 0;
        return timeB - timeA;
      });
      
      setAllRecords(records);
      setIsLoading(false);
    };

    fetchAllRecords();
  }, [companyUsers, firestore, areUsersLoading]);

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
  
  if (usersError) {
     return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="max-w-4xl mx-auto">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Error de permisos: No se pueden cargar los miembros del equipo. Por favor, contacta al administrador para ajustar las reglas de seguridad de Firestore.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Asistencia del Equipo" />
      <Card>
        <CardHeader>
          <CardTitle>Todos los Registros</CardTitle>
          <CardDescription>
            Visualiza el historial de asistencia de todos los miembros de tu equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingData ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Centro de Trabajo</TableHead>
                            <TableHead>Entrada (Citado)</TableHead>
                            <TableHead>Entrada (Registro)</TableHead>
                            <TableHead>Salida (Registro)</TableHead>
                            <TableHead>Estado</TableHead>
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
                                <div className="font-medium">{record.appointmentTime}</div>
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
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No hay registros de asistencia en el equipo todavía.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
