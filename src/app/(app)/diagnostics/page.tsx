"use client";

import { useFormStatus } from "react-dom";
import { useActionState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getAIDiagnosis } from "./actions";
import { Progress } from "@/components/ui/progress";
import { Bot, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import UpgradePlan from "@/components/upgrade-plan";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Diagnosticando..." : "Executar Diagnóstico"}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function DiagnosticsPage() {
  const { toast } = useToast();
  const { profile } = useUser();
  const initialState = { message: null, data: null };
  const [state, dispatch] = useActionState(getAIDiagnosis, initialState);

  useEffect(() => {
    if (state.message && state.message !== "Diagnóstico completo.") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: state.message,
      });
    }
  }, [state, toast]);

  if (profile && profile.activePlan !== 'PREMIUM') {
    return <UpgradePlan requiredPlan="PREMIUM" />;
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Assistência de Diagnóstico por IA</h1>
        <p className="text-muted-foreground">
          Descreva os sintomas do veículo para obter um diagnóstico com tecnologia de IA.
        </p>
      </div>

      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle>Sintomas do Veículo</CardTitle>
            <CardDescription>
              Forneça uma descrição detalhada dos problemas e qualquer histórico relevante do veículo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="symptoms">Sintomas</Label>
              <Textarea
                id="symptoms"
                name="symptoms"
                placeholder="ex: O motor faz um barulho de batida na partida, perde potência ao acelerar..."
                className="min-h-32"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicleHistory">Histórico do Veículo (Opcional)</Label>
              <Textarea
                id="vehicleHistory"
                name="vehicleHistory"
                placeholder="ex: Última troca de óleo há 3 meses, velas de ignição novas com 80.000 km..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>

      {state.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Resultado do Diagnóstico da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div>
              <h3 className="font-semibold mb-2">Diagnóstico</h3>
              <p className="text-muted-foreground">{state.data.diagnosis}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Nível de Confiança</h3>
              <div className="flex items-center gap-2">
                <Progress value={state.data.confidenceLevel * 100} className="w-full" />
                <span className="font-mono text-sm font-semibold">
                  {(state.data.confidenceLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ações Recomendadas</h3>
              <p className="text-muted-foreground">{state.data.recommendedActions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {state.message && state.message !== "Diagnóstico completo." && !state.data &&(
          <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle />
                    Ocorreu um Erro
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{state.message}</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
