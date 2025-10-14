
'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, VideoOff, ArrowLeft, Loader2, MapPin, CheckCircle, AlertTriangleIcon, RefreshCw, Eye, Info, Wand2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { punctualityAnalysis } from '@/ai/flows/punctuality-analysis';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import type { User as AppUser, WorkCenter } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToastAction } from '@/components/ui/toast';
import { cn } from '@/lib/utils';


const ACCEPTABLE_ACCURACY_METERS = 100;
const LOCATION_TIMEOUT_MS = 30000; // 30 seconds

type SubmissionDetails = {
    appointmentTime: string;
    workCenter: string;
    location: { latitude: number, longitude: number, accuracy: number } | null;
    image: string | null;
} | null;

type Status = 'pending' | 'in-progress' | 'success' | 'error';

function StatusIndicator({ status }: { status: Status }) {
  if (status === 'in-progress') {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (status === 'success') {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (status === 'error') {
    return <AlertTriangleIcon className="h-5 w-5 text-destructive" />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground/50" />;
}

function StatusPanel({
  locationStatus,
  cameraStatus,
  punctualityStatus
}: {
  locationStatus: Status,
  cameraStatus: Status,
  punctualityStatus: Status,
}) {
  const steps = [
    { 
      title: 'Verificación de Ubicación', 
      description: 'Se requiere GPS para confirmar tu centro de trabajo.',
      status: locationStatus
    },
    { 
      title: 'Verificación Facial', 
      description: 'Se necesita una foto para validar tu identidad.',
      status: cameraStatus
    },
    { 
      title: 'Análisis de Puntualidad', 
      description: 'Nuestra IA te dará un feedback si llegas temprano.',
      status: punctualityStatus,
      icon: <Wand2 className="h-5 w-5 text-purple-500" />
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panel de Estado del Registro</CardTitle>
        <CardDescription>Sigue tu progreso en tiempo real.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <div className="flex items-start gap-4">
              <div className="flex h-10 items-center">
                 {step.icon ? step.icon : <StatusIndicator status={step.status} />}
              </div>
              <div>
                <p className={cn(
                  "font-semibold",
                  step.status === 'success' && 'text-green-600',
                  step.status === 'error' && 'text-destructive',
                )}>
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
}


export default function RegisterAttendancePage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const locationWatcherId = useRef<number | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [step, setStep] = useState(1);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryLocation, setRetryLocation] = useState(0);

  // Form state
  const [appointmentTime, setAppointmentTime] = useState('');
  const [workCenter, setWorkCenter] = useState('');
  
  // Geolocation state
  const [location, setLocation] = useState<{latitude: number, longitude: number, accuracy: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);

  const [lastSubmission, setLastSubmission] = useState<SubmissionDetails>(null);


  // Fetch user and company data
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData } = useDoc<AppUser>(userDocRef);
  const companyId = userData?.companyId;

  // Fetch work centers
  const workCentersQuery = useMemoFirebase(() => {
      if (!companyId || !firestore) return null;
      return collection(firestore, `companies/${companyId}/workCenters`);
  }, [companyId, firestore]);
  const { data: workCenters, isLoading: isLoadingWorkCenters } = useCollection<WorkCenter>(workCentersQuery);


  // Effect for Geolocation using watchPosition
  useEffect(() => {
    const stopWatching = () => {
      if (locationWatcherId.current !== null) {
        navigator.geolocation.clearWatch(locationWatcherId.current);
        locationWatcherId.current = null;
      }
    };

    if (step === 1) {
      setIsLocating(true);
      setCurrentAccuracy(null);
      setLocation(null);
      setLocationError(null);
      
      if (!('geolocation' in navigator)) {
        setLocationError("La geolocalización no es soportada por tu navegador.");
        setIsLocating(false);
        return;
      }

      const timeoutId = setTimeout(() => {
        if (location) return; 
        stopWatching();
        setLocationError("Se agotó el tiempo para obtener la ubicación. Inténtalo de nuevo.");
        setIsLocating(false);
      }, LOCATION_TIMEOUT_MS);
      
      locationWatcherId.current = navigator.geolocation.watchPosition(
          (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              setCurrentAccuracy(accuracy);
              
              if (accuracy <= ACCEPTABLE_ACCURACY_METERS) {
                  setLocation({ latitude, longitude, accuracy });
                  setLocationError(null);
                  setIsLocating(false);
                  clearTimeout(timeoutId); 
                  stopWatching(); 
              } else {
                 if(!location) { 
                    setLocationError(`Mejorando precisión...`);
                 }
              }
          },
          (error) => {
            clearTimeout(timeoutId); 
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setLocationError("Permiso de ubicación denegado. Es necesario para registrar la asistencia.");
                break;
              case error.POSITION_UNAVAILABLE:
                setLocationError("Información de ubicación no disponible. Revisa tu conexión o señal GPS.");
                break;
              case error.TIMEOUT:
                 setLocationError("Se agotó el tiempo para obtener la ubicación. Inténtalo de nuevo.");
                break;
              default:
                setLocationError("Ocurrió un error desconocido al obtener la ubicación.");
                break;
            }
            setIsLocating(false);
            setCurrentAccuracy(null);
            setLocation(null);
            stopWatching(); 
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
      );
    } else {
      stopWatching();
    }
    return () => {
        stopWatching();
    };
  }, [step, retryLocation]);


  const handleNextStep = () => {
    if (!appointmentTime || !workCenter) {
        toast({
            variant: "destructive",
            title: "Campos Incompletos",
            description: "Por favor, completa la hora y el centro de trabajo.",
        });
        return;
    }
     if (!location) {
        toast({
            variant: "destructive",
            title: "Ubicación No Verificada",
            description: "Espera a que la ubicación sea verificada con la precisión requerida.",
        });
        return;
    }
    setStep(2);
  }

  useEffect(() => {
    async function setupCamera() {
      if (step !== 2 || capturedImage) return;

      setHasCameraPermission(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported');
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Cámara no Soportada',
          description: 'Tu navegador no soporta el acceso a la cámara.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(stream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acceso a Cámara Denegado',
          description: 'Por favor, habilita los permisos de cámara en tu navegador.',
        });
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const dataUrl = canvas.toDataURL('image/png');
          setCapturedImage(dataUrl);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };
  
  const handleRetake = () => {
     setCapturedImage(null);
  };

  const handleRetryLocation = () => {
    setRetryLocation(count => count + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let aiAnalysisToast;

    try {
        const submissionData = {
            appointmentTime,
            workCenter,
            location,
            image: capturedImage
        };
        setLastSubmission(submissionData);

        const now = new Date();
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const appointmentDateTime = new Date();
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const diffMinutes = (appointmentDateTime.getTime() - now.getTime()) / 60000;

        if (diffMinutes > 0) {
            const result = await punctualityAnalysis({ minutesEarly: Math.round(diffMinutes) });
            aiAnalysisToast = result.analysis;
        }

        toast({
          title: '¡Registro Enviado!',
          description: aiAnalysisToast || 'Tu asistencia ha sido registrada correctamente.',
          action: (
             <DialogTrigger asChild>
                <ToastAction altText="Ver Detalles" asChild>
                    <Button variant="secondary" size="sm">
                        <Eye className="mr-2" />
                        Ver Detalles
                    </Button>
                </ToastAction>
            </DialogTrigger>
          ),
        });

        setStep(1);
        setAppointmentTime('');
        setWorkCenter('');
        setCapturedImage(null);
        setHasCameraPermission(null);
        setLocation(null);
        setLocationError(null);
        setCurrentAccuracy(null);
        
    } catch(error) {
        console.error("Submission error:", error);
        toast({
            variant: "destructive",
            title: "Error al Enviar",
            description: "No se pudo registrar la asistencia. Inténtalo de nuevo."
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderLocationStatus = () => {
    if (location) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Ubicación obtenida con precisión de {location.accuracy.toFixed(0)}m.</span>
        </div>
      );
    }
    
    if (isLocating && !currentAccuracy) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Obteniendo ubicación...</span>
        </div>
      );
    }
    
    if (locationError) {
      const isImproving = locationError.startsWith('Mejorando');
      return (
        <div className={`flex items-center gap-2 text-sm ${isImproving ? 'text-amber-600' : 'text-destructive'}`}>
           {isImproving ? <Loader2 className="animate-spin h-4 w-4" /> : <AlertTriangleIcon className="h-4 w-4" />}
          <span>{locationError} {currentAccuracy && `(Precisión actual: ${currentAccuracy.toFixed(0)}m)`}</span>
        </div>
      );
    }

    return null;
  }

  const mapLink = lastSubmission?.location 
    ? `https://www.google.com/maps?q=${lastSubmission.location.latitude},${lastSubmission.location.longitude}`
    : '#';

  const getLocationStatus = (): Status => {
    if (location) return 'success';
    if (isLocating || locationError?.startsWith('Mejorando')) return 'in-progress';
    if (locationError) return 'error';
    return 'pending';
  }

  const getCameraStatus = (): Status => {
    if (step === 1) return 'pending';
    if (capturedImage) return 'success';
    if (hasCameraPermission === null || stream) return 'in-progress';
    if (hasCameraPermission === false) return 'error';
    return 'pending';
  }

  const getPunctualityStatus = (): Status => {
    if (step === 1 && appointmentTime) return 'in-progress';
    if (isSubmitting) return 'in-progress';
    if (lastSubmission) return 'success';
    return 'pending';
  }


  return (
    <Dialog>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header title="Registrar Asistencia" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Ingreso</CardTitle>
                <CardDescription>
                    {step === 1 
                    ? "Completa los detalles de tu cita y verifica tu ubicación." 
                    : "Verifica tu asistencia con una foto en las instalaciones."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="appointment-time">Hora de la Cita</Label>
                            <Input id="appointment-time" type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="work-center">Centro de Trabajo</Label>
                            <Select value={workCenter} onValueChange={setWorkCenter} disabled={isLoadingWorkCenters}>
                            <SelectTrigger id="work-center">
                                <SelectValue placeholder={isLoadingWorkCenters ? "Cargando centros..." : "Selecciona un centro"} />
                            </SelectTrigger>
                            <SelectContent>
                                {workCenters?.map(center => (
                                <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Verificación de Ubicación</Label>
                           <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/50 min-h-[60px]">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                 {renderLocationStatus()}
                              </div>
                          </div>
                        </div>

                        {locationError && !locationError.startsWith('Mejorando') ? (
                           <Button className="w-full" onClick={handleRetryLocation} variant="outline">
                             <RefreshCw className="mr-2 h-4 w-4" />
                             Reintentar Ubicación
                           </Button>
                        ) : (
                           <Button className="w-full" onClick={handleNextStep} disabled={!location || isLocating}>
                            {isLocating ? 'Verificando Ubicación...' : 'Siguiente'}
                           </Button>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                         <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                            {capturedImage ? (
                                <Image src={capturedImage} alt="Captured attendance" layout="fill" objectFit="contain" />
                            ) : (
                                <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                            )}
                            
                            {!capturedImage && hasCameraPermission === null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                    <Loader2 className="animate-spin mr-2" />
                                    <p>Iniciando cámara...</p>
                                </div>
                            )}

                            {!capturedImage && hasCameraPermission === false && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-destructive p-4">
                                    <VideoOff className="mx-auto h-12 w-12" />
                                    <p className="mt-2 font-semibold">Cámara no disponible</p>
                                    <p className="text-sm text-center">No se pudo acceder a la cámara. Revisa los permisos de tu navegador.</p>
                                </div>
                            )}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>

                        <div className="flex justify-center gap-4">
                            {!capturedImage && (
                                <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Tomar Foto
                                </Button>
                            )}
                            {capturedImage && (
                                <Button onClick={handleRetake} variant="outline">
                                    Tomar de Nuevo
                                </Button>
                            )}
                        </div>
                        
                        <Separator />

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" className="w-full" onClick={() => setStep(1)} disabled={isSubmitting}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                            <Button className="w-full" onClick={handleSubmit} disabled={!capturedImage || isSubmitting}>
                               {isSubmitting ? (
                                    <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                    </>
                                ) : (
                                    "Notificar Ingreso y Enviar"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
                
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
             <StatusPanel 
              locationStatus={getLocationStatus()}
              cameraStatus={getCameraStatus()}
              punctualityStatus={getPunctualityStatus()}
             />
          </div>
        </div>
         <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
            <DialogDescription>
              Aquí están los detalles de tu registro de asistencia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              {lastSubmission?.image && (
                  <div>
                      <Label>Foto Capturada</Label>
                      <div className="mt-2 rounded-md overflow-hidden border">
                           <Image src={lastSubmission.image} alt="Detalle de foto de asistencia" width={400} height={300} className="w-full h-auto" />
                      </div>
                  </div>
              )}
              {lastSubmission?.location && (
                   <div>
                      <Label>Ubicación Registrada</Label>
                       <p className="text-sm text-muted-foreground">Precisión: {lastSubmission.location.accuracy.toFixed(0)} metros.</p>
                      <Button variant="link" asChild className="p-0 h-auto">
                          <a href={mapLink} target="_blank" rel="noopener noreferrer">
                              Ver en Google Maps
                          </a>
                      </Button>
                   </div>
              )}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
