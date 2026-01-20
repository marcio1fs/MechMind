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
import { Search, Loader2, AlertCircle } from "lucide-react";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, DocumentData } from "firebase/firestore";
import type { Order } from "../orders/page";
import { ReceiptDialog } from "../orders/components/receipt-dialog";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

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
    const [searchId, setSearchId] = useState("");
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const workshopDocRef = useMemoFirebase(() => {
        if (!firestore || !profile?.oficinaId) return null;
        return doc(firestore, "oficinas", profile.oficinaId);
    }, [firestore, profile?.oficinaId]);
    const { data: workshopData } = useDoc<WorkshopInfo>(workshopDocRef);

    const handleSearch = async () => {
        if (!searchId) {
            setError("Por favor, insira o número da OS.");
            return;
        }
        if (!firestore || !profile?.oficinaId) {
            setError("Erro de conexão. Tente novamente.");
            return;
        }

        setIsSearching(true);
        setFoundOrder(null);
        setError(null);

        try {
            const ordersRef = collection(firestore, "oficinas", profile.oficinaId, "ordensDeServico");
            const q = query(ordersRef, where("displayId", "==", searchId.padStart(4, '0')));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError(`Nenhuma Ordem de Serviço encontrada com o número #${searchId}.`);
            } else {
                const orderDoc = querySnapshot.docs[0];
                setFoundOrder(orderDoc.data() as Order);
            }
        } catch (e) {
            setError("Ocorreu um erro ao buscar a Ordem de Serviço.");
        } finally {
            setIsSearching(false);
        }
    };

    const startDate = foundOrder?.startDate instanceof Timestamp ? foundOrder.startDate.toDate() : foundOrder?.startDate;

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
                        <CardDescription>Insira o número da OS para iniciar a busca.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-end gap-2">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="os-number">Número da OS</Label>
                            <Input 
                                type="text" 
                                id="os-number" 
                                placeholder="Ex: 123" 
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching}>
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

                {foundOrder && !isSearching && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultado da Busca</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold text-muted-foreground">Nº OS</p>
                                    <p className="font-bold text-lg">#{foundOrder.displayId}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Cliente</p>
                                    <p>{foundOrder.customer}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Veículo</p>
                                    <p>{`${foundOrder.vehicle.make} ${foundOrder.vehicle.model} (${foundOrder.vehicle.plate})`}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Data</p>
                                    <p>{startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Status</p>
                                    <Badge variant={statusVariant[foundOrder.status]}>{foundOrder.status}</Badge>
                                </div>
                                 <div className="col-span-full sm:col-span-1">
                                    <p className="font-semibold text-muted-foreground">Total</p>
                                    <p className="font-bold">R$ {formatNumber(foundOrder.total)}</p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => setIsReceiptOpen(true)}
                                disabled={foundOrder.status !== 'FINALIZADO'}
                                className="w-full sm:w-auto"
                            >
                                Reimprimir Recibo
                            </Button>
                             {foundOrder.status !== 'FINALIZADO' && (
                                <p className="text-xs text-muted-foreground">
                                    A reimpressão do recibo só é permitida para Ordens de Serviço com status "FINALIZADO".
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <ReceiptDialog 
                isOpen={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                order={foundOrder}
                workshop={workshopData}
            />
        </>
    );
}
