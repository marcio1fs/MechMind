'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSubscriptionDetails, type SubscriptionDetails } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AccessDenied from "@/components/access-denied";

export default function SettingsPage() {
    const firestore = useFirestore();
    const { profile, isUserLoading } = useUser();
    const { toast } = useToast();

    // WhatsApp Config State
    const [apiKey, setApiKey] = useState("");
    const [senderNumber, setSenderNumber] = useState("");
    const [isWhatsappLoading, setIsWhatsappLoading] = useState(true);

    // Payments Config State
    const [pixKey, setPixKey] = useState("");
    const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);

    const [isSaving, setIsSaving] = useState(false);
    const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);

    // Fetch WhatsApp Config
    useEffect(() => {
        if (!profile?.oficinaId || !firestore || profile.role !== 'ADMIN') {
            setIsWhatsappLoading(false);
            return;
        };

        const fetchWhatsappConfig = async () => {
            setIsWhatsappLoading(true);
            try {
                const configRef = doc(firestore, "oficinas", profile.oficinaId, "config", "whatsapp");
                const docSnap = await getDoc(configRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setApiKey(data.apiKey || "");
                    setSenderNumber(data.senderNumber || "");
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as configurações do WhatsApp." });
            } finally {
                setIsWhatsappLoading(false);
            }
        };
        fetchWhatsappConfig();
    }, [profile, firestore, toast]);

    // Fetch Payments Config
    useEffect(() => {
        if (!profile?.oficinaId || !firestore || profile.role !== 'ADMIN') {
            setIsPaymentsLoading(false);
            return;
        }

        const fetchPaymentsConfig = async () => {
            setIsPaymentsLoading(true);
            try {
                const configRef = doc(firestore, "oficinas", profile.oficinaId, "config", "payments");
                const docSnap = await getDoc(configRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPixKey(data.pixKey || "");
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as configurações de pagamento." });
            } finally {
                setIsPaymentsLoading(false);
            }
        };
        fetchPaymentsConfig();
    }, [profile, firestore, toast]);


    useEffect(() => {
        if (profile) {
            setSubscriptionDetails(getSubscriptionDetails(profile));
        }
    }, [profile]);

    const handleSave = async () => {
        if (!profile?.oficinaId || !firestore || profile.role !== 'ADMIN') {
            toast({ variant: "destructive", title: "Permissão Negada", description: "Apenas administradores podem salvar as configurações." });
            return;
        }

        setIsSaving(true);
        try {
            const whatsappConfigRef = doc(firestore, "oficinas", profile.oficinaId, "config", "whatsapp");
            const paymentsConfigRef = doc(firestore, "oficinas", profile.oficinaId, "config", "payments");

            await Promise.all([
                setDoc(whatsappConfigRef, { apiKey, senderNumber }, { merge: true }),
                setDoc(paymentsConfigRef, { pixKey }, { merge: true }),
            ]);
            
            toast({
                title: "Configurações Salvas",
                description: "Suas configurações foram salvas com sucesso.",
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar as configurações. Tente novamente." });
        } finally {
            setIsSaving(false);
        }
    };

    const isReadOnly = profile?.role !== 'ADMIN';
    const isConfigLoading = isWhatsappLoading || isPaymentsLoading;
    
    const getStatusVariant = (status: SubscriptionDetails['status']) => {
        switch (status) {
            case 'AVALIAÇÃO': return 'default';
            case 'AVALIAÇÃO EXPIRADA': return 'destructive';
            case 'ASSINATURA ATIVA': return 'default';
            default: return 'secondary';
        }
    };

    if (isUserLoading) {
      return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (profile && profile.role !== 'ADMIN') {
      return <AccessDenied />;
    }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">CONFIGURAÇÕES</h1>
        <p className="text-muted-foreground">GERENCIE SUA CONTA E AS CONFIGURAÇÕES DO APLICATIVO.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ASSINATURA</CardTitle>
          <CardDescription>GERENCIE SEU PLANO DE ASSINATURA ATUAL.</CardDescription>
        </CardHeader>
        <CardContent>
            {isUserLoading || !subscriptionDetails ? ( <Skeleton className="h-12 w-full" /> ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">PLANO ATUAL: {subscriptionDetails.plan}</p>
                            <Badge variant={getStatusVariant(subscriptionDetails.status)}>{subscriptionDetails.status}</Badge>
                        </div>
                        {subscriptionDetails.status === 'AVALIAÇÃO' && subscriptionDetails.trialEndDate && (
                            <p className="text-sm text-muted-foreground">
                                Sua avaliação termina em {subscriptionDetails.daysRemaining} dias ({subscriptionDetails.trialEndDate.toLocaleDateString('pt-BR')}).
                            </p>
                        )}
                        {subscriptionDetails.status === 'AVALIAÇÃO EXPIRADA' && (
                            <p className="text-sm text-muted-foreground">Sua avaliação terminou. Assine um plano para continuar a usar os recursos premium.</p>
                        )}
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/pricing">MUDAR DE PLANO</Link>
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
      
       <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>CONFIGURAÇÕES DE PAGAMENTO</CardTitle>
                    <CardDescription>
                        Insira sua chave PIX para receber pagamentos de assinaturas de seus clientes através do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isConfigLoading ? ( <Skeleton className="h-10 w-full" /> ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="pix-key">SUA CHAVE PIX</Label>
                            <Input id="pix-key" placeholder={isReadOnly ? "Apenas administradores podem ver/editar" : "CPF, CNPJ, E-MAIL, TELEFONE OU CHAVE ALEATÓRIA"} value={pixKey} onChange={(e) => setPixKey(e.target.value)} disabled={isSaving || isReadOnly} />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>INTEGRAÇÃO COM WHATSAPP</CardTitle>
                <CardDescription>
                    Para habilitar o envio automático de notificações (ex: atualizações de status da OS), você deve contratar um provedor de API do WhatsApp Business (como Twilio ou Meta) e inserir suas credenciais abaixo. Esta configuração é de responsabilidade do cliente.
                    <span className="mt-2 block text-xs text-muted-foreground/90">
                    LEMBRETE: O envio manual de recibos via WhatsApp é gratuito e não precisa desta configuração. Esta seção é apenas para automações (recurso pago).
                    </span>
                </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                {isConfigLoading ? (
                    <div className="space-y-4">
                        <div className="h-10 w-1/2 rounded-md bg-muted animate-pulse"></div>
                        <div className="h-10 w-full rounded-md bg-muted animate-pulse"></div>
                        <div className="h-10 w-full rounded-md bg-muted animate-pulse"></div>
                    </div>
                ) : (
                    <>
                    <div className="grid gap-2">
                        <p className="text-sm font-medium text-foreground">PROVEDOR DE API</p>
                        <p className="text-sm text-muted-foreground">ATUALMENTE, OFERECEMOS SUPORTE À API DO TWILIO OU DA META PARA WHATSAPP CLOUD.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="whatsapp-api-key">SUA CHAVE DE API (API Key)</Label>
                        <Input id="whatsapp-api-key" placeholder={isReadOnly ? "Apenas administradores podem ver/editar" : "Cole sua chave de API aqui"} className="normal-case placeholder:normal-case" value={apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={isSaving || isReadOnly} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="whatsapp-sender-number">SEU NÚMERO DE TELEFONE DO REMETENTE</Label>
                        <Input id="whatsapp-sender-number" placeholder={isReadOnly ? "Apenas administradores podem ver/editar" : "ex: +5511999998888"} value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} disabled={isSaving || isReadOnly} />
                    </div>
                    </>
                )}
                </CardContent>
            </Card>

            {!isReadOnly && (
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving || isConfigLoading}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        SALVAR TODAS AS CONFIGURAÇÕES
                    </Button>
                </div>
            )}
        </div>
      </form>
    </div>
  );
}
