'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted">
        <Card className="mx-auto w-full max-w-md text-center">
            <CardHeader>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Wrench className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">MechMind</h1>
                </div>
                <CardTitle>Cadastro de Nova Oficina</CardTitle>
                <CardDescription>
                    O auto-cadastro está desabilitado no momento.
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <p className="text-sm text-muted-foreground">
                    Para criar uma nova conta para sua oficina, por favor, entre em contato com nosso suporte para que possamos realizar o processo de configuração inicial para você.
                </p>
                <div className="flex flex-col gap-2">
                    <Button asChild>
                        <a href="mailto:suporte@mechmind.com">Entrar em Contato</a>
                    </Button>
                     <Button asChild variant="link">
                        <Link href="/">Voltar para o Login</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
