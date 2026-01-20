'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted">
        <Card className="mx-auto w-full max-w-sm text-center">
            <CardHeader>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Wrench className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">OSMECH</h1>
                </div>
                <CardTitle>Função Desabilitada</CardTitle>
                <CardDescription>
                    A recuperação de senha está temporariamente desabilitada para fins de teste.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/dashboard">Ir para o Painel</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
