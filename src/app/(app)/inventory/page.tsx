
"use client";

import { useState, useEffect, useMemo } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, DollarSign, Archive } from "lucide-react";
import { StockItemDialog } from "./components/stock-item-dialog";
import { StockMovementDialog } from "./components/stock-movement-dialog";
import { DeleteItemDialog } from "./components/delete-item-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, runTransaction, Timestamp } from "firebase/firestore";
import { formatNumber } from "@/lib/utils";


// This type should align with the StockItem entity in backend.json
export type StockItem = {
  id: string;
  oficinaId: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  sale_price: number;
};

function getStatus(quantity: number, min_quantity: number): { text: string; variant: "default" | "outline" | "destructive" } {
  if (quantity <= 0) {
    return { text: "FORA DE ESTOQUE", variant: "destructive" };
  }
  if (quantity <= min_quantity) {
    return { text: "ESTOQUE BAIXO", variant: "outline" };
  }
  return { text: "EM ESTOQUE", variant: "default" };
}

// A hardcoded oficinaId for demonstration purposes.
const OFICINA_ID = "default_oficina";


export default function InventoryPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const inventoryCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "inventory");
  }, [firestore, profile]);

  const { data: stockItems, isLoading } = useCollection<StockItem>(inventoryCollection);
  
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { totalSaleValue, totalCostValue } = useMemo(() => {
    if (!stockItems) return { totalSaleValue: 0, totalCostValue: 0 };
    return stockItems.reduce((acc, item) => {
        acc.totalSaleValue += item.quantity * item.sale_price;
        acc.totalCostValue += item.quantity * item.cost_price;
        return acc;
    }, { totalSaleValue: 0, totalCostValue: 0 });
  }, [stockItems]);

  const handleOpenDialog = (dialog: 'item' | 'movement' | 'delete', item: StockItem | null) => {
    setSelectedItem(item);
    if (dialog === 'item') setIsItemDialogOpen(true);
    if (dialog === 'movement') setIsMovementDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
  };
  
  const handleSaveItem = async (itemData: any) => {
    if (!firestore || !inventoryCollection) {
        throw new Error("Firestore not initialized");
    }
    
    const { id, ...data } = itemData;

    try {
        if (id) {
            // Editing existing item
            const itemRef = doc(firestore, "oficinas", OFICINA_ID, "inventory", id);
            await setDoc(itemRef, data, { merge: true });
            toast({ title: "SUCESSO!", description: "ITEM ATUALIZADO COM SUCESSO." });
        } else {
            // Adding new item
            const newDocRef = doc(inventoryCollection);
            await setDoc(newDocRef, {
                ...data,
                id: newDocRef.id,
                oficinaId: OFICINA_ID,
            });
            toast({ title: "SUCESSO!", description: "ITEM ADICIONADO COM SUCESSO." });
        }

        // Check for low stock after saving
        const { quantity, min_quantity, name } = itemData;
        if (quantity > 0 && quantity <= min_quantity) {
            toast({
                variant: "default",
                title: "ALERTA DE ESTOQUE BAIXO",
                description: `O item "${name}" foi salvo com estoque baixo (${quantity} unidades). Considere fazer um novo pedido.`,
            });
        }

        setIsItemDialogOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL SALVAR O ITEM." });
        throw error;
    }
  };

  const handleDeleteItem = async (item: StockItem) => {
    if (!firestore) {
        return;
    }
    try {
        const itemRef = doc(firestore, "oficinas", OFICINA_ID, "inventory", item.id);
        await deleteDoc(itemRef);
        toast({ title: "SUCESSO!", description: "ITEM EXCLUÍDO COM SUCESSO." });
    } catch (error) {
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL EXCLUIR O ITEM." });
    } finally {
        setSelectedItem(null);
        setIsDeleteDialogOpen(false);
    }
  };

  const handleMoveItem = async (item: StockItem, type: "IN" | "OUT", quantity: number, reason?: string) => {
     if (!firestore) {
        toast({ variant: "destructive", title: "ERRO!", description: "CONEXÃO COM O BANCO DE DADOS FALHOU." });
        return;
     }

    let lowStockAlert: { name: string, quantity: number } | null = null;

    try {
        await runTransaction(firestore, async (transaction) => {
            const itemRef = doc(firestore, "oficinas", OFICINA_ID, "inventory", item.id);
            const itemDoc = await transaction.get(itemRef);
            
            if (!itemDoc.exists()) {
                throw new Error("O ITEM NÃO EXISTE MAIS NO ESTOQUE.");
            }

            const currentData = itemDoc.data();
            const currentQuantity = currentData.quantity;
            const newQuantity = type === 'IN' ? currentQuantity + quantity : currentQuantity - quantity;
            
            if (newQuantity < 0) {
                throw new Error("A SAÍDA NÃO PODE SER MAIOR QUE A QUANTIDADE DISPONÍVEL.");
            }
            
            // Check for low stock on stock removal
            if (type === 'OUT' && newQuantity > 0 && newQuantity <= currentData.min_quantity) {
                lowStockAlert = { name: currentData.name, quantity: newQuantity };
            }

            // Update inventory quantity
            transaction.update(itemRef, { quantity: newQuantity });

            // Create financial transaction
            const financialCollection = collection(firestore, "oficinas", OFICINA_ID, "financialTransactions");
            const newFinDocRef = doc(financialCollection);
            const costOfMovement = quantity * item.cost_price;

            let description = "";
            let category = "";

            if (type === 'IN') {
                description = `COMPRA ESTOQUE: ${quantity}x ${item.name}`;
                category = "COMPRA DE ESTOQUE";
            } else {
                description = `PERDA/AJUSTE ESTOQUE: ${quantity}x ${item.name}`;
                category = "PERDAS E AJUSTES";
            }

            transaction.set(newFinDocRef, {
               id: newFinDocRef.id,
               oficinaId: OFICINA_ID,
               description: reason ? `${description} (${reason})` : description,
               category: category,
               type: "OUT", // Both acquisition and loss are expenses
               value: costOfMovement,
               date: Timestamp.now(),
               reference_id: item.id,
               reference_type: "STOCK",
            });
        });

        toast({ title: "SUCESSO!", description: `MOVIMENTAÇÃO DE ESTOQUE E LANÇAMENTO FINANCEIRO REGISTRADOS.` });
        
        if (lowStockAlert) {
            toast({
                variant: "default",
                title: "ALERTA DE ESTOQUE BAIXO",
                description: `O item "${lowStockAlert.name}" está com apenas ${lowStockAlert.quantity} unidades. Considere fazer um novo pedido.`,
            });
        }

    } catch (error: any) {
        toast({ variant: "destructive", title: "ERRO NA TRANSAÇÃO!", description: error.message || "NÃO FOI POSSÍVEL COMPLETAR A OPERAÇÃO." });
    } finally {
        setSelectedItem(null);
        setIsMovementDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">CONTROLE DE ESTOQUE</h1>
                <p className="text-muted-foreground">
                GERENCIE AS PEÇAS E PRODUTOS DA SUA OFICINA.
                </p>
            </div>
            <div>
                <Button onClick={() => handleOpenDialog('item', null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    ADICIONAR ITEM
                </Button>
            </div>
        </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VALOR DE VENDA DO ESTOQUE</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading || !isMounted ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">R$ {formatNumber(totalSaleValue)}</div>}
            <p className="text-xs text-muted-foreground">
              POTENCIAL DE RECEITA COM BASE NO PREÇO DE VENDA.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CUSTO TOTAL DO ESTOQUE</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading || !isMounted ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">R$ {formatNumber(totalCostValue)}</div>}
            <p className="text-xs text-muted-foreground">
              VALOR INVESTIDO NO ESTOQUE ATUAL.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>ITENS EM ESTOQUE</CardTitle>
            <CardDescription>
                A LISTA DE TODAS AS PEÇAS CADASTRADAS NO SEU ESTOQUE.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>PRODUTO</TableHead>
                    <TableHead>CATEGORIA</TableHead>
                    <TableHead className="text-center">QUANTIDADE</TableHead>
                    <TableHead className="text-center">ESTOQUE MÍNIMO</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">PREÇO DE VENDA</TableHead>
                    <TableHead className="w-[100px] text-right">AÇÕES</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    )}
                    {!isLoading && stockItems?.map((item) => {
                    const status = getStatus(item.quantity, item.min_quantity);
                    return (
                        <TableRow key={item.id}>
                        <TableCell className="font-medium">
                            <div>{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.code}</div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{item.min_quantity}</TableCell>
                        <TableCell>
                            <Badge variant={status.variant} className="capitalize">{status.text}</Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {formatNumber(item.sale_price)}</TableCell>
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
                                        <DropdownMenuItem onSelect={() => handleOpenDialog('item', item)}>EDITAR</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleOpenDialog('movement', item)}>MOVIMENTAR</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleOpenDialog('delete', item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">EXCLUIR</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex justify-end">
                                    <Skeleton className="h-10 w-10" />
                                </div>
                            )}
                        </TableCell>
                        </TableRow>
                    );
                    })}
                     {!isLoading && stockItems?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">Nenhum item encontrado.</TableCell>
                        </TableRow>
                     )}
                </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <StockItemDialog
        isOpen={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={selectedItem}
        onSave={handleSaveItem}
      />

      <StockMovementDialog
        isOpen={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
        item={selectedItem}
        onMove={handleMoveItem}
      />

      <DeleteItemDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        item={selectedItem}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}
