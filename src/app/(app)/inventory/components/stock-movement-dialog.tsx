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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
import { useEffect } from "react";

const formSchema = z.object({
  type: z.enum(["IN", "OUT"], { required_error: "Selecione o tipo de movimento." }),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  reason: z.string().optional(),
});

type StockMovementFormValues = z.infer<typeof formSchema>;

interface StockMovementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: StockItem | null;
  onMove: (item: StockItem, type: "IN" | "OUT", quantity: number, reason?: string) => void;
}

export function StockMovementDialog({ isOpen, onOpenChange, item, onMove }: StockMovementDialogProps) {
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "OUT",
      quantity: 1,
      reason: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: "OUT",
        quantity: 1,
        reason: "",
      });
    }
  }, [isOpen, form]);
  
  const onSubmit = (data: StockMovementFormValues) => {
    if (item) {
        onMove(item, data.type, data.quantity, data.reason);
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Movimentar Estoque</DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída para o item: <span className="font-bold">{item?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Movimento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="OUT" />
                        </FormControl>
                        <FormLabel className="font-normal">Saída</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="IN" />
                        </FormControl>
                        <FormLabel className="font-normal">Entrada</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min="1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Ajuste de inventário, perda..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Confirmar Movimentação</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
