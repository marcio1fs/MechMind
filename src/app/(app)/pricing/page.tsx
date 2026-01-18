"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { PixPaymentDialog } from "./components/pix-payment-dialog";
import { useUser } from "@/firebase";
import { formatNumber } from "@/lib/utils";
import { getSubscriptionDetails } from "@/lib/subscription";
import AccessDenied from "@/components/access-denied";

type Plan = {
    name: string;
    price: number;
    features: string[];
    cta: string;
    popular?: boolean;
};

const plans: Plan[] = [
    {
        name: "PRO",
        price: 49.90,
        features: [
            "Gerenciamento de Ordens de Serviço",
            "Banco de Dados de Clientes",
            "Relatórios Básicos",
            "Notificações por E-mail",
        ],
        cta: "Escolher PRO",
    },
    {
        name: "PRO+",
        price: 79.90,
        features: [
            "Todos os recursos do PRO",
            "Atualizações de Status do WhatsApp",
            "Resumo de Pedidos por IA",
            "Relatórios Avançados",
        ],
        cta: "Escolher PRO+",
        popular: true,
    },
    {
        name: "PREMIUM",
        price: 149.90,
        features: [
            "Todos os recursos do PRO+",
            "Assistência de Diagnóstico por IA",
            "Análise de Histórico de Veículos por IA",
            "Suporte Prioritário",
        ],
        cta: "Escolher PREMIUM",
    },
]

export default function PricingPage() {
    const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const { profile, isUserLoading } = useUser();

    const handleChoosePlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsPixDialogOpen(true);
    };

    const subscriptionDetails = useMemo(() => {
        return getSubscriptionDetails(profile);
    }, [profile]);

    const TrialInfoBanner = () => {
        if (!profile) return null;

        if (subscriptionDetails.status === 'AVALIAÇÃO') {
            return (
                <div className="text-center p-4 rounded-md bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                    <p className="font-medium">
                        Você está em um período de avaliação do plano {subscriptionDetails.plan}. Restam {subscriptionDetails.daysRemaining} dias.
                    </p>
                </div>
            );
        }

        if (subscriptionDetails.status === 'AVALIAÇÃO EXPIRADA') {
             return (
                <div className="text-center p-4 rounded-md bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">
                        Seu período de avaliação terminou. Para continuar a usar os recursos avançados, por favor, escolha um plano.
                    </p>
                </div>
            );
        }
        
        return null;
    }

    if (isUserLoading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (profile && profile.role !== 'ADMIN') {
        return <AccessDenied />;
    }

    return (
        <>
            <div className="flex flex-col gap-8">
                <TrialInfoBanner />
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">Escolha Seu Plano</h1>
                    <p className="mt-2 text-muted-foreground">
                        Preços simples e transparentes para oficinas de todos os tamanhos.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary' : ''}`}>
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>
                                    <span className="text-4xl font-bold">R${formatNumber(plan.price)}</span>
                                    <span className="text-muted-foreground">/mês</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} onClick={() => handleChoosePlan(plan)}>{plan.cta}</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
            <PixPaymentDialog
                isOpen={isPixDialogOpen}
                onOpenChange={setIsPixDialogOpen}
                plan={selectedPlan}
            />
        </>
    )
}
