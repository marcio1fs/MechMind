'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
    name: z.string().min(1, "O nome da oficina é obrigatório."),
    cnpj: z.string().refine(val => val.replace(/\D/g, '').length === 14, {
        message: "CNPJ inválido. Deve conter 14 dígitos.",
    }),
    address: z.string().min(1, "O endereço é obrigatório."),
    phone: z.string().refine(val => {
      const cleanVal = val.replace(/\D/g, '');
      return cleanVal.length === 10 || cleanVal.length === 11;
    }, {
      message: "Telefone inválido. Deve conter 10 ou 11 dígitos.",
    }),
    email: z.string().email("E-mail inválido."),
});

type WorkshopFormValues = z.infer<typeof formSchema>;

export default function WorkshopSettingsPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const { toast } = useToast();

    const workshopDocRef = useMemoFirebase(() => {
        if (!firestore || !profile?.oficinaId) return null;
        return doc(firestore, "oficinas", profile.oficinaId);
    }, [firestore, profile?.oficinaId]);

    const { data: workshopData, isLoading: isLoadingData } = useDoc<WorkshopFormValues>(workshopDocRef);

    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<WorkshopFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            cnpj: "",
            address: "",
            phone: "",
            email: "",
        },
    });
    
    const formatCNPJ = (value: string) => {
        if (!value) return "";
        return value
          .replace(/\D/g, "")
          .slice(0, 14)
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };
    
    const formatPhone = (value: string) => {
        if (!value) return "";
        const cleaned = value.replace(/\D/g, "").slice(0, 11);
        if (cleaned.length > 10) {
          return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    };

    useEffect(() => {
        if (workshopData) {
            form.reset({
                ...workshopData,
                cnpj: workshopData.cnpj ? formatCNPJ(workshopData.cnpj) : "",
                phone: workshopData.phone ? formatPhone(workshopData.phone) : "",
            });
        }
    }, [workshopData, form]);

    const onSubmit = async (data: WorkshopFormValues) => {
        if (!profile?.oficinaId || !firestore) {
            toast({
                variant: "destructive",
                title: "Não autenticado",
                description: "Você precisa estar logado para salvar as configurações.",
            });
            return;
        }

        if (profile.role !== 'ADMIN') {
            toast({
                variant: "destructive",
                title: "Permissão Negada",
                description: "Apenas administradores podem alterar estes dados.",
            });
            return;
        }

        setIsSaving(true);
        try {
            const dataToSave = {
                ...data,
                id: profile.oficinaId,
                cnpj: data.cnpj.replace(/\D/g, ''),
                phone: data.phone.replace(/\D/g, ''),
            };

            if (workshopDocRef) {
                await setDoc(workshopDocRef, dataToSave, { merge: true });
                toast({
                    title: "Dados Salvos",
                    description: "Os dados da sua oficina foram salvos com sucesso.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar os dados. Tente novamente.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isReadOnly = profile?.role !== 'ADMIN';

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">DADOS DA OFICINA</h1>
                    <p className="text-muted-foreground">
                        GERENCIE AS INFORMAÇÕES CADASTRAIS DA SUA OFICINA.
                    </p>
                </div>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>INFORMAÇÕES DE CADASTRO</CardTitle>
                            <CardDescription>
                                MANTENHA AS INFORMAÇÕES DA SUA OFICINA SEMPRE ATUALIZADAS. ESTES DADOS PODEM SER UTILIZADOS EM RECIBOS E COMUNICAÇÕES.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {isLoadingData ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NOME DA OFICINA</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="EX: AUTO MECÂNICA DO JOSÉ" {...field} disabled={isReadOnly || isSaving} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="cnpj"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CNPJ</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => field.onChange(formatCNPJ(e.target.value))} disabled={isReadOnly || isSaving} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>TELEFONE</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="(00) 00000-0000" {...field} onChange={(e) => field.onChange(formatPhone(e.target.value))} disabled={isReadOnly || isSaving}/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ENDEREÇO COMPLETO</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="EX: RUA DAS FLORES, 123, SÃO PAULO - SP, 01234-567" {...field} disabled={isReadOnly || isSaving}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-MAIL DE CONTATO</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="EX: contato@suaoficina.com" {...field} disabled={isReadOnly || isSaving}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </CardContent>
                        {!isReadOnly && (
                            <CardFooter className="border-t px-6 py-4">
                                <Button type="submit" disabled={isSaving || isLoadingData}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    SALVAR ALTERAÇÕES
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </form>
            </Form>
        </div>
    );
}
