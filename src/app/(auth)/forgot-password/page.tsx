'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Wrench, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const loginImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const auth = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: 'destructive', title: 'ERRO', description: 'POR FAVOR, DIGITE SEU E-MAIL.' });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'E-MAIL ENVIADO',
        description:
          'SE EXISTIR UMA CONTA COM ESTE E-MAIL, UM LINK DE REDEFINIÇÃO DE SENHA FOI ENVIADO.',
      });
    } catch (error: any) {
      console.error(error);
      // We show a generic message for security reasons
      toast({
        title: 'E-MAIL ENVIADO',
        description:
          'SE EXISTIR UMA CONTA COM ESTE E-MAIL, UM LINK DE REDEFINIÇÃO DE SENHA FOI ENVIADO.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Wrench className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">MechMind</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Digite seu e-mail para redefinir sua senha.
            </p>
          </div>
          <form onSubmit={handleResetPassword} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@exemplo.com"
                required
                className="normal-case placeholder:normal-case"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ENVIAR LINK DE REDEFINIÇÃO
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Lembrou da senha?{' '}
            <Link href="/" className="underline">
              Entrar
            </Link>
          </div>
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
