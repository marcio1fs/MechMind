"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrderSummary } from "./actions";
import { type OrderSummaryOutput } from "@/ai/flows/order-summary-generation";
import { Sparkles, Loader2 } from "lucide-react";

type Order = {
  id: string;
  customer: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  status: "Concluído" | "Em Andamento" | "Pendente";
  services: string;
  parts: string;
  total: number;
};

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    vehicle: { make: "Honda", model: "Civic", year: 2021 },
    status: "Concluído",
    services: "Troca de óleo, rodízio de pneus",
    parts: "Filtro de óleo, óleo sintético 5W-30",
    total: 125.5,
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    vehicle: { make: "Ford", model: "F-150", year: 2019 },
    status: "Em Andamento",
    services: "Substituição da pastilha de freio",
    parts: "Pastilhas de freio dianteiras de cerâmica",
    total: 350.0,
  },
  {
    id: "ORD-003",
    customer: "Sam Wilson",
    vehicle: { make: "Toyota", model: "Camry", year: 2022 },
    status: "Pendente",
    services: "Verificação de diagnóstico",
    parts: "N/A",
    total: 75.0,
  },
  {
    id: "ORD-004",
    customer: "Emily Brown",
    vehicle: { make: "BMW", model: "X5", year: 2020 },
    status: "Concluído",
    services: "Inspeção anual, substituição do filtro de ar",
    parts: "Filtro de ar da cabine, filtro de ar do motor",
    total: 215.75,
  },
];

const statusVariant: { [key in Order["status"]]: "default" | "secondary" | "outline" } = {
    "Concluído": "default",
    "Em Andamento": "secondary",
    "Pendente": "outline"
}


export default function OrdersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [summary, setSummary] = useState<OrderSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = async (order: Order) => {
    setIsDialogOpen(true);
    setIsLoading(true);
    setSummary(null);

    const result = await getOrderSummary({
      servicesPerformed: order.services,
      partsReplaced: order.parts,
      totalCost: order.total,
      vehicleMake: order.vehicle.make,
      vehicleModel: order.vehicle.model,
      vehicleYear: order.vehicle.year,
    });

    if (result.data) {
      setSummary(result.data);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Ordens de Serviço</h1>
        <p className="text-muted-foreground">
          Gerencie e analise todas as ordens de serviço.
        </p>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID do Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{`${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">R${order.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateSummary(order)}
                  >
                    Gerar Resumo
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumo do Pedido Gerado por IA</DialogTitle>
            <DialogDescription>
              Este é um resumo conciso da ordem de serviço gerada por IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gerando resumo...</span>
              </div>
            )}
            {summary && <p className="text-sm">{summary.summary}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
