'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Wrench, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';

export default function SignupPage() {
  const loginImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({
        variant: 'destructive',
        title: 'ERRO',
        description: 'PREENCHA TODOS OS CAMPOS.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: name });

      // The onAuthStateChanged listener in FirebaseProvider will now handle
      // creating the workshop and user documents.

      toast({
        title: 'CONTA CRIADA!',
        description: 'SUA CONTA E SUA OFICINA FORAM CRIADAS COM SUCESSO.',
      });
      router.replace('/dashboard');
    } catch (error: any) {
      let description = 'NÃO FOI POSSÍVEL CRIAR SUA CONTA. TENTE NOVAMENTE.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'ESTE E-MAIL JÁ ESTÁ EM USO. TENTE FAZER LOGIN.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A SENHA É MUITO FRACA. USE PELO MENOS 6 CARACTERES.';
      }
      toast({
        variant: 'destructive',
        title: 'ERRO NO CADASTRO',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // The onAuthStateChanged listener in FirebaseProvider will now handle
      // creating the workshop and user documents for the new user.

      toast({
        title: 'CONTA CRIADA!',
        description: 'SUA CONTA E SUA OFICINA FORAM CRIADAS COM SUCESSO.',
      });
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Google Signup Error: ", error.message);
      toast({
        variant: 'destructive',
        title: 'ERRO NO CADASTRO COM O GOOGLE',
        description:
          'NÃO FOI POSSÍVEL SE CADASTRAR COM O GOOGLE. POR FAVOR, TENTE NOVAMENTE.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

   if (isUserLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                 <div className="mt-4 text-center text-sm">
                    Não é você?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => auth.signOut()}>
                        Sair
                    </Button>
                </div>
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
              Crie sua conta para começar a gerenciar sua oficina.
            </p>
          </div>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">NOME COMPLETO</Label>
              <Input
                id="name"
                placeholder="JOHN DOE"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
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
              <Label htmlFor="password">SENHA</Label>
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
              CRIAR CONTA
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            CADASTRAR COM GOOGLE
          </Button>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
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
