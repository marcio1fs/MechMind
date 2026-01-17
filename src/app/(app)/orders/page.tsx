"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { mockStockItems, mockMechanics, type Mechanic } from "@/lib/mock-data";

export type UsedPart = {
  itemId: string;
  code: string;
  name: string;
  quantity: number;
  sale_price: number;
};

export type Order = {
  id: string;
  customer: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
  };
  mechanicId?: string;
  mechanicName?: string;
  startDate: Date;
  status: "CONCLUÍDO" | "EM ANDAMENTO" | "PENDENTE";
  services: string;
  parts: UsedPart[];
  total: number;
  symptoms?: string;
  diagnosis?: string;
};

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "JOHN DOE",
    vehicle: { make: "HONDA", model: "CIVIC", year: 2021, plate: "ABC1D23", color: "BRANCO" },
    mechanicId: "MEC-001",
    mechanicName: "CARLOS ALBERTO",
    startDate: new Date("2024-07-20T12:00:00Z"),
    status: "CONCLUÍDO",
    services: "TROCA DE ÓLEO, RODÍZIO DE PNEUS",
    parts: [{ itemId: 'ITEM-001', code: 'HF-103', name: 'FILTRO DE ÓLEO', quantity: 1, sale_price: 35.00 }],
    total: 125.5,
    symptoms: "LUZ DE MANUTENÇÃO ACESA.",
    diagnosis: "DIAGNÓSTICO: MANUTENÇÃO DE ROTINA NECESSÁRIA.\n\nCONFIANÇA: 95%\n\nAÇÕES RECOMENDADAS:\nREALIZAR TROCA DE ÓLEO E FILTRO. FAZER RODÍZIO DOS PNEUS E VERIFICAR A PRESSÃO."
  },
  {
    id: "ORD-002",
    customer: "JANE SMITH",
    vehicle: { make: "FORD", model: "F-150", year: 2019, plate: "DEF4E56", color: "PRETO" },
    mechanicId: "MEC-002",
    mechanicName: "BRUNO FERNANDES",
    startDate: new Date("2024-07-21T12:00:00Z"),
    status: "EM ANDAMENTO",
    services: "SUBSTITUIÇÃO DA PASTILHA DE FREIO",
    parts: [{ itemId: 'ITEM-002', code: 'PST-201', name: 'PASTILHA DE FREIO DIANTEIRA', quantity: 2, sale_price: 150.00 }],
    total: 350.0,
    symptoms: "BARULHO DE RANGIDO AO FREAR.",
  },
  {
    id: "ORD-003",
    customer: "SAM WILSON",
    vehicle: { make: "TOYOTA", model: "CAMRY", year: 2022, plate: "GHI7F89", color: "PRATA" },
    startDate: new Date("2024-07-22T12:00:00Z"),
    status: "PENDENTE",
    services: "VERIFICAÇÃO DE DIAGNÓSTICO",
    parts: [],
    total: 75.0,
    symptoms: "MOTOR FALHANDO EM MARCHA LENTA.",
  },
  {
    id: "ORD-004",
    customer: "EMILY BROWN",
    vehicle: { make: "BMW", model: "X5", year: 2020, plate: "JKL0G12", color: "AZUL" },
    mechanicId: "MEC-001",
    mechanicName: "CARLOS ALBERTO",
    startDate: new Date("2024-06-15T12:00:00Z"),
    status: "CONCLUÍDO",
    services: "INSPEÇÃO ANUAL, SUBSTITUIÇÃO DO FILTRO DE AR",
    parts: [],
    total: 215.75,
  },
];


const statusVariant: { [key in Order["status"]]: "default" | "secondary" | "outline" } = {
    "CONCLUÍDO": "default",
    "EM ANDAMENTO": "secondary",
    "PENDENTE": "outline"
}


export default function OrdersPage() {
  const [stockItems, setStockItems] = useState(mockStockItems);
  const [mechanics, setMechanics] = useState(mockMechanics);
  const [orders, setOrders] = useState(mockOrders);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [summary, setSummary] = useState<OrderSummaryOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "TODOS">("TODOS");
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
      partsReplaced: order.parts.map(p => `${p.quantity}X ${p.name}`).join(', ') || "NENHUMA PEÇA",
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
    
    if (order.status === 'CONCLUÍDO' && (!existingOrder || existingOrder.status !== 'CONCLUÍDO')) {
        let stockSufficient = true;
        const tempStock = [...stockItems];
        
        for (const part of order.parts) {
            const stockItemIndex = tempStock.findIndex(i => i.id === part.itemId);
            if (stockItemIndex > -1) {
                if (tempStock[stockItemIndex].quantity < part.quantity) {
                    toast({
                        variant: "destructive",
                        title: `ESTOQUE INSUFICIENTE PARA ${part.name.toUpperCase()}`,
                        description: `DISPONÍVEL: ${tempStock[stockItemIndex].quantity}, REQUERIDO: ${part.quantity}. A ORDEM DE SERVIÇO FOI SALVA, MAS O ESTOQUE NÃO FOI ATUALIZADO.`,
                    });
                    stockSufficient = false;
                    break;
                }
                tempStock[stockItemIndex].quantity -= part.quantity;
            }
        }

        if (stockSufficient) {
            setStockItems(tempStock);
            toast({ title: "SUCESSO!", description: "ESTOQUE ATUALIZADO COM SUCESSO." });
        }
    }

    if (existingOrder) {
      setOrders(orders.map(o => o.id === order.id ? order : o));
      toast({ title: "SUCESSO!", description: "ORDEM DE SERVIÇO ATUALIZADA COM SUCESSO." });
    } else {
      setOrders([order, ...orders]);
      toast({ title: "SUCESSO!", description: "ORDEM DE SERVIÇO ADICIONADA COM SUCESSO." });
    }
    setSelectedOrder(null);
  };

  const handleDeleteOrder = (order: Order) => {
    setOrders(orders.filter(o => o.id !== order.id));
    toast({ title: "SUCESSO!", description: "ORDEM DE SERVIÇO EXCLUÍDA COM SUCESSO." });
    setSelectedOrder(null);
    setIsDeleteDialogOpen(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${order.vehicle.make} ${order.vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vehicle.plate.toLowerCase().replace('-', '').includes(searchTerm.toLowerCase().replace('-', ''));
        
        const matchesStatus = statusFilter === 'TODOS' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex-col items-start gap-4 border-b p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">ORDENS DE SERVIÇO</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        GERENCIE E ANALISE TODAS AS ORDENS DE SERVIÇO.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog('order', null)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    ADICIONAR ORDEM
                </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="PESQUISAR POR ID, CLIENTE, VEÍCULO OU PLACA..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(value: Order["status"] | "TODOS") => setStatusFilter(value)}>
                        <SelectTrigger className="w-auto min-w-[180px]">
                            <SelectValue placeholder="FILTRAR POR STATUS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODOS">TODOS</SelectItem>
                            <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                            <SelectItem value="EM ANDAMENTO">EM ANDAMENTO</SelectItem>
                            <SelectItem value="CONCLUÍDO">CONCLUÍDO</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="rounded-lg border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>ID DO PEDIDO</TableHead>
                        <TableHead>CLIENTE</TableHead>
                        <TableHead>VEÍCULO</TableHead>
                        <TableHead>MECÂNICO</TableHead>
                        <TableHead>DATA DE INÍCIO</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead className="text-right">TOTAL</TableHead>
                        <TableHead className="w-[100px] text-right">AÇÕES</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{order.customer}</TableCell>
                                <TableCell>
                                    <div>{`${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{order.vehicle.plate}</div>
                                </TableCell>
                                <TableCell>{order.mechanicName || 'N/A'}</TableCell>
                                <TableCell>{format(order.startDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                <TableCell>
                                <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">R${order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">AÇÕES</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenDialog('order', order)}>EDITAR</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDialog('summary', order)}>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                GERAR RESUMO
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleOpenDialog('delete', order)} className="text-destructive focus:text-destructive focus:bg-destructive/10">EXCLUIR</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">NENHUMA ORDEM DE SERVIÇO ENCONTRADA.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

      {/* Dialog for AI Summary */}
      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RESUMO DO PEDIDO GERADO POR IA</DialogTitle>
            <DialogDescription>
              ESTE É UM RESUMO CONCISO DA ORDEM DE SERVIÇO GERADA POR IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 min-h-[6rem]">
            {isLoadingSummary && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>GERANDO RESUMO...</span>
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
        stockItems={stockItems}
        mechanics={mechanics}
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
