'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Wrench, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate a network request for a better UX
    setTimeout(() => {
      // For development, we allow login with specific credentials without hitting Firebase Auth
      if (email.toLowerCase() === 'admin@osmech.com' && password === 'password') {
        // The AuthGuard and FirebaseProvider will use the mocked admin user
        router.push('/dashboard');
      } else {
        setError('E-mail ou senha inválidos para o ambiente de demonstração.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader className="text-center">
             <div className="flex items-center justify-center gap-2 mb-4">
                <Wrench className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">OSMECH</h1>
            </div>
            <CardTitle className="text-2xl">LOGIN</CardTitle>
            <CardDescription>
              INSIRA O E-MAIL E SENHA DE DEMONSTRAÇÃO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-MAIL</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@osmech.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="normal-case placeholder:normal-case"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">SENHA</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    ESQUECEU SUA SENHA?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="normal-case"
                />
              </div>
               {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                LOGIN
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              NÃO TEM UMA CONTA?{' '}
              <Link href="/signup" className="underline">
                CADASTRE-SE
              </Link>
            </div>
          </CardContent>
        </Card>
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
