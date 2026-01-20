"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, AlertCircle, Printer } from "lucide-react";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import type { Order } from "../orders/page";
import { ReceiptDialog } from "../orders/components/receipt-dialog";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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


export default function OsQueryPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const [searchValue, setSearchValue] = useState("");
    const [searchType, setSearchType] = useState<'displayId' | 'customer' | 'plate'>('displayId');
    const [foundOrders, setFoundOrders] = useState<Order[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const workshopDocRef = useMemoFirebase(() => {
        if (!firestore || !profile?.oficinaId) return null;
        return doc(firestore, "oficinas", profile.oficinaId);
    }, [firestore, profile?.oficinaId]);
    const { data: workshopData } = useDoc<WorkshopInfo>(workshopDocRef);

    const handleSearch = async () => {
        if (!searchValue) {
            setError("Por favor, insira um valor para a busca.");
            return;
        }
        if (!firestore || !profile?.oficinaId) {
            setError("Erro de conexão. Tente novamente.");
            return;
        }

        setIsSearching(true);
        setFoundOrders(null);
        setError(null);

        try {
            const ordersRef = collection(firestore, "oficinas", profile.oficinaId, "ordensDeServico");
            let q;
            switch (searchType) {
                case 'displayId':
                    q = query(ordersRef, where("displayId", "==", searchValue.padStart(4, '0')));
                    break;
                case 'customer':
                     // Firestore queries are case-sensitive.
                    q = query(ordersRef, where("customer", "==", searchValue));
                    break;
                case 'plate':
                    q = query(ordersRef, where("vehicle.plate", "==", searchValue.toUpperCase()));
                    break;
                default:
                    throw new Error("Tipo de busca inválido");
            }
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError(`Nenhuma Ordem de Serviço encontrada para sua busca.`);
            } else {
                const orders = querySnapshot.docs.map(doc => doc.data() as Order);
                setFoundOrders(orders);
            }
        } catch (e) {
            setError("Ocorreu um erro ao buscar as Ordens de Serviço.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleOpenReceipt = (order: Order) => {
        setSelectedOrderForReceipt(order);
        setIsReceiptOpen(true);
    };

    return (
        <>
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Consulta de OS</h1>
                    <p className="text-muted-foreground">
                        Busque por uma Ordem de Serviço para visualizar ou reimprimir o recibo.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Buscar Ordem de Serviço</CardTitle>
                        <CardDescription>Selecione o tipo de busca e insira o valor para encontrar a OS.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-end gap-2">
                        <div className="grid w-full sm:w-auto items-center gap-1.5">
                            <Label htmlFor="search-type">Buscar por</Label>
                            <Select value={searchType} onValueChange={(v) => setSearchType(v as any)}>
                                <SelectTrigger id="search-type" className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="displayId">Nº da OS</SelectItem>
                                    <SelectItem value="customer">Nome do Cliente</SelectItem>
                                    <SelectItem value="plate">Placa do Veículo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid w-full flex-1 items-center gap-1.5">
                            <Label htmlFor="search-value">Valor</Label>
                            <Input 
                                type="text" 
                                id="search-value" 
                                placeholder="Insira o valor..." 
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching} className="w-full sm:w-auto">
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Buscar
                        </Button>
                    </CardContent>
                </Card>

                {error && !isSearching && (
                     <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle />
                                Erro na Busca
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {foundOrders && !isSearching && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultado da Busca</CardTitle>
                             <CardDescription>{foundOrders.length} resultado(s) encontrado(s).</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>OS</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Veículo</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {foundOrders.map(order => {
                                            const startDate = order.startDate instanceof Timestamp ? order.startDate.toDate() : order.startDate;
                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">#{order.displayId}</TableCell>
                                                    <TableCell>{order.customer}</TableCell>
                                                    <TableCell>{`${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.plate})`}</TableCell>
                                                    <TableCell>{startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</TableCell>
                                                    <TableCell><Badge variant={statusVariant[order.status]}>{order.status}</Badge></TableCell>
                                                    <TableCell className="text-right">R$ {formatNumber(order.total)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenReceipt(order)}
                                                            disabled={order.status !== 'FINALIZADO'}
                                                        >
                                                            <Printer className="mr-2 h-4 w-4" />
                                                            Recibo
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <ReceiptDialog 
                isOpen={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                order={selectedOrderForReceipt}
                workshop={workshopData}
            />
        </>
    );
}
