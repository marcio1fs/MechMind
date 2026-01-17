"use client";

import { useFormStatus } from "react-dom";
import { useActionState, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getVehicleHistoryAnalysis } from "./actions";
import { AlertTriangle, Lightbulb, History, Sparkles, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Analisando..." : "Analisar Histórico"}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

// A hardcoded oficinaId for demonstration purposes.
const OFICINA_ID = "default_oficina";

export default function VehicleHistoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useUser();
  const initialState = { message: null, data: null };
  const [state, dispatch] = useActionState(getVehicleHistoryAnalysis, initialState);

  const [vehiclePlate, setVehiclePlate] = useState("");
  const [historyText, setHistoryText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const formatPlate = (value: string) => {
    if (!value) return "";
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  const handleSearchHistory = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado para buscar o histórico.",
      });
      return;
    }
    if (vehiclePlate.length < 7) {
      toast({
        variant: "destructive",
        title: "Placa Inválida",
        description: "Por favor, insira uma placa válida com 7 caracteres.",
      });
      return;
    }

    setIsSearching(true);
    setHistoryText("");
    try {
      const ordersRef = collection(firestore, "oficinas", OFICINA_ID, "ordensDeServico");
      const q = query(
        ordersRef,
        where("vehicle.plate", "==", vehiclePlate),
        orderBy("startDate", "desc")
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Nenhum resultado",
          description: `Nenhum histórico encontrado para a placa ${vehiclePlate}.`,
        });
        setHistoryText(`Nenhum histórico de serviço encontrado para a placa ${vehiclePlate}.`);
      } else {
        const history = querySnapshot.docs.map(doc => {
          const order = doc.data();
          const date = order.startDate instanceof Timestamp ? order.startDate.toDate() : order.startDate;
          const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
          const services = order.services?.map((s: any) => s.description).join(', ') || 'N/A';
          return `${formattedDate}: OS #${doc.id.substring(0, 5)} - Serviços: ${services}. Status: ${order.status}. Total: R$${order.total.toFixed(2)}`;
        }).join('\n');
        setHistoryText(history);
        toast({
          title: "Histórico Encontrado",
          description: `${querySnapshot.docs.length} registro(s) encontrado(s) para a placa ${vehiclePlate}.`,
        });
      }
    } catch (error) {
      console.error("Error searching vehicle history: ", error);
      toast({
        variant: "destructive",
        title: "Erro na Busca",
        description: "Ocorreu um erro ao buscar o histórico. Verifique suas permissões e tente novamente.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (state.message && state.message !== "Análise completa.") {
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Análise de Histórico do Veículo</h1>
        <p className="text-muted-foreground">
          Busque o histórico de um veículo pela placa e deixe a IA prever problemas futuros e recomendar manutenções.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Histórico do Veículo</CardTitle>
          <CardDescription>
            Insira a placa do veículo para buscar automaticamente todos os registros de serviço associados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-end gap-2">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
              <Input
                id="vehiclePlate"
                name="vehiclePlate"
                placeholder="ABC1234"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(formatPlate(e.target.value))}
                maxLength={7}
              />
            </div>
            <Button onClick={handleSearchHistory} disabled={isSearching || !profile}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle>Revisar e Analisar</CardTitle>
            <CardDescription>
              O histórico encontrado está abaixo. Adicione quaisquer sintomas atuais e clique em "Analisar".
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicleHistory">Histórico de Serviço Encontrado</Label>
              <Textarea
                id="vehicleHistory"
                name="vehicleHistory"
                placeholder="O histórico de serviço do veículo aparecerá aqui após a busca..."
                className="min-h-32 font-code"
                required
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
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
