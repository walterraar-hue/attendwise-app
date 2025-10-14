
'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, VideoOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  const handleNextStep = () => {
    if (!appointmentTime || !workCenter) {
        toast({
            variant: "destructive",
            title: "Campos Incompletos",
            description: "Por favor, completa la hora y el centro de trabajo.",
        });
        return;
    }
    setStep(2);
  }

  useEffect(() => {
    // Only request camera when we move to step 2
    if (step === 2) {
        const getCameraPermission = async () => {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Camera API not supported');
            setHasCameraPermission(false);
            toast({
                variant: "destructive",
                title: "Cámara no Soportada",
                description: "Tu navegador no soporta el acceso a la cámara.",
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
        };

        getCameraPermission();
    } else {
        // Cleanup: stop the camera stream if we go back to step 1
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }

    return () => {
      // General cleanup when the component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);

      // Stop the video stream after capture
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  const handleRetake = () => {
     setCapturedImage(null); // This will re-trigger the useEffect for step 2
     setStep(2);
  };

  const handleSubmit = () => {
    // Here you would handle the submission of the data,
    // including appointmentTime, workCenter, and capturedImage
    toast({
      title: '¡Registro Enviado!',
      description: 'Tu asistencia ha sido registrada correctamente.',
    });
    // Reset state after submission
    setStep(1);
    setAppointmentTime('');
    setWorkCenter('');
    setCapturedImage(null);
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
                ? "Completa los detalles de tu cita para continuar." 
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
                    <Button className="w-full" onClick={handleNextStep}>Siguiente</Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {hasCameraPermission === null && <p>Cargando cámara...</p>}
                    {hasCameraPermission === false && (
                        <div className="text-center text-destructive p-4">
                        <VideoOff className="mx-auto h-12 w-12" />
                        <p className="mt-2 font-semibold">Cámara no disponible</p>
                        <p className="text-sm">Revisa los permisos de tu navegador.</p>
                        </div>
                    )}
                    
                    {hasCameraPermission && (
                        <div className="relative w-full h-full">
                        {capturedImage ? (
                            <Image src={capturedImage} alt="Captured attendance" layout="fill" objectFit="contain" />
                        ) : (
                            <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                        )}
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>

                    {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Acceso a Cámara Requerido</AlertTitle>
                        <AlertDescription>
                            Por favor, permite el acceso a la cámara para registrar tu asistencia.
                        </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-center gap-4">
                        {hasCameraPermission && !capturedImage && (
                            <Button onClick={handleCapture}>
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

