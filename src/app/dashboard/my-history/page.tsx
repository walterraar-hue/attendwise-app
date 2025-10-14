

'use client';

import React, { useState } from 'react';
import Header from "@/components/dashboard/header";
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Camera, MapPin, Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

function AttendanceDetailsDialog({
  record,
  isOpen,
  onClose,
}: {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!record) return null;

  const mapLink = record.location
    ? `https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`
    : '#';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Detalles del Registro</AlertDialogTitle>
          <AlertDialogDescription>
            {`Detalles del registro del ${format(record.timestamp.toDate(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })} a las ${format(record.timestamp.toDate(), "p", { locale: es })}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {record.aiAnalysis && (
            <div className="p-3 rounded-md bg-purple-50 border border-purple-200">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-purple-800">
                    <Wand2 className="size-4" />
                    Análisis de Puntualidad
                </h3>
                <p className="text-purple-700 text-sm mt-1">{record.aiAnalysis}</p>
            </div>
          )}

          {record.imageUrl && (
            <div>
              <Label className="flex items-center gap-2"><Camera className="size-4" /> Foto Capturada</Label>
              <div className="mt-1 rounded-md overflow-hidden border">
                <Image
                  src={record.imageUrl}
                  alt="Detalle de foto de asistencia"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}
          {record.location && (
            <div>
              <Label className="flex items-center gap-2"><MapPin className="size-4" /> Ubicación Registrada</Label>
              <p className="text-sm text-muted-foreground">
                Precisión: {record.location.accuracy.toFixed(0)} metros.
              </p>
              <Button variant="link" asChild className="p-0 h-auto">
                <a href={mapLink} target="_blank" rel="noopener noreferrer">
                  Ver en Google Maps
                </a>
              </Button>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Cerrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function MyHistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const attendanceQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `users/${user.uid}/attendanceRecords`),
        orderBy('timestamp', 'desc')
    );
  }, [user, firestore]);

  const { data: records, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  const handleViewDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record);
  };

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Mi Historial de Asistencia" />
      <Card>
        <CardHeader>
          <CardTitle>Mis Registros</CardTitle>
          <CardDescription>
            Aquí puedes ver todos tus registros de entrada y salida.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora Citado</TableHead>
                        <TableHead>Hora Registro</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {records && records.length > 0 ? (
                        records.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell>
                            <div className="font-medium capitalize">
                                {format(record.timestamp.toDate(), "eeee, d 'de' MMMM", { locale: es })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {format(record.timestamp.toDate(), "yyyy", { locale: es })}
                            </div>
                            </TableCell>
                            <TableCell>{record.appointmentTime}</TableCell>
                            <TableCell>
                                {format(record.timestamp.toDate(), "p", { locale: es })}
                            </TableCell>
                            <TableCell>
                                <Badge variant="default">Registrado</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button variant="outline" size="sm" onClick={() => handleViewDetails(record)}>
                                 Ver Detalles
                               </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No tienes registros de asistencia todavía.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
    <AttendanceDetailsDialog
      isOpen={!!selectedRecord}
      onClose={() => setSelectedRecord(null)}
      record={selectedRecord}
    />
    </>
  );
}
