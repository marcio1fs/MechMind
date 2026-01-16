"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrderSummary } from "./actions";
import { type OrderSummaryOutput } from "@/ai/flows/order-summary-generation";
import { Sparkles, Loader2, MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { OrderDialog } from "./components/order-dialog";
import { DeleteOrderDialog } from "./components/delete-order-dialog";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type Order = {
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
  const [orders, setOrders] = useState(mockOrders);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [summary, setSummary] = useState<OrderSummaryOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "Todos">("Todos");
  const { toast } = useToast();

  const handleOpenDialog = (dialog: 'summary' | 'order' | 'delete', order: Order | null) => {
    setSelectedOrder(order);
    if (dialog === 'summary' && order) handleGenerateSummary(order);
    if (dialog === 'order') setIsOrderDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
  };

  const handleGenerateSummary = async (order: Order) => {
    setIsSummaryDialogOpen(true);
    setIsLoadingSummary(true);
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
    setIsLoadingSummary(false);
  };

  const handleSaveOrder = (order: Order) => {
    const existingOrder = orders.find(o => o.id === order.id);
    if (existingOrder) {
      setOrders(orders.map(o => o.id === order.id ? order : o));
      toast({ title: "Sucesso!", description: "Ordem de serviço atualizada com sucesso." });
    } else {
      setOrders([order, ...orders]);
      toast({ title: "Sucesso!", description: "Ordem de serviço adicionada com sucesso." });
    }
    setSelectedOrder(null);
  };

  const handleDeleteOrder = (order: Order) => {
    setOrders(orders.filter(o => o.id !== order.id));
    toast({ title: "Sucesso!", description: "Ordem de serviço excluída com sucesso." });
    setSelectedOrder(null);
    setIsDeleteDialogOpen(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${order.vehicle.make} ${order.vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Ordens de Serviço</h1>
                <p className="text-muted-foreground">
                Gerencie e analise todas as ordens de serviço.
                </p>
            </div>
            <div>
                <Button onClick={() => handleOpenDialog('order', null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Ordem
                </Button>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Pesquisar por ID, cliente ou veículo..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={(value: Order["status"] | "Todos") => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
            </Select>
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
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{`${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`}</TableCell>
                    <TableCell>
                    <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">R${order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Ações</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog('order', order)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDialog('summary', order)}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Gerar Resumo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenDialog('delete', order)} className="text-destructive focus:text-destructive focus:bg-destructive/10">Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Nenhuma ordem de serviço encontrada.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for AI Summary */}
      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumo do Pedido Gerado por IA</DialogTitle>
            <DialogDescription>
              Este é um resumo conciso da ordem de serviço gerada por IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 min-h-[6rem]">
            {isLoadingSummary && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gerando resumo...</span>
              </div>
            )}
            {summary && <p className="text-sm">{summary.summary}</p>}
          </div>
        </DialogContent>
      </Dialog>
        
      {/* Dialog for Create/Edit Order */}
      <OrderDialog
        isOpen={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        order={selectedOrder}
        onSave={handleSaveOrder}
      />

      {/* Dialog for Delete Confirmation */}
      <DeleteOrderDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        order={selectedOrder}
        onDelete={handleDeleteOrder}
      />
    </div>
  );
}
