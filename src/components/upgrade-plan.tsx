'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface UpgradePlanProps {
    requiredPlan: 'PRO+' | 'PREMIUM';
}

export default function UpgradePlan({ requiredPlan }: UpgradePlanProps) {
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Lock className="h-6 w-6" />
                    Recurso Bloqueado
                </CardTitle>
                <CardDescription className="pt-2">
                    Esta funcionalidade está disponível apenas no plano {requiredPlan} ou superior.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    Faça o upgrade do seu plano para obter acesso a esta e muitas outras funcionalidades avançadas que irão otimizar a gestão da sua oficina.
                </p>
                <Button asChild>
                    <Link href="/pricing">Ver Planos</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
