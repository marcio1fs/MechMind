'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wrench } from 'lucide-react';
import { useUser } from '@/firebase';

export default function LandingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // AuthGuard will handle the redirect if the user is "logged in" via the mock.
    // This is just a fallback.
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">OSMECH</h1>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">CARREGANDO AMBIENTE DE DESENVOLVIMENTO...</p>
    </div>
  );
}
