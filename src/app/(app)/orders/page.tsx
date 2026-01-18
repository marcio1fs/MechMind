
"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
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
import { Sparkles, Loader2, MoreHorizontal, PlusCircle, Search, CreditCard, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
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
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, setDoc, updateDoc, Timestamp, runTransaction, DocumentSnapshot } from "firebase/firestore";
import type { StockItem } from "../inventory/page";
import type { Mechanic as FullMechanic } from "../mechanics/page";
import { formatNumber, cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";


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

type WorkshopInfo = {
    name: string;
    address: string;
    phone: string;
    cnpj: string;
    email: string;
}

const statusVariant: { [key in Order["status"]]: "default" | "secondary" | "outline" } = {
    "PRONTO PARA PAGAMENTO": "default",
    "EM ANDAMENTO": "secondary",
    "PENDENTE": "outline",
    "FINALIZADO": "default",
}

export default function OrdersPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  
  const inventoryCollection = useMemoFirebase(() => {
    if (!firestore || !profile?.oficinaId) return null;
    return collection(firestore, "oficinas", profile.oficinaId, "inventory");
  }, [firestore, profile?.oficinaId]);
  const { data: stockItems, isLoading: isLoadingStock } = useCollection<StockItem>(inventoryCollection);

  const mechanicsCollection = useMemoFirebase(() => {
    if (!firestore || !profile?.oficinaId) return null;
    return collection(firestore, "oficinas", profile.oficinaId, "users");
  }, [firestore, profile?.oficinaId]);
  const { data: mechanicsData, isLoading: isLoadingMechanics } = useCollection<FullMechanic>(mechanicsCollection);
  
  const ordersCollection = useMemoFirebase(() => {
      if (!firestore || !profile?.oficinaId) return null;
      return collection(firestore, "oficinas", profile.oficinaId, "ordensDeServico");
  }, [firestore, profile?.oficinaId]);
  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersCollection);

  const workshopDocRef = useMemoFirebase(() => {
    if (!firestore || !profile?.oficinaId) return null;
    return doc(firestore, "oficinas", profile.oficinaId);
  }, [firestore, profile?.oficinaId]);
  const { data: workshopData, isLoading: isLoadingWorkshop } = useDoc<WorkshopInfo>(workshopDocRef);


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
  const [mechanicFilter, setMechanicFilter] = useState<string>("TODOS");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenDialog = async (dialog: 'summary' | 'order' | 'delete' | 'payment' | 'receipt', order: Order | null) => {
    setSelectedOrder(order);
    if (dialog === 'summary' && order) await handleGenerateSummary(order);
    if (dialog === 'order') setIsOrderDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
    if (dialog === 'payment') setIsPaymentDialogOpen(true);
    if (dialog === 'receipt') setIsReceiptDialogOpen(true);
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
    if (!firestore || !ordersCollection || !profile?.oficinaId) {
      toast({ variant: "destructive", title: "ERRO!", description: "A SESSÃO EXPIROU. FAÇA LOGIN NOVAMENTE." });
      return;
    }
    
    const oficinaId = profile.oficinaId;
    const orderId = orderData.id;
    const { id, ...data } = orderData;

    // Clean out undefined fields before sending to Firestore
    const dataToSave: { [key: string]: any } = {};
    for (const key in data) {
        if ((data as any)[key] !== undefined) {
            dataToSave[key] = (data as any)[key];
        }
    }
    
    const itemsWithLowStock: { name: string, quantity: number }[] = [];

    try {
        await runTransaction(firestore, async (transaction) => {
            // --- PHASE 1: READS ---
            let oldParts: UsedPart[] = [];
            let counterDoc: DocumentSnapshot | null = null;
            
            const stockChanges = new Map<string, number>();

            // If updating, read existing order to get old parts list
            if (orderId) {
                const orderRef = doc(firestore, "oficinas", oficinaId, "ordensDeServico", orderId);
                const orderDoc = await transaction.get(orderRef);
                if (orderDoc.exists()) {
                    oldParts = (orderDoc.data().parts as UsedPart[]) || [];
                }
            }
            
            // Read counter only if creating a new order
            if (!orderId) {
                const counterRef = doc(firestore, "oficinas", oficinaId, "counters", "ordensDeServico");
                counterDoc = await transaction.get(counterRef);
            }

            const newParts: UsedPart[] = (dataToSave.parts as UsedPart[]) || [];

            // Calculate the change in quantity for each part
            oldParts.forEach(part => {
                stockChanges.set(part.itemId, (stockChanges.get(part.itemId) || 0) + part.quantity);
            });
            newParts.forEach(part => {
                stockChanges.set(part.itemId, (stockChanges.get(part.itemId) || 0) - part.quantity);
            });
            
            // Read all affected stock items in one go
            const stockItemDocs = new Map<string, DocumentSnapshot>();
            if (stockChanges.size > 0) {
                const stockReads: Promise<void>[] = [];
                for (const itemId of stockChanges.keys()) {
                    stockReads.push((async () => {
                        const stockItemRef = doc(firestore, "oficinas", oficinaId, "inventory", itemId);
                        const stockItemDoc = await transaction.get(stockItemRef);
                        stockItemDocs.set(itemId, stockItemDoc);
                    })());
                }
                await Promise.all(stockReads);
            }

            // --- PHASE 2: VALIDATION (In-memory) & LOW STOCK CHECK ---
            for (const [itemId, quantityChange] of stockChanges.entries()) {
                if (quantityChange === 0) continue;

                const stockItemDoc = stockItemDocs.get(itemId);

                if (!stockItemDoc || !stockItemDoc.exists()) {
                    throw new Error(`A peça com ID "${itemId}" não foi encontrada no estoque.`);
                }
                
                const currentData = stockItemDoc.data();
                const currentQuantity = currentData.quantity;
                const newQuantity = currentQuantity + quantityChange;

                if (newQuantity < 0) {
                     const itemName = currentData.name;
                     throw new Error(`Estoque insuficiente para a peça "${itemName}". Disponível: ${currentQuantity}, Necessário: ${Math.abs(quantityChange)}.`);
                }

                // Low stock check
                if (quantityChange < 0 && newQuantity > 0 && newQuantity <= currentData.min_quantity) {
                    itemsWithLowStock.push({ name: currentData.name, quantity: newQuantity });
                }
            }
            
            // --- PHASE 3: WRITES ---
            
            // Update stock items
            for (const [itemId, quantityChange] of stockChanges.entries()) {
                if (quantityChange === 0) continue;
                
                const stockItemDoc = stockItemDocs.get(itemId)!;
                const newQuantity = stockItemDoc.data()!.quantity + quantityChange;
                const stockItemRef = doc(firestore, "oficinas", oficinaId, "inventory", itemId);
                transaction.update(stockItemRef, { quantity: newQuantity });
            }

            // Update or create order
            if (orderId) {
                const orderRef = doc(firestore, "oficinas", oficinaId, "ordensDeServico", orderId);
                transaction.update(orderRef, dataToSave);
            } else {
                const counterRef = doc(firestore, "oficinas", oficinaId, "counters", "ordensDeServico");
                let newCount = 1;
                if (counterDoc && counterDoc.exists()) {
                    newCount = (counterDoc.data().lastId || 0) + 1;
                }
                const displayId = String(newCount).padStart(4, '0');
                
                const newDocRef = doc(ordersCollection);
                transaction.set(newDocRef, {
                    ...dataToSave,
                    id: newDocRef.id,
                    displayId: displayId,
                    oficinaId: oficinaId,
                });
                
                transaction.set(counterRef, { lastId: newCount }, { merge: true });
            }
        });

        toast({ title: "SUCESSO!", description: "Ordem de Serviço salva e estoque atualizado com sucesso." });
        
        // Show toasts for low stock items after successful transaction
        itemsWithLowStock.forEach(item => {
            toast({
                variant: "default",
                title: "ALERTA DE ESTOQUE BAIXO",
                description: `O item "${item.name}" está com apenas ${item.quantity} unidades.`,
            });
        });
        
        setIsOrderDialogOpen(false);

    } catch (error: any) {
        console.error("Failed to save order:", error);
        toast({ variant: "destructive", title: "ERRO AO SALVAR!", description: `Não foi possível salvar a Ordem de Serviço: ${error.message}` });
        throw error;
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!firestore || !profile?.oficinaId) {
        return;
    };
    const oficinaId = profile.oficinaId;
    try {
        await runTransaction(firestore, async (transaction) => {
            const orderRef = doc(firestore, "oficinas", oficinaId, "ordensDeServico", order.id);

            for (const part of order.parts) {
                const stockItemRef = doc(firestore, "oficinas", oficinaId, "inventory", part.itemId);
                const stockItemDoc = await transaction.get(stockItemRef);
                if (stockItemDoc.exists()) {
                    const newQuantity = stockItemDoc.data().quantity + part.quantity;
                    transaction.update(stockItemRef, { quantity: newQuantity });
                }
            }
            
            transaction.delete(orderRef);
        });

        toast({ title: "SUCESSO!", description: "Ordem de Serviço excluída e estoque restaurado." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "ERRO!", description: `NÃO FOI POSSÍVEL EXCLUIR A ORDEM DE SERVIÇO: ${error.message}` });
    } finally {
        setSelectedOrder(null);
        setIsDeleteDialogOpen(false);
    }
  };

  const handleConfirmPayment = async (order: Order, paymentMethod: string, discountValue: number) => {
    if (!firestore || !profile?.oficinaId) {
       return;
    }
   const oficinaId = profile.oficinaId;
   try {
       await runTransaction(firestore, async (transaction) => {
           const orderRef = doc(firestore, "oficinas", oficinaId, "ordensDeServico", order.id);

           const originalTotal = order.total;
           const finalTotal = originalTotal - discountValue;

           transaction.update(orderRef, { 
               status: "FINALIZADO",
               paymentMethod: paymentMethod,
               total: finalTotal,
               subtotal: originalTotal,
               discount: discountValue,
           });

           const financialCollection = collection(firestore, "oficinas", oficinaId, "financialTransactions");
           const newFinDocRef = doc(financialCollection);
           transaction.set(newFinDocRef, {
               id: newFinDocRef.id,
               oficinaId: oficinaId,
               description: `PAGAMENTO OS #${order.displayId}`,
               category: "ORDEM DE SERVIÇO",
               type: "IN",
               value: finalTotal,
               date: Timestamp.now(),
               reference_id: order.id,
               reference_type: "OS",
           });
       });

       toast({
           title: "PAGAMENTO REGISTRADO!",
           description: `O pagamento para a OS #${order.displayId} foi registrado com sucesso.`,
       });
       
       const updatedOrder = { 
           ...order, 
           status: "FINALIZADO" as const, 
           paymentMethod,
       };
       setSelectedOrder(updatedOrder); 
       setIsReceiptDialogOpen(true);
   } catch (error: any) {
       toast({ variant: "destructive", title: "ERRO AO REGISTRAR PAGAMENTO!", description: error.message || "Não foi possível registrar o pagamento." });
       throw error;
   } finally {
       setIsPaymentDialogOpen(false);
   }
 };


  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders]
      .sort((a, b) => {
        const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : a.startDate;
        const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : b.startDate;
        return dateB.getTime() - dateA.getTime();
      })
      .filter(order => {
        const orderDate = order.startDate instanceof Timestamp ? order.startDate.toDate() : order.startDate;

        const matchesSearch = 
            (order.displayId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${order.vehicle.make} ${order.vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vehicle.plate.toLowerCase().replace('-', '').includes(searchTerm.toLowerCase().replace('-', ''));
        
        const matchesStatus = statusFilter === 'TODOS' || order.status === statusFilter;

        const matchesMechanic = mechanicFilter === 'TODOS' || order.mechanicId === mechanicFilter;

        const matchesDate = (() => {
            if (!date?.from) return true;
            const from = new Date(date.from.setHours(0, 0, 0, 0));
            const to = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : new Date(from.setHours(23, 59, 59, 999));
            return orderDate >= from && orderDate <= to;
        })();

        return matchesSearch && matchesStatus && matchesMechanic && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, mechanicFilter, date]);
  
  const isLoading = isLoadingOrders || isLoadingStock || isLoadingMechanics || isLoadingWorkshop;

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
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="PESQUISAR POR OS, CLIENTE, VEÍCULO OU PLACA..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isMounted ? (
                        <>
                            <Select value={statusFilter} onValueChange={(value: Order["status"] | "TODOS") => setStatusFilter(value)}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                    <SelectValue placeholder="FILTRAR POR STATUS" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">TODOS OS STATUS</SelectItem>
                                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                                    <SelectItem value="EM ANDAMENTO">EM ANDAMENTO</SelectItem>
                                    <SelectItem value="PRONTO PARA PAGAMENTO">PRONTO PARA PAGAMENTO</SelectItem>
                                    <SelectItem value="FINALIZADO">FINALIZADO</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={mechanicFilter} onValueChange={setMechanicFilter}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                    <SelectValue placeholder="FILTRAR POR MECÂNICO" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">TODOS OS MECÂNICOS</SelectItem>
                                    {mechanics.map(mechanic => (
                                        <SelectItem key={mechanic.id} value={mechanic.id}>{mechanic.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal sm:w-auto min-w-[240px]",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                                    {format(date.to, "LLL dd, y", { locale: ptBR })}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y", { locale: ptBR })
                                            )
                                        ) : (
                                            <span>ESCOLHA UM PERÍODO</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("TODOS");
                                setMechanicFilter("TODOS");
                                setDate(undefined);
                            }}>
                                LIMPAR FILTROS
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-10 w-full sm:w-[180px]" />
                            <Skeleton className="h-10 w-full sm:w-[180px]" />
                            <Skeleton className="h-10 w-full sm:w-[240px]" />
                        </div>
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
                                                    <DropdownMenuItem onSelect={() => handleOpenDialog('order', order)}>EDITAR</DropdownMenuItem>
                                                    {order.status === 'FINALIZADO' ? (
                                                      <DropdownMenuItem onSelect={() => handleOpenDialog('receipt', order)}>
                                                          <CheckCircle className="mr-2 h-4 w-4" />
                                                          VER RECIBO
                                                      </DropdownMenuItem>
                                                    ) : (
                                                      <DropdownMenuItem 
                                                          onSelect={() => handleOpenDialog('payment', order)}
                                                          disabled={order.status !== 'PRONTO PARA PAGAMENTO'}
                                                      >
                                                          <CreditCard className="mr-2 h-4 w-4" />
                                                          REGISTRAR PAGAMENTO
                                                      </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onSelect={() => handleGenerateSummary(order)} disabled={!canUseAiSummary}>
                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                        GERAR RESUMO {!canUseAiSummary && '(PRO+)'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => handleOpenDialog('delete', order)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={order.status === 'FINALIZADO'}>EXCLUIR</DropdownMenuItem>
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
        workshop={workshopData}
      />
    </div>
  );
}
