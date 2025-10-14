

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Camera, MapPin, Wand2, LogIn, LogOut, ArrowRight, VideoOff, Loader2, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { checkoutPunctualityAnalysis } from '@/ai/flows/checkout-punctuality-analysis';

const ACCEPTABLE_ACCURACY_METERS = 100;
const LOCATION_TIMEOUT_MS = 20000; // 20 seconds

// Dialog to show full details of a closed record
function AttendanceDetailsDialog({ record, isOpen, onClose }: { record: AttendanceRecord | null; isOpen: boolean; onClose: () => void; }) {
  if (!record) return null;

  const checkInMapLink = record.checkInLocation ? `https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}` : '#';
  const checkOutMapLink = record.checkOutLocation ? `https://www.google.com/maps?q=${record.checkOutLocation.latitude},${record.checkOutLocation.longitude}` : '#';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Detalles Completos del Registro</AlertDialogTitle>
          <AlertDialogDescription>
            {`Jornada del ${format(record.checkInTimestamp.toDate(), "eeee, d 'de' MMMM", { locale: es })}.`}
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
                <p className="text-sm text-muted-foreground">Aún no has registrado tu salida.</p>
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

// Dialog to handle the check-out process
function CheckOutDialog({ record, isOpen, onClose }: { record: AttendanceRecord | null; isOpen: boolean; onClose: () => void; }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [location, setLocation] = useState<{latitude: number, longitude: number, accuracy: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset state when dialog is opened/closed or record changes
    if (isOpen) {
        setStep(1);
        setCapturedImage(null);
        setLocation(null);
        setLocationError(null);
        setIsLocating(false);
        setRetryCount(0);
    }
  }, [isOpen, record]);


   useEffect(() => {
    if (isOpen && step === 1) {
        setIsLocating(true);
        setLocation(null);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError("Geolocalización no soportada por el navegador.");
            setIsLocating(false);
            return;
        }

        const locationTimeout = setTimeout(() => {
            if (isLocating) { // Check if we are still locating
                setLocationError("Se agotó el tiempo para obtener la ubicación.");
                setIsLocating(false);
            }
        }, LOCATION_TIMEOUT_MS);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(locationTimeout);
                const { latitude, longitude, accuracy } = pos.coords;
                if (accuracy > ACCEPTABLE_ACCURACY_METERS) {
                    setLocationError(`Precisión (${accuracy.toFixed(0)}m) muy baja. Inténtalo en un lugar con mejor señal.`);
                    setIsLocating(false);
                    return;
                }
                setLocation({ latitude, longitude, accuracy });
                setLocationError(null);
                setIsLocating(false);
            },
            (err) => {
                clearTimeout(locationTimeout);
                let message = "Error al obtener la ubicación. Revisa los permisos.";
                if (err.code === err.PERMISSION_DENIED) message = "Permiso de ubicación denegado.";
                if (err.code === err.POSITION_UNAVAILABLE) message = "Ubicación no disponible.";
                if (err.code === err.TIMEOUT) message = "Se agotó el tiempo para obtener la ubicación.";
                setLocationError(message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS - 2000, maximumAge: 0 }
        );
    }
  }, [isOpen, step, retryCount, isLocating]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      if (isOpen && step === 2 && !capturedImage) {
        setHasCameraPermission(true);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({ variant: 'destructive', title: 'Acceso a Cámara Denegado' });
        }
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen, step, capturedImage, toast]);


  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        setCapturedImage(canvas.toDataURL('image/png'));
        
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  };

  const handleRetryLocation = () => {
    if (!isLocating) {
      setRetryCount(count => count + 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!user || !firestore || !record || !capturedImage || !location) {
        toast({ variant: "destructive", title: "Faltan datos" });
        return;
    }
    setIsSubmitting(true);
    let aiCheckoutAnalysis: string | null = null;

    try {
        // AI Analysis
        if (record.appointmentEndTime) {
            const now = new Date();
            const [hours, minutes] = record.appointmentEndTime.split(':').map(Number);
            const appointmentEndDateTime = new Date();
            appointmentEndDateTime.setHours(hours, minutes, 0, 0);
            
            // Positive means they left early, negative means they stayed late
            const diffMinutes = (appointmentEndDateTime.getTime() - now.getTime()) / 60000;
            
            const result = await checkoutPunctualityAnalysis({ minutesDifference: Math.round(diffMinutes) });
            aiCheckoutAnalysis = result.analysis;
        }

        const imagePath = `attendances/${user.uid}/checkout_${new Date().toISOString()}.png`;
        const imageStorageRef = storageRef(getStorage(), imagePath);
        await uploadString(imageStorageRef, capturedImage, 'data_url');
        const imageUrl = await getDownloadURL(imageStorageRef);

        const recordRef = doc(firestore, `users/${user.uid}/attendanceRecords`, record.id);
        await updateDoc(recordRef, {
            checkOutTimestamp: serverTimestamp(),
            checkOutLocation: location,
            checkOutImageUrl: imageUrl,
            status: 'closed',
            aiCheckoutAnalysis: aiCheckoutAnalysis,
        });

        toast({ title: "¡Salida Registrada!", description: "Tu jornada ha finalizado correctamente." });
        onClose();
    } catch (error) {
        console.error("Check-out error:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la salida." });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar Salida</DialogTitle>
                <DialogDescription>Completa los pasos para finalizar tu jornada del {format(record.checkInTimestamp.toDate(), "d 'de' MMMM", { locale: es })}.</DialogDescription>
            </DialogHeader>

            {step === 1 && (
                <div className="space-y-4 py-4">
                    <Label>Paso 1: Verificación de Ubicación</Label>
                    <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/50 min-h-[60px]">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                            {isLocating && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin" />Obteniendo ubicación...</p>}
                            {location && <p className="text-sm text-green-600">Ubicación obtenida con precisión de {location.accuracy.toFixed(0)}m.</p>}
                            {!isLocating && locationError && <p className="text-sm text-destructive">{locationError}</p>}
                        </div>
                    </div>
                     {!isLocating && locationError ? (
                       <Button className="w-full" onClick={handleRetryLocation} variant="outline" disabled={isLocating}>
                         <RefreshCw className="mr-2 h-4 w-4" />
                         Reintentar Ubicación
                       </Button>
                     ) : (
                       <Button className="w-full" onClick={() => setStep(2)} disabled={!location || isLocating}>
                            {isLocating ? 'Obteniendo...' : 'Siguiente'} <ArrowRight className="ml-2" />
                       </Button>
                     )}
                </div>
            )}
            
            {step === 2 && (
                <div className="space-y-4 py-4">
                    <Label>Paso 2: Verificación Facial</Label>
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                        {capturedImage ? ( <Image src={capturedImage} alt="Captured attendance" layout="fill" objectFit="contain" /> ) : ( <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />)}
                        {!capturedImage && hasCameraPermission === false && <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-destructive"><VideoOff className="h-12 w-12" /><p className="mt-2">Cámara no disponible</p></div>}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                     <div className="flex justify-center gap-4">
                        {!capturedImage ? (
                            <Button onClick={handleCapture} disabled={!hasCameraPermission}><Camera className="mr-2" />Tomar Foto</Button>
                        ) : (
                            <Button onClick={() => setCapturedImage(null)} variant="outline">Tomar de Nuevo</Button>
                        )}
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setStep(1)} disabled={isSubmitting}>Volver</Button>
                        <Button className="w-full" onClick={handleSubmit} disabled={!capturedImage || isSubmitting}>
                            {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Finalizando...</> : "Finalizar Jornada"}
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
    </Dialog>
  );
}


export default function MyHistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<AttendanceRecord | null>(null);
  const [selectedRecordForCheckOut, setSelectedRecordForCheckOut] = useState<AttendanceRecord | null>(null);

  const attendanceQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `users/${user.uid}/attendanceRecords`),
        orderBy('checkInTimestamp', 'desc')
    );
  }, [user, firestore]);

  const { data: records, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Mi Historial de Asistencia" />
      <Card>
        <CardHeader>
          <CardTitle>Mis Registros</CardTitle>
          <CardDescription>
            Aquí puedes ver todas tus jornadas laborales y registrar tus salidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Fecha</TableHead>
                            <TableHead>Hora Citado (Entrada)</TableHead>
                            <TableHead>Hora Registro (Entrada)</TableHead>
                            <TableHead>Hora Citado (Salida)</TableHead>
                            <TableHead>Hora Registro (Salida)</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {records && records.length > 0 ? (
                        records.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell>
                                <div className="font-medium capitalize">{format(record.checkInTimestamp.toDate(), "eeee, d 'de' MMMM", { locale: es })}</div>
                                <div className="text-sm text-muted-foreground">{format(record.checkInTimestamp.toDate(), "yyyy")}</div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{record.appointmentTime}</div>
                            </TableCell>
                             <TableCell>
                                <div className="font-medium">{format(record.checkInTimestamp.toDate(), "p", { locale: es })}</div>
                            </TableCell>
                            <TableCell>
                                {record.appointmentEndTime ? (
                                    <div className="font-medium">{record.appointmentEndTime}</div>
                                ) : (
                                    <Badge variant="outline">N/A</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                {record.checkOutTimestamp ? (
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
                               {record.status === 'open' ? (
                                 <Button variant="destructive" size="sm" onClick={() => setSelectedRecordForCheckOut(record)}>
                                   Registrar Salida
                                 </Button>
                               ) : (
                                 <Button variant="outline" size="sm" onClick={() => setSelectedRecordForDetails(record)}>
                                   Ver Detalles
                                 </Button>
                               )}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
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
      isOpen={!!selectedRecordForDetails}
      onClose={() => setSelectedRecordForDetails(null)}
      record={selectedRecordForDetails}
    />

    <CheckOutDialog 
        isOpen={!!selectedRecordForCheckOut}
        onClose={() => setSelectedRecordForCheckOut(null)}
        record={selectedRecordForCheckOut}
    />
    </>
  );
}
