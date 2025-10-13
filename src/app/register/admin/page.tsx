import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Basic - Smart Presence',
        slug: 'basic',
        price: '699.000',
        description: 'Control esencial y confiable, ideal para operaciones reducidas.',
        trial: 'Disfruta 7 días de prueba. Luego, el valor del plan.',
        implementation: '900.000',
        features: [
            'Registro con GPS y selfie obligatoria',
            'Validación con hora exacta del servidor',
            'Historial individual y exportación simple',
            'Soporte remoto estándar',
            'Actualizaciones automáticas',
            'Hasta 50 empleados activos',
        ],
        isPro: false,
    },
    {
        name: 'Pro - Operational Insight',
        slug: 'pro',
        price: '1.090.000',
        description: 'Control inteligente y análisis de asistencia sin complicaciones.',
        trial: 'Disfruta 7 días de prueba. Luego, el valor del plan.',
        implementation: '1.300.000',
        features: [
            'Todo del Plan Basic',
            'Reportes automáticos diarios y mensuales',
            'Alertas de tardanza y ausentismo',
            'Dashboard interactivo con indicadores clave',
            'Soporte prioritario y mantenimiento mensual',
            'Hasta 80 empleados activos',
        ],
        isPro: true,
    },
    {
        name: 'Premium - Core-AI Presence',
        slug: 'premium',
        price: '1.390.000',
        description: 'Crecimiento sin límites, análisis inteligente y soporte prioritario.',
        trial: 'Disfruta 7 días de prueba. Luego, el valor del plan.',
        implementation: '1.800.000',
        features: [
            'Todo del Plan Pro',
            'Empleados ilimitados',
            'IA integrada (Gemini) para patrones',
            'Resúmenes y recomendaciones automáticas',
            'Soporte premium y mantenimiento total',
            'Backups automáticos',
        ],
        isPro: false,
    }
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold font-headline">Elige el Plan Perfecto para tu Equipo</h1>
          <p className="text-muted-foreground mt-2">
            Desde control esencial hasta análisis con IA, tenemos un plan que se adapta a tus necesidades. Todos los precios son en COP.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`flex flex-col ${plan.isPro ? 'border-primary border-2 shadow-lg' : ''}`}>
              <CardHeader>
                <CardTitle className="font-headline text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div>
                    <p className="text-4xl font-bold">${plan.price} <span className="text-lg font-normal text-muted-foreground">COP /mes</span></p>
                    <p className="text-primary font-semibold text-sm">{plan.trial}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                    Implementación inicial: ${plan.implementation}
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={plan.isPro ? 'default' : 'outline'}>
                  <Link href={`/register/admin/${plan.slug}`}>Seleccionar Plan</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
