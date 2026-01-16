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
import { getVehicleHistoryAnalysis } from "./actions";
import { AlertTriangle, Lightbulb, History, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Analisando..." : "Analisar Histórico"}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function VehicleHistoryPage() {
  const { toast } = useToast();
  const initialState = { message: null, data: null };
  const [state, dispatch] = useActionState(getVehicleHistoryAnalysis, initialState);

   useEffect(() => {
    if (state.message && state.message !== "Análise completa.") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Análise de Histórico do Veículo</h1>
        <p className="text-muted-foreground">
          Deixe a IA analisar o histórico de um veículo para prever problemas futuros e recomendar manutenções.
        </p>
      </div>

      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Serviço do Veículo</CardTitle>
            <CardDescription>
              Forneça os registros de serviço do veículo e quaisquer sintomas atuais.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicleHistory">Histórico de Serviço</Label>
              <Textarea
                id="vehicleHistory"
                name="vehicleHistory"
                placeholder="ex: 15/01/2022: Troca de óleo com 50.000 km. 20/05/2023: Substituição das pastilhas de freio dianteiras..."
                className="min-h-32 font-code"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentSymptoms">Sintomas Atuais (Opcional)</Label>
              <Textarea
                id="currentSymptoms"
                name="currentSymptoms"
                placeholder="ex: Leve vibração em altas velocidades."
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>

      {state.data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Resumo da Análise da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{state.data.summary}</p>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Problemas Futuros Previstos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{state.data.predictedIssues}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Manutenção Recomendada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{state.data.recommendedMaintenance}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
