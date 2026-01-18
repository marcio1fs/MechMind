"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { PixPaymentDialog } from "./components/pix-payment-dialog";
import { useUser } from "@/firebase";

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
    const { profile } = useUser();

    const handleChoosePlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsPixDialogOpen(true);
    };

    const getTrialInfo = () => {
        if (!profile || !profile.createdAt) return null;
        
        const now = new Date();
        const signUpDate = profile.createdAt.toDate();
        const daysSinceSignUp = Math.floor((now.getTime() - signUpDate.getTime()) / (1000 * 3600 * 24));
        const daysLeftInTrial = 30 - daysSinceSignUp;

        if (daysLeftInTrial <= 0) {
            return {
                message: `Seu período de avaliação de 30 dias terminou. Para continuar a usar os recursos avançados, por favor, escolha um plano.`
            };
        }

        return {
            message: `Você está no seu período de avaliação. Plano atual: ${profile.activePlan}. Dias restantes: ${daysLeftInTrial}.`
        }
    }
    const trialInfo = getTrialInfo();

    return (
        <>
            <div className="flex flex-col gap-8">
                {trialInfo && (
                    <div className="text-center p-4 rounded-md bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                        <p className="font-medium">{trialInfo.message}</p>
                    </div>
                )}
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
                                    <span className="text-4xl font-bold">R${plan.price.toFixed(2)}</span>
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
