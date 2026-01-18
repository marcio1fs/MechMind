'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default function AccessDenied() {
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Lock className="h-6 w-6 text-destructive" />
                    Acesso Negado
                </CardTitle>
                <CardDescription className="pt-2">
                    Você não tem permissão para acessar esta página.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    Esta área é restrita a administradores. Se você acredita que isso é um erro, entre em contato com o administrador da sua oficina.
                </p>
                <Button asChild>
                    <Link href="/dashboard">Voltar para o Painel</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
