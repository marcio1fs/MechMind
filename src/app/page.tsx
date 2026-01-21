'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('admin@osmech.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On success, the AuthGuard will handle the redirect to '/dashboard'
      // because the onAuthStateChanged listener will update the user state.
    } catch (err: any) { {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('Nenhum usuário encontrado com este e-mail.');
            break;
          case 'auth/wrong-password':
            setError('Senha incorreta. Tente novamente.');
            break;
          case 'auth/invalid-credential':
             setError('Credenciais inválidas. Verifique o e-mail e a senha.');
             break;
          default:
            setError('Ocorreu um erro ao fazer login. Tente novamente.');
            break;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginBg = PlaceHolderImages.find(p => p.id === 'login-background');

  return (
    <div className="w-full lg:grid lg:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center py-12 bg-background">
        <Card className="mx-auto w-full max-w-sm border-none shadow-none">
            <form onSubmit={handleLogin}>
            <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Wrench className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">OSMECH</h1>
                </div>
                <CardTitle className="text-2xl">ENTRAR</CardTitle>
                <CardDescription>
                INSIRA AS CREDENCIAIS PARA ACESSAR O PAINEL.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {error && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                <div className="grid gap-2">
                <Label htmlFor="email">E-MAIL</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@exemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
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
                    disabled={isLoading}
                />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ENTRAR
                </Button>
                <div className="text-center text-sm">
                    <Link href="/forgot-password" passHref>
                        <span className="underline hover:text-primary cursor-pointer">
                            ESQUECEU SUA SENHA?
                        </span>
                    </Link>
                </div>
            </CardFooter>
            </form>
        </Card>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginBg && (
            <Image
                src={loginBg.imageUrl}
                alt={loginBg.description}
                width={1920}
                height={1080}
                className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                data-ai-hint={loginBg.imageHint}
                priority
            />
        )}
      </div>
    </div>
  );
}
