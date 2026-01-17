"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StockItem } from "../../inventory/page";
import type { UsedPart } from "../page";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddPartDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stockItems: StockItem[];
  onAddParts: (parts: UsedPart[]) => void;
  currentParts: UsedPart[];
}

export function AddPartDialog({ isOpen, onOpenChange, stockItems, onAddParts, currentParts }: AddPartDialogProps) {
  const [selectedParts, setSelectedParts] = useState<{[itemId: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        setSelectedParts({});
        setSearchTerm("");
    }
  }, [isOpen]);

  const handleQuantityChange = (item: StockItem, quantityStr: string) => {
    const quantity = parseInt(quantityStr, 10) || 0;
    if (quantity > item.quantity) {
        toast({
            variant: "destructive",
            title: "QUANTIDADE INVÁLIDA",
            description: `A QUANTIDADE PARA ${item.name} NÃO PODE EXCEDER O ESTOQUE DISPONÍVEL DE ${item.quantity}.`,
        });
        setSelectedParts(prev => ({...prev, [item.id]: item.quantity}));
    } else {
        setSelectedParts(prev => ({...prev, [item.id]: quantity}));
    }
  };

  const handleAdd = () => {
    const partsToAdd: UsedPart[] = Object.entries(selectedParts)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => {
            const stockItem = stockItems.find(item => item.id === itemId)!;
            return {
                itemId: stockItem.id,
                code: stockItem.code,
                name: stockItem.name,
                quantity,
                sale_price: stockItem.sale_price,
            };
        });
    onAddParts(partsToAdd);
    onOpenChange(false);
  };

  const filteredStock = stockItems.filter(item => 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !currentParts.some(p => p.itemId === item.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ADICIONAR PEÇAS DO ESTOQUE</DialogTitle>
          <DialogDescription>PESQUISE E SELECIONE AS PEÇAS PARA ADICIONAR À ORDEM DE SERVIÇO.</DialogDescription>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="PESQUISAR PEÇA POR NOME OU CÓDIGO..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <ScrollArea className="h-72">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>PRODUTO</TableHead>
                        <TableHead className="text-center">DISPONÍVEL</TableHead>
                        <TableHead className="w-[120px] text-center">QUANTIDADE</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredStock.length > 0 ? filteredStock.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.code}</div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-center">
                                <Input 
                                    type="number" 
                                    min="0"
                                    max={item.quantity}
                                    className="h-8 text-center"
                                    value={selectedParts[item.id] || ''}
                                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                                    disabled={item.quantity === 0}
                                />
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">NENHUMA PEÇA ENCONTRADA.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>CANCELAR</Button>
          <Button onClick={handleAdd}>ADICIONAR PEÇAS SELECIONADAS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
