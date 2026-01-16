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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle } from "lucide-react";

type StockItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  sale_price: number;
};

const mockStockItems: StockItem[] = [
  { id: "ITEM-001", code: "HF-103", name: "Filtro de Óleo", category: "Motor", quantity: 25, min_quantity: 10, cost_price: 15.50, sale_price: 35.00 },
  { id: "ITEM-002", code: "PST-201", name: "Pastilha de Freio Dianteira", category: "Freios", quantity: 8, min_quantity: 10, cost_price: 80.00, sale_price: 150.00 },
  { id: "ITEM-003", code: "BLB-H4", name: "Lâmpada H4", category: "Elétrica", quantity: 0, min_quantity: 20, cost_price: 5.00, sale_price: 15.00 },
  { id: "ITEM-004", code: "AMRT-D01", name: "Amortecedor Dianteiro", category: "Suspensão", quantity: 4, min_quantity: 4, cost_price: 250.00, sale_price: 450.00 },
  { id: "ITEM-005", code: "VLA-IR", name: "Vela de Ignição Iridium", category: "Motor", quantity: 15, min_quantity: 16, cost_price: 45.00, sale_price: 90.00 },
];

function getStatus(quantity: number, min_quantity: number): { text: string; variant: "default" | "outline" | "destructive" } {
  if (quantity <= 0) {
    return { text: "Fora de Estoque", variant: "destructive" };
  }
  if (quantity <= min_quantity) {
    return { text: "Estoque Baixo", variant: "outline" };
  }
  return { text: "Em Estoque", variant: "default" };
}

export default function InventoryPage() {
  const [stockItems, setStockItems] = useState(mockStockItems);

  // TODO: Add dialogs for Add/Edit/Delete/Movement

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Controle de Estoque</h1>
                <p className="text-muted-foreground">
                Gerencie as peças e produtos da sua oficina.
                </p>
            </div>
            <div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Item
                </Button>
            </div>
        </div>

      <Card>
        <CardHeader>
            <CardTitle>Itens em Estoque</CardTitle>
            <CardDescription>
                A lista de todas as peças cadastradas no seu estoque.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Estoque Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Preço de Venda</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stockItems.map((item) => {
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
                        <TableCell className="text-right">R${item.sale_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Ações</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                    <DropdownMenuItem>Movimentar</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
