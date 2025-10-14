
'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import Logo from '@/components/logo';

export function LoadingScreen() {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-background">
        <div className="w-full max-w-xs space-y-4">
            <div className="flex justify-center">
                 <Logo showTitle={false} showSubtitle={true} />
            </div>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-center text-muted-foreground">Cargando...</p>
        </div>
    </div>
  );
}
