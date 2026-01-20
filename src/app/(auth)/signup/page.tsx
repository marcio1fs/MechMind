'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wrench, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { runTransaction, collection, doc, serverTimestamp } from 'firebase/firestore';

const signupSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  oficinaName: z.string().min(1, 'O nome da oficina é obrigatório.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      oficinaName: '',
      email: '',
      password: '',
    },
  });

  const handleSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);

    if (!auth || !firestore) {
      setError("Os serviços de autenticação não estão disponíveis. Tente novamente mais tarde.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Run a transaction to create all necessary Firestore documents
      await runTransaction(firestore, async (transaction) => {
        const oficinaRef = doc(collection(firestore, 'oficinas'));
        const userRef = doc(firestore, 'oficinas', oficinaRef.id, 'users', user.uid);
        const userMapRef = doc(firestore, 'users', user.uid);

        // a. Create Oficina document
        transaction.set(oficinaRef, {
          id: oficinaRef.id,
          name: data.oficinaName,
          cnpj: '00000000000000', // Placeholder
          address: 'Endereço a ser preenchido', // Placeholder
          phone: '00000000000', // Placeholder
          email: data.email,
        });

        // b. Create User document inside the oficina subcollection
        transaction.set(userRef, {
          id: user.uid,
          oficinaId: oficinaRef.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: 'ADMIN',
          createdAt: serverTimestamp(),
        });

        // c. Create the user-to-oficina mapping
        transaction.set(userMapRef, {
          oficinaId: oficinaRef.id,
        });
      });

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você já pode fazer o login com suas novas credenciais.',
      });
      router.push('/');

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro durante o cadastro.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso.';
      } else if (error.message) {
        // Firebase security rule errors will have a descriptive message
        errorMessage = `Erro: ${error.message}`;
      }
      console.error("Signup Error:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-4">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wrench className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">OSMECH</h1>
          </div>
          <CardTitle className="text-2xl">CRIE SUA CONTA</CardTitle>
          <CardDescription>
            PREENCHA OS DADOS PARA CRIAR SUA CONTA DE ADMINISTRADOR E REGISTRAR SUA OFICINA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSignup)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">NOME</Label>
                <Input id="firstName" {...form.register('firstName')} disabled={isLoading} />
                {form.formState.errors.firstName && <p className="text-sm font-medium text-destructive">{form.formState.errors.firstName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">SOBRENOME</Label>
                <Input id="lastName" {...form.register('lastName')} disabled={isLoading} />
                 {form.formState.errors.lastName && <p className="text-sm font-medium text-destructive">{form.formState.errors.lastName.message}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="oficinaName">NOME DA OFICINA</Label>
              <Input id="oficinaName" {...form.register('oficinaName')} disabled={isLoading} />
               {form.formState.errors.oficinaName && <p className="text-sm font-medium text-destructive">{form.formState.errors.oficinaName.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-MAIL</Label>
              <Input id="email" type="email" placeholder="SEU@EMAIL.COM" {...form.register('email')} disabled={isLoading} />
               {form.formState.errors.email && <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">SENHA</Label>
              <Input id="password" type="password" {...form.register('password')} disabled={isLoading} />
               {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              CRIAR CONTA
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            JÁ TEM UMA CONTA?{' '}
            <Link href="/" className="underline">
              FAÇA O LOGIN
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
