"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAIDiagnosisForOrder } from "../actions";
import type { Order } from "../page";

const formSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(1, "O nome do cliente é obrigatório."),
  vehicle: z.object({
    make: z.string().min(1, "A marca é obrigatória."),
    model: z.string().min(1, "O modelo é obrigatório."),
    year: z.coerce
      .number()
      .min(1900, "Ano inválido.")
      .max(new Date().getFullYear() + 1, "Ano inválido."),
    plate: z.string().min(1, "O número da placa é obrigatório.").toUpperCase(),
    color: z.string().min(1, "A cor do veículo é obrigatória."),
  }),
  startDate: z.date({
    required_error: "A data de início é obrigatória.",
  }),
  status: z.enum(["Concluído", "Em Andamento", "Pendente"]),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  services: z.string().optional(),
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

export function OrderDialog({
  isOpen,
  onOpenChange,
  order,
  onSave,
}: OrderDialogProps) {
  const { toast } = useToast();
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      vehicle: {
        make: "",
        model: "",
        year: new Date().getFullYear(),
        plate: "",
        color: "",
      },
      status: "Pendente",
      symptoms: "",
      diagnosis: "",
      services: "",
      parts: "",
      total: 0,
    },
  });

  const status = form.watch("status");

  useEffect(() => {
    if (isOpen) {
      if (order) {
        form.reset({
          ...order,
          startDate: new Date(order.startDate),
        });
      } else {
        form.reset({
          customer: "",
          vehicle: {
            make: "",
            model: "",
            year: new Date().getFullYear(),
            plate: "",
            color: "",
          },
          startDate: new Date(),
          status: "Pendente",
          symptoms: "",
          diagnosis: "",
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

  const handleGenerateDiagnosis = async () => {
    const symptoms = form.getValues("symptoms");
    if (!symptoms || symptoms.length < 10) {
      toast({
        variant: "destructive",
        title: "Sintomas insuficientes",
        description:
          "Por favor, descreva os sintomas com mais detalhes para obter um diagnóstico.",
      });
      return;
    }
    setIsDiagnosing(true);
    const result = await getAIDiagnosisForOrder({
      symptoms,
      vehicleHistory: "",
    }); // vehicleHistory is optional.
    if (result.data) {
      const formattedDiagnosis = `Diagnóstico: ${
        result.data.diagnosis
      }\n\nConfiança: ${(result.data.confidenceLevel * 100).toFixed(
        0
      )}%\n\nAções Recomendadas:\n${result.data.recommendedActions}`;
      form.setValue("diagnosis", formattedDiagnosis, { shouldValidate: true });
      toast({ title: "Diagnóstico gerado com sucesso!" });
    } else {
      toast({
        variant: "destructive",
        title: "Erro no Diagnóstico",
        description: result.message || "Não foi possível gerar o diagnóstico.",
      });
    }
    setIsDiagnosing(false);
  };

  const title = order
    ? "Editar Ordem de Serviço"
    : "Adicionar Nova Ordem de Serviço";
  const description = order
    ? "Edite os detalhes da ordem de serviço."
    : "Preencha os detalhes para adicionar uma nova ordem de serviço.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto pr-4"
          >
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <FormField
                control={form.control}
                name="vehicle.plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ABC1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicle.color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Preto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sintomas Reportados</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os sintomas reportados pelo cliente..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Diagnóstico por IA</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDiagnosis}
                        disabled={isDiagnosing}
                      >
                        {isDiagnosing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Gerar Diagnóstico
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="O diagnóstico gerado pela IA aparecerá aqui..."
                        {...field}
                        className="min-h-24"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{status === 'Pendente' ? "Serviços Planejados (Opcional)" : "Serviços Realizados"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={status === 'Pendente' ? "Descreva os serviços a serem realizados..." : "Descreva os serviços realizados..."}
                        {...field}
                      />
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
                    <FormLabel>{status === 'Pendente' ? "Peças Estimadas (Opcional)" : "Peças Substituídas (Opcional)"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={status === 'Pendente' ? "Liste as peças estimadas para o serviço..." : "Liste as peças utilizadas..."}
                        {...field}
                      />
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
                  <FormLabel>{status === 'Pendente' ? "Orçamento Inicial (R$)" : "Total Final (R$)"}</FormLabel>
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
