
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Sparkles, Loader2, MoreHorizontal, PlusCircle, Search, CreditCard, CheckCircle } from "lucide-react";
import { OrderDialog } from "./components/order-dialog";
import { DeleteOrderDialog } from "./components/delete-order-dialog";
import { PaymentDialog } from "./components/payment-dialog";
import { ReceiptDialog } from "./components/receipt-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { mockVehicleMakes } from "@/lib/mock-data";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, addDoc, setDoc, deleteDoc, updateDoc, Timestamp, serverTimestamp, runTransaction } from "firebase/firestore";
import type { StockItem } from "../inventory/page";
import type { Mechanic as FullMechanic } from "../mechanics/page";
import { formatNumber } from "@/lib/utils";


export type UsedPart = {
  itemId: string;
  code: string;
  name: string;
  quantity: number;
  sale_price: number;
};

export type PerformedService = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  displayId?: string;
  oficinaId: string;
  customer: string;
  customerDocumentType?: "CPF" | "CNPJ";
  customerCpf?: string;
  customerCnpj?: string;
  customerPhone?: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
  };
  mechanicId?: string;
  mechanicName?: string;
  startDate: Date | Timestamp;
  status: "PRONTO PARA PAGAMENTO" | "EM ANDAMENTO" | "PENDENTE" | "FINALIZADO";
  services: PerformedService[];
  parts: UsedPart[];
  total: number;
  subtotal?: number;
  discount?: number;
  symptoms?: string;
  diagnosis?: string;
  paymentMethod?: string;
};

const statusVariant: { [key in Order["status"]]: "default" | "secondary" | "outline" } = {
    "PRONTO PARA PAGAMENTO": "default",
    "EM ANDAMENTO": "secondary",
    "PENDENTE": "outline",
    "FINALIZADO": "default",
}

const OFICINA_ID = "default_oficina";

export default function OrdersPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  
  const inventoryCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "inventory");
  }, [firestore, profile]);
  const { data: stockItems, isLoading: isLoadingStock } = useCollection<StockItem>(inventoryCollection);

  const mechanicsCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "users");
  }, [firestore, profile]);
  const { data: mechanicsData, isLoading: isLoadingMechanics } = useCollection<FullMechanic>(mechanicsCollection);
  
  const ordersCollection = useMemoFirebase(() => {
      if (!firestore || !profile) return null;
      return collection(firestore, "oficinas", OFICINA_ID, "ordensDeServico");
  }, [firestore, profile]);
  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersCollection);


  const mechanics = useMemo(() => {
    if (!mechanicsData) return [];
    return mechanicsData.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        specialty: m.specialty
    }));
  }, [mechanicsData]);

  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [summary, setSummary] = useState<OrderSummaryOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "TODOS">("TODOS");
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenDialog = async (dialog: 'summary' | 'order' | 'delete' | 'payment', order: Order | null) => {
    setSelectedOrder(order);
    if (dialog === 'summary' && order) await handleGenerateSummary(order);
    if (dialog === 'order') setIsOrderDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
    if (dialog === 'payment') setIsPaymentDialogOpen(true);
  };

  const handleGenerateSummary = async (order: Order) => {
    setIsSummaryDialogOpen(true);
    setIsLoadingSummary(true);
    setSummary(null);

    const result = await getOrderSummary({
      servicesPerformed: order.services.map(s => `${s.quantity}X ${s.description}`).join(', ') || "NENHUM SERVIÇO REALIZADO",
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

  const handleSaveOrder = async (orderData: Omit<Order, 'id' | 'oficinaId'> & { id?: string }) => {
    if (!firestore || !ordersCollection || !profile) {
        throw new Error("Firestore not initialized");
    }
    const { id, ...data } = orderData;
    
    // Sanitize data to prevent Firestore errors with 'undefined' values.
    const dataToSave = {
        ...data,
        subtotal: data.subtotal === undefined ? null : data.subtotal,
        discount: data.discount === undefined ? null : data.discount,
    };

    try {
        if (id) {
            const orderRef = doc(firestore, "oficinas", OFICINA_ID, "ordensDeServico", id);
            await setDoc(orderRef, dataToSave, { merge: true });
            toast({ title: "SUCESSO!", description: "ORDEM DE SERVIÇO ATUALIZADA COM SUCESSO." });
        } else {
             const counterRef = doc(firestore, "oficinas", OFICINA_ID, "counters", "ordensDeServico");

            await runTransaction(firestore, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let newCount = 1;
                if (counterDoc.exists()) {
                    newCount = (counterDoc.data().lastId || 0) + 1;
                }

                const displayId = String(newCount).padStart(4, '0');
                
                const newDocRef = doc(ordersCollection);
                transaction.set(newDocRef, {
                    ...dataToSave,
                    id: newDocRef.id,
                    displayId: displayId,
                    oficinaId: OFICINA_ID,
                });
                
                transaction.set(counterRef, { lastId: newCount }, { merge: true });
            });

            toast({ title: "SUCESSO!", description: "ORDEM DE SERVIÇO ADICIONADA COM SUCESSO." });
        }
        setIsOrderDialogOpen(false);
    } catch (error) {
        
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL SALVAR A ORDEM DE SERVIÇO." });
        throw error;
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!firestore) {
        throw new Error("Firestore not initialized");
    };
    try {
        const orderRef = doc(firestore, "oficinas", OFICINA_ID, "ordensDeServico", order.id);
        await deleteDoc(orderRef);
        toast({ title: "SUCESSO!", description: "ORDEM DE SERVIÇO EXCLUÍDA COM SUCESSO." });
    } catch (error) {
        
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL EXCLUIR A ORDEM DE SERVIÇO." });
    } finally {
        setSelectedOrder(null);
        setIsDeleteDialogOpen(false);
    }
  };

  const handleConfirmPayment = async (order: Order, paymentMethod: string, discountValue: number) => {
     if (!firestore || !profile) {
        throw new Error("Firestore not initialized");
     }
    
    const orderRef = doc(firestore, "oficinas", OFICINA_ID, "ordensDeServico", order.id);
    const financialCollection = collection(firestore, "oficinas", OFICINA_ID, "financialTransactions");

    const originalTotal = order.total;
    const finalTotal = originalTotal - discountValue;

    try {
        await runTransaction(firestore, async (transaction) => {
            // Update order status and totals
            transaction.update(orderRef, { 
                status: "FINALIZADO",
                paymentMethod: paymentMethod,
                total: finalTotal,
                subtotal: originalTotal,
                discount: discountValue > 0 ? discountValue : null,
            });

            // Create financial transaction
            const newFinDocRef = doc(financialCollection);
            transaction.set(newFinDocRef, {
                id: newFinDocRef.id,
                oficinaId: OFICINA_ID,
                description: `PAGAMENTO OS #${order.displayId}`,
                category: "ORDEM DE SERVIÇO",
                type: "IN",
                value: finalTotal,
                date: serverTimestamp(),
                reference_id: order.id,
                reference_type: "OS",
            });
        });

        toast({
            title: "PAGAMENTO REGISTRADO!",
            description: `O pagamento para a OS #${order.displayId} foi registrado com sucesso.`,
        });
        
        toast({
            title: "LANÇAMENTO FINANCEIRO CRIADO",
            description: `Entrada de R$ ${formatNumber(finalTotal)} registrada no módulo financeiro.`,
        });

        // Find the updated order data from the local state to show receipt
        const updatedOrder = { 
            ...order, 
            status: "FINALIZADO" as const, 
            paymentMethod,
            total: finalTotal,
            subtotal: originalTotal,
            discount: discountValue,
        };
        setSelectedOrder(updatedOrder); 
        setIsReceiptDialogOpen(true);
    } catch (error) {
        
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL REGISTRAR O PAGAMENTO." });
        throw error;
    } finally {
        setIsPaymentDialogOpen(false);
    }
  };


  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
        const matchesSearch = 
            (order.displayId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${order.vehicle.make} ${order.vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vehicle.plate.toLowerCase().replace('-', '').includes(searchTerm.toLowerCase().replace('-', ''));
        
        const matchesStatus = statusFilter === 'TODOS' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);
  
  const isLoading = isLoadingOrders || isLoadingStock || isLoadingMechanics;

  const canUseAiSummary = profile?.activePlan === 'PRO+' || profile?.activePlan === 'PREMIUM';

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
                            placeholder="PESQUISAR POR OS, CLIENTE, VEÍCULO OU PLACA..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isMounted ? (
                        <Select value={statusFilter} onValueChange={(value: Order["status"] | "TODOS") => setStatusFilter(value)}>
                            <SelectTrigger className="w-auto min-w-[180px]">
                                <SelectValue placeholder="FILTRAR POR STATUS" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">TODOS</SelectItem>
                                <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                                <SelectItem value="EM ANDAMENTO">EM ANDAMENTO</SelectItem>
                                <SelectItem value="PRONTO PARA PAGAMENTO">PRONTO PARA PAGAMENTO</SelectItem>
                                <SelectItem value="FINALIZADO">FINALIZADO</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <Skeleton className="h-10 w-[180px]" />
                    )}
                </div>
                <div className="rounded-lg border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>OS</TableHead>
                        <TableHead>CLIENTE / CONTATO</TableHead>
                        <TableHead>VEÍCULO</TableHead>
                        <TableHead>MECÂNICO</TableHead>
                        <TableHead>DATA DE INÍCIO</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead className="text-right">TOTAL</TableHead>
                        <TableHead className="w-[100px] text-right">AÇÕES</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => {
                                const startDate = order.startDate instanceof Timestamp ? order.startDate.toDate() : order.startDate;
                                return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.displayId || order.id.substring(0,6)}</TableCell>
                                    <TableCell>
                                        <div>{order.customer}</div>
                                        <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{`${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{order.vehicle.plate}</div>
                                    </TableCell>
                                    <TableCell>{order.mechanicName || 'N/A'}</TableCell>
                                    <TableCell>{isMounted ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : <Skeleton className="h-4 w-20" />}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[order.status]}>
                                            {order.status === 'FINALIZADO' && <CheckCircle className="mr-1 h-3 w-3" />}
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">R$ {formatNumber(order.total)}</TableCell>
                                    <TableCell className="text-right">
                                        {isMounted ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">AÇÕES</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenDialog('order', order)}>EDITAR</DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleOpenDialog('payment', order)}
                                                        disabled={order.status !== 'PRONTO PARA PAGAMENTO'}
                                                    >
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        REGISTRAR PAGAMENTO
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog('summary', order)} disabled={!canUseAiSummary}>
                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                        GERAR RESUMO {!canUseAiSummary && '(PRO+)'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => { setIsDeleteDialogOpen(true); setSelectedOrder(order); }} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={order.status === 'FINALIZADO'}>EXCLUIR</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <div className="flex justify-end">
                                                <Skeleton className="h-10 w-10" />
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                                )
                            })
                        ) : (
                            !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24">NENHUMA ORDEM DE SERVIÇO ENCONTRADA.</TableCell>
                                </TableRow>
                            )
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
      {isOrderDialogOpen && (
        <OrderDialog
            isOpen={isOrderDialogOpen}
            onOpenChange={setIsOrderDialogOpen}
            order={selectedOrder}
            onSave={handleSaveOrder}
            stockItems={stockItems || []}
            mechanics={mechanics || []}
            vehicleMakes={mockVehicleMakes}
        />
      )}

      {/* Dialog for Delete Confirmation */}
      <DeleteOrderDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        order={selectedOrder}
        onDelete={handleDeleteOrder}
      />

      {/* Dialog for Payment */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        order={selectedOrder}
        onConfirm={handleConfirmPayment}
      />

      {/* Dialog for Receipt */}
      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}
