
'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, VideoOff, ArrowLeft, Loader2, MapPin, CheckCircle, AlertTriangleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

// Mock data for work centers
const workCenters = [
  { id: 'wc-01', name: 'Centro de Operaciones Principal' },
  { id: 'wc-02', name: 'Bodega Central' },
  { id: 'wc-03', name: 'Oficina Satélite Norte' },
  { id: 'wc-04', name: 'Punto de Venta Plaza Mayor' },
];

export default function RegisterAttendancePage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState(1);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Form state
  const [appointmentTime, setAppointmentTime] = useState('');
  const [workCenter, setWorkCenter] = useState('');
  
  // Geolocation state
  const [location, setLocation] = useState<{latitude: number, longitude: number, accuracy: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Effect for Geolocation
  useEffect(() => {
    if (step === 1 && !location && !locationError) {
      setIsLocating(true);
      if (!navigator.geolocation) {
        setLocationError("La geolocalización no es soportada por tu navegador.");
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy > 100) {
              setLocationError(`La precisión de la ubicación (${accuracy.toFixed(0)}m) es muy baja. Intenta de nuevo en un lugar con mejor señal.`);
              setLocation(null);
          } else {
              setLocation({ latitude, longitude, accuracy });
              setLocationError(null);
          }
          setIsLocating(false);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Permiso de ubicación denegado. Es necesario para registrar la asistencia.");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("Información de ubicación no disponible.");
              break;
            case error.TIMEOUT:
              setLocationError("Se agotó el tiempo para obtener la ubicación.");
              break;
            default:
              setLocationError("Ocurrió un error desconocido al obtener la ubicación.");
              break;
          }
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [step, location, locationError]);


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
            title: "Ubicación Requerida",
            description: "No se ha podido obtener tu ubicación. Por favor, verifica los permisos e inténtalo de nuevo.",
        });
        return;
    }
    setStep(2);
  }

  useEffect(() => {
    async function setupCamera() {
      if (step !== 2 || capturedImage) return;

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

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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


      // Stop the video stream after capture
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };
  
  const handleRetake = () => {
     setCapturedImage(null);
     setHasCameraPermission(null); // Reset to trigger camera setup
     // The useEffect will automatically re-run and set up the camera
  };

  const handleSubmit = () => {
    // Here you would handle the submission of the data,
    // including appointmentTime, workCenter, capturedImage, and location
    console.log({
        appointmentTime,
        workCenter,
        location,
        image: capturedImage ? 'Image captured' : 'No Image'
    })
    toast({
      title: '¡Registro Enviado!',
      description: 'Tu asistencia ha sido registrada correctamente.',
    });
    // Reset state after submission
    setStep(1);
    setAppointmentTime('');
    setWorkCenter('');
    setCapturedImage(null);
    setHasCameraPermission(null);
    setLocation(null);
    setLocationError(null);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Registrar Asistencia" />
      <div className="max-w-2xl mx-auto">
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
                        <Select value={workCenter} onValueChange={setWorkCenter}>
                        <SelectTrigger id="work-center">
                            <SelectValue placeholder="Selecciona un centro" />
                        </SelectTrigger>
                        <SelectContent>
                            {workCenters.map(center => (
                            <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Verificación de Ubicación</Label>
                       <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/50">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                              {isLocating && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Loader2 className="animate-spin h-4 w-4" />
                                      <span>Obteniendo ubicación...</span>
                                  </div>
                              )}
                              {locationError && (
                                  <div className="flex items-center gap-2 text-sm text-destructive">
                                      <AlertTriangleIcon className="h-4 w-4" />
                                      <span>{locationError}</span>
                                  </div>
                              )}
                              {location && (
                                  <div className="flex items-center gap-2 text-sm text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>Ubicación obtenida con éxito (precisión: {location.accuracy.toFixed(0)}m).</span>
                                  </div>
                              )}
                          </div>
                      </div>
                    </div>


                    <Button className="w-full" onClick={handleNextStep} disabled={isLocating || !!locationError || !location}>
                      {isLocating ? 'Verificando...' : 'Siguiente'}
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {capturedImage ? (
                          <Image src={capturedImage} alt="Captured attendance" fill objectFit="contain" />
                      ) : (
                          <div className="relative w-full h-full flex items-center justify-center">
                              <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                              {hasCameraPermission === null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                  <p>Cargando cámara...</p>
                                </div>
                              )}
                              {hasCameraPermission === false && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-destructive p-4">
                                      <VideoOff className="mx-auto h-12 w-12" />
                                      <p className="mt-2 font-semibold">Cámara no disponible</p>
                                      <p className="text-sm text-center">No se pudo acceder a la cámara. Revisa los permisos de tu navegador.</p>
                                  </div>
                              )}
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
                        <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <Button className="w-full" onClick={handleSubmit} disabled={!capturedImage}>
                            Notificar Ingreso y Enviar
                        </Button>
                    </div>
                </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


    