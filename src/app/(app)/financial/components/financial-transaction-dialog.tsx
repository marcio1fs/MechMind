
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
import type { FinancialTransaction } from "../page";
import { useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Timestamp } from "firebase/firestore";

const formSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "A descrição é obrigatória."),
  category: z.string().min(1, "A categoria é obrigatória."),
  type: z.enum(["IN", "OUT"], { required_error: "Selecione o tipo." }),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: FinancialTransaction | null;
  onSave: (transaction: TransactionFormValues) => void;
}

export function FinancialTransactionDialog({ isOpen, onOpenChange, transaction, onSave }: FinancialTransactionDialogProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: "",
      type: "OUT",
      value: 0,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (transaction) {
          form.reset({
              ...transaction,
              date: transaction.date instanceof Timestamp ? transaction.date.toDate() : transaction.date,
          });
        } else {
          form.reset({
            id: undefined,
            description: "",
            category: "",
            type: "OUT",
            value: 0,
            date: new Date(),
          });
        }
    }
  }, [transaction, form, isOpen]);

  const onSubmit = (data: TransactionFormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  const title = transaction ? "Editar Lançamento" : "Adicionar Novo Lançamento";
  const description = transaction ? "Edite os detalhes do lançamento financeiro." : "Preencha os detalhes para adicionar um novo lançamento.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>TIPO DE LANÇAMENTO</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="IN" />
                        </FormControl>
                        <FormLabel className="font-normal">ENTRADA</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="OUT" />
                        </FormControl>
                        <FormLabel className="font-normal">SAÍDA</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DESCRIÇÃO</FormLabel>
                  <FormControl>
                    <Input placeholder="EX: COMPRA DE FERRAMENTAS" {...field} />
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
                  <FormLabel>CATEGORIA</FormLabel>
                  <FormControl>
                    <Input placeholder="EX: DESPESAS OPERACIONAIS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>VALOR (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel>DATA</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal normal-case",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                            ) : (
                                <span>ESCOLHA UMA DATA</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="submit">SALVAR LANÇAMENTO</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    