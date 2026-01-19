'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Wrench } from 'lucide-react';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((p) => p.id === 'login-background');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 text-center">
            <div className="flex items-center justify-center gap-2">
                <Wrench className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">MechMind</h1>
            </div>
            <p className="text-balance text-muted-foreground">
                Modo de desenvolvimento: autenticação desabilitada.
            </p>
            <Button asChild>
                <Link href="/dashboard">Ir para o Painel</Link>
            </Button>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            width="1200"
            height="1800"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            data-ai-hint={loginImage.imageHint}
          />
        )}
      </div>
    </div>
  );
}
