"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { StockItem } from "../page";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "O código é obrigatório."),
  name: z.string().min(1, "O nome é obrigatório."),
  category: z.string().min(1, "A categoria é obrigatória."),
  quantity: z.coerce.number().min(0, "A quantidade não pode ser negativa."),
  min_quantity: z.coerce.number().min(0, "A quantidade mínima não pode ser negativa."),
  cost_price: z.coerce.number().min(0, "O preço de custo não pode ser negativo."),
  sale_price: z.coerce.number().min(0, "O preço de venda não pode ser negativo."),
});

type StockItemFormValues = z.infer<typeof formSchema>;

interface StockItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: StockItem | null;
  onSave: (item: StockItemFormValues) => Promise<void>;
}

const stockCategories = [
  "ACESSÓRIOS",
  "AR CONDICIONADO",
  "ARREFECIMENTO",
  "CARROCERIA",
  "ELÉTRICA",
  "FILTROS",
  "FREIOS",
  "IGNIÇÃO",
  "INJEÇÃO ELETRÔNICA",
  "MOTOR",
  "ÓLEOS E FLUIDOS",
  "PNEUS E RODAS",
  "SEGURANÇA",
  "SUSPENSÃO",
  "TRANSMISSÃO",
  "OUTROS",
];

export function StockItemDialog({ isOpen, onOpenChange, item, onSave }: StockItemDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "",
      quantity: 0,
      min_quantity: 0,
      cost_price: 0,
      sale_price: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (item) {
          form.reset(item);
        } else {
          form.reset({
            id: undefined,
            code: "",
            name: "",
            category: "",
            quantity: 0,
            min_quantity: 0,
            cost_price: 0,
            sale_price: 0,
          });
        }
    }
  }, [item, form, isOpen]);

  const onSubmit = async (data: StockItemFormValues) => {
    setIsSaving(true);
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled and toasted in the parent
    } finally {
      setIsSaving(false);
    }
  };

  const title = item ? "Editar Item" : "Adicionar Novo Item";
  const description = item ? "Edite os detalhes do item de estoque." : "Preencha os detalhes para adicionar um novo item.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome do Produto</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Filtro de Óleo" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: HF-103" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                        <>
                           <Input placeholder="Ex: Motor" {...field} list="stock-categories" />
                           <datalist id="stock-categories">
                                {stockCategories.map(category => <option key={category} value={category} />)}
                           </datalist>
                        </>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="min_quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Preço de Venda</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
