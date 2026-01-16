import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
    {
        name: "PRO",
        price: 49.90,
        features: [
            "Service Order Management",
            "Customer Database",
            "Basic Reporting",
            "Email Notifications",
        ],
        cta: "Choose PRO",
    },
    {
        name: "PRO+",
        price: 79.90,
        features: [
            "All PRO features",
            "WhatsApp Status Updates",
            "AI Order Summary",
            "Advanced Reporting",
        ],
        cta: "Choose PRO+",
        popular: true,
    },
    {
        name: "PREMIUM",
        price: 149.90,
        features: [
            "All PRO+ features",
            "AI Diagnostic Assistance",
            "AI Vehicle History Analysis",
            "Priority Support",
        ],
        cta: "Choose PREMIUM",
    },
]

export default function PricingPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">Choose Your Plan</h1>
                <p className="mt-2 text-muted-foreground">
                    Simple, transparent pricing for workshops of all sizes.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary' : ''}`}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>
                                <span className="text-4xl font-bold">${plan.price.toFixed(2)}</span>
                                <span className="text-muted-foreground">/month</span>
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
                            <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>{plan.cta}</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
