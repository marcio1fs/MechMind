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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Order } from "../page";
import { useEffect } from "react";

const formSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(1, "O nome do cliente é obrigatório."),
  vehicle: z.object({
    make: z.string().min(1, "A marca é obrigatória."),
    model: z.string().min(1, "O modelo é obrigatório."),
    year: z.coerce.number().min(1900, "Ano inválido.").max(new Date().getFullYear() + 1, "Ano inválido."),
  }),
  status: z.enum(["Concluído", "Em Andamento", "Pendente"]),
  services: z.string().min(1, "Descreva os serviços."),
  parts: z.string().optional(),
  total: z.coerce.number().min(0, "O total não pode ser negativo."),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onSave: (order: Order) => void;
}

export function OrderDialog({ isOpen, onOpenChange, order, onSave }: OrderDialogProps) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      vehicle: { make: "", model: "", year: new Date().getFullYear() },
      status: "Pendente",
      services: "",
      parts: "",
      total: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (order) {
          form.reset(order);
        } else {
          form.reset({
            customer: "",
            vehicle: { make: "", model: "", year: new Date().getFullYear() },
            status: "Pendente",
            services: "",
            parts: "",
            total: 0,
          });
        }
    }
  }, [order, form, isOpen]);

  const onSubmit = (data: OrderFormValues) => {
    onSave({
      ...data,
      id: order?.id || `ORD-${Date.now()}`,
    });
    onOpenChange(false);
  };

  const title = order ? "Editar Ordem de Serviço" : "Adicionar Nova Ordem de Serviço";
  const description = order ? "Edite os detalhes da ordem de serviço." : "Preencha os detalhes para adicionar uma nova ordem de serviço.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle.make"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                          <Input placeholder="Ex: Honda" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle.model"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                          <Input placeholder="Ex: Civic" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle.year"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />
            <div className="grid gap-2">
                <FormField
                    control={form.control}
                    name="services"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Serviços Realizados</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Descreva os serviços a serem realizados..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
             <div className="grid gap-2">
                <FormField
                    control={form.control}
                    name="parts"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Peças Substituídas (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Liste as peças utilizadas..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
             <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="submit">Salvar Ordem de Serviço</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
