'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Wrench, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: 'destructive', title: 'ERRO', description: 'PREENCHA O E-MAIL E A SENHA.' });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Ensure user document exists to prevent loading deadlocks
      const userDocRef = doc(firestore, "oficinas", "default_oficina", "users", newUser.uid);
      const displayName = newUser.displayName || "Usuário";
      const [firstName, ...lastName] = displayName.split(' ');
      await setDoc(userDocRef, {
        id: newUser.uid,
        oficinaId: "default_oficina",
        firstName: firstName || 'Novo',
        lastName: lastName.join(' ') || 'Usuário',
        email: newUser.email,
        role: "ADMIN",
      }, { merge: true });

      toast({ title: 'SUCESSO', description: 'LOGIN REALIZADO COM SUCESSO.' });
      router.replace('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'ERRO NO LOGIN',
        description: 'CREDENCIAS INVÁLIDAS. VERIFIQUE SEU E-MAIL E SENHA.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const newUser = result.user;

      // Check if user document already exists, if not, create it
      const userDocRef = doc(firestore, "oficinas", "default_oficina", "users", newUser.uid);
      const displayName = newUser.displayName || "Usuário";
      const [firstName, ...lastName] = displayName.split(' ');
      await setDoc(userDocRef, {
        id: newUser.uid,
        oficinaId: "default_oficina",
        firstName: firstName || '',
        lastName: lastName.join(' ') || '',
        email: newUser.email,
        role: "ADMIN",
      }, { merge: true });

      toast({ title: 'SUCESSO', description: 'LOGIN COM O GOOGLE REALIZADO COM SUCESSO.' });
      router.replace('/dashboard'); // Direct redirect on success
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'ERRO NO LOGIN COM O GOOGLE',
        description:
          'NÃO FOI POSSÍVEL FAZER O LOGIN COM O GOOGLE. POR FAVOR, TENTE NOVAMENTE.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // Show a loading spinner only while checking auth state.
  if (isUserLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is already logged in, show a link to the dashboard instead of the form.
  if (user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="mx-auto grid w-[350px] gap-6 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Wrench className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">MechMind</h1>
                </div>
                <p className="text-balance text-muted-foreground">
                    Você já está autenticado.
                </p>
                <Button asChild>
                    <Link href="/dashboard">Ir para o Painel</Link>
                </Button>
            </div>
        </div>
    );
  }


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
              Digite seu e-mail abaixo para fazer login em sua conta
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
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
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar com Google
          </Button>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="underline">
              Cadastre-se
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
