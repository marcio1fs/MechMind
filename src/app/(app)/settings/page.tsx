'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const OFICINA_ID = "default_oficina";
const CONFIG_ID = "whatsapp";

export default function SettingsPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const { toast } = useToast();

    const [apiKey, setApiKey] = useState("");
    const [senderNumber, setSenderNumber] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!profile || !firestore) return;

        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const configRef = doc(firestore, "oficinas", OFICINA_ID, "config", CONFIG_ID);
                const docSnap = await getDoc(configRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setApiKey(data.apiKey || "");
                    setSenderNumber(data.senderNumber || "");
                }
            } catch (error) {
                console.error("Error fetching config:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar configurações",
                    description: "Não foi possível carregar as configurações de integração.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (profile.role === 'ADMIN') {
            fetchConfig();
        } else {
            setIsLoading(false);
        }
    }, [profile, firestore, toast]);

    const handleSave = async () => {
        if (!profile || !firestore) {
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
                description: "Apenas administradores podem alterar estas configurações.",
            });
            return;
        }

        setIsSaving(true);
        try {
            const configRef = doc(firestore, "oficinas", OFICINA_ID, "config", CONFIG_ID);
            await setDoc(configRef, { apiKey, senderNumber }, { merge: true });
            toast({
                title: "Configurações Salvas",
                description: "Suas configurações de integração com o WhatsApp foram salvas.",
            });
        } catch (error) {
            console.error("Error saving config:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar as configurações. Tente novamente.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isReadOnly = profile?.role !== 'ADMIN';

    const getSubscriptionInfo = () => {
      if (!profile) return { currentPlan: "Carregando...", renewalDate: "..." };

      if (profile.createdAt) {
        const signUpDate = profile.createdAt.toDate();
        const daysSinceSignUp = Math.floor((new Date().getTime() - signUpDate.getTime()) / (1000 * 3600 * 24));
        
        if (daysSinceSignUp > 30) {
            return { currentPlan: 'AVALIAÇÃO TERMINOU', renewalDate: 'Seu período de avaliação terminou. Assine um plano.' };
        }
        
        const trialEndDate = new Date(signUpDate);
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        return {
            currentPlan: `AVALIAÇÃO - ${profile.activePlan}`,
            renewalDate: `Sua avaliação termina em ${trialEndDate.toLocaleDateString('pt-BR')}.`
        };
      }
      
      // Fallback for users without a creation date (e.g., pre-trial system)
      return { currentPlan: "PRO", renewalDate: "Por favor, escolha um plano para obter os recursos mais recentes." };
    };

    const subscriptionInfo = getSubscriptionInfo();

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">CONFIGURAÇÕES</h1>
        <p className="text-muted-foreground">
          GERENCIE SUA CONTA E AS CONFIGURAÇÕES DO APLICATIVO.
        </p>
      </div>

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
          {isLoading ? (
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
                <Input id="whatsapp-api-key" placeholder={isReadOnly ? "Apenas administradores podem ver/editar" : "Cole sua chave de API aqui"} className="normal-case placeholder:normal-case" value={apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={isSaving || isLoading || isReadOnly} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp-sender-number">SEU NÚMERO DE TELEFONE DO REMETENTE</Label>
                <Input id="whatsapp-sender-number" placeholder={isReadOnly ? "Apenas administradores podem ver/editar" : "ex: +5511999998888"} value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} disabled={isSaving || isLoading || isReadOnly} />
              </div>
            </>
          )}
        </CardContent>
        {!isReadOnly && (
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    SALVAR E CONECTAR
                </Button>
            </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ASSINATURA</CardTitle>
          <CardDescription>
            GERENCIE SEU PLANO DE ASSINATURA ATUAL.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">PLANO ATUAL: {subscriptionInfo.currentPlan}</p>
                    <p className="text-sm text-muted-foreground">{subscriptionInfo.renewalDate}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/pricing">VER PLANOS</Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
