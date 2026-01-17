"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Sparkles, Trash2 } from "lucide-react";

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
  FormDescription,
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
import type { Order, UsedPart } from "../page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPartDialog } from "./add-part-dialog";
import type { StockItem } from "../../inventory/page";
import type { Mechanic } from "../../mechanics/page";

const formSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(1, "O NOME DO CLIENTE É OBRIGATÓRIO."),
  vehicle: z.object({
    make: z.string().min(1, "A MARCA É OBRIGATÓRIA."),
    model: z.string().min(1, "O MODELO É OBRIGATÓRIO."),
    year: z.coerce
      .number()
      .min(1900, "ANO INVÁLIDO.")
      .max(new Date().getFullYear() + 1, "ANO INVÁLIDO."),
    plate: z.string().min(1, "O NÚMERO DA PLACA É OBRIGATÓRIO.").toUpperCase(),
    color: z.string().min(1, "A COR DO VEÍCULO É OBRIGATÓRIA."),
  }),
  mechanicId: z.string().optional(),
  mechanicName: z.string().optional(),
  startDate: z.date({
    required_error: "A DATA DE INÍCIO É OBRIGATÓRIA.",
  }),
  status: z.enum(["CONCLUÍDO", "EM ANDAMENTO", "PENDENTE"]),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  services: z.string().optional(),
  parts: z.array(z.object({
    itemId: z.string(),
    code: z.string(),
    name: z.string(),
    quantity: z.number(),
    sale_price: z.number(),
  })).optional(),
  total: z.coerce.number().min(0, "O TOTAL NÃO PODE SER NEGATIVO."),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onSave: (order: Order) => void;
  stockItems: StockItem[];
  mechanics: Mechanic[];
}

export function OrderDialog({
  isOpen,
  onOpenChange,
  order,
  onSave,
  stockItems,
  mechanics,
}: OrderDialogProps) {
  const { toast } = useToast();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);

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
      status: "PENDENTE",
      symptoms: "",
      diagnosis: "",
      services: "",
      parts: [],
      total: 0,
    },
  });

  const status = form.watch("status");
  const parts = form.watch("parts");

  const partsTotal = useMemo(() => {
    if (!parts) return 0;
    return parts.reduce((acc, part) => acc + (part.quantity * part.sale_price), 0);
  }, [parts]);

  useEffect(() => {
    if (isOpen) {
      if (order) {
        form.reset({
          ...order,
          startDate: new Date(order.startDate),
          parts: order.parts || [],
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
          status: "PENDENTE",
          symptoms: "",
          diagnosis: "",
          services: "",
          parts: [],
          total: 0,
        });
      }
    }
  }, [order, form, isOpen]);

  useEffect(() => {
    form.setValue("total", partsTotal, { shouldValidate: true });
  }, [partsTotal, form]);

  const onSubmit = (data: OrderFormValues) => {
    const selectedMechanic = mechanics.find(m => m.id === data.mechanicId);
    onSave({
      ...data,
      id: order?.id || `ORD-${Date.now()}`,
      mechanicName: selectedMechanic?.name,
      parts: data.parts || [],
    });
    onOpenChange(false);
  };

  const handleGenerateDiagnosis = async () => {
    const symptoms = form.getValues("symptoms");
    if (!symptoms || symptoms.length < 10) {
      toast({
        variant: "destructive",
        title: "SINTOMAS INSUFICIENTES",
        description:
          "POR FAVOR, DESCREVA OS SINTOMAS COM MAIS DETALHES PARA OBTER UM DIAGNÓSTICO.",
      });
      return;
    }
    setIsDiagnosing(true);
    const result = await getAIDiagnosisForOrder({
      symptoms,
      vehicleHistory: "",
    }); // vehicleHistory is optional.
    if (result.data) {
      const formattedDiagnosis = `DIAGNÓSTICO: ${
        result.data.diagnosis
      }\n\nCONFIANÇA: ${(result.data.confidenceLevel * 100).toFixed(
        0
      )}%\n\nAÇÕES RECOMENDADAS:\n${result.data.recommendedActions}`;
      form.setValue("diagnosis", formattedDiagnosis, { shouldValidate: true });
      toast({ title: "DIAGNÓSTICO GERADO COM SUCESSO!" });
    } else {
      toast({
        variant: "destructive",
        title: "ERRO NO DIAGNÓSTICO",
        description: result.message || "NÃO FOI POSSÍVEL GERAR O DIAGNÓSTICO.",
      });
    }
    setIsDiagnosing(false);
  };

  const handleAddParts = (newParts: UsedPart[]) => {
    const currentParts = form.getValues('parts') || [];
    
    const updatedParts = newParts.reduce((acc, newPart) => {
        const existingPartIndex = acc.findIndex(p => p.itemId === newPart.itemId);
        if (existingPartIndex > -1) {
            const newAcc = [...acc];
            const existingPart = newAcc[existingPartIndex];
            newAcc[existingPartIndex] = {
                ...existingPart,
                quantity: existingPart.quantity + newPart.quantity,
            };
            return newAcc;
        }
        return [...acc, newPart];
    }, currentParts);

    form.setValue('parts', [...updatedParts], { shouldValidate: true });
  };

  const handleRemovePart = (index: number) => {
    const currentParts = form.getValues('parts') || [];
    const updatedParts = currentParts.filter((_, i) => i !== index);
    form.setValue('parts', updatedParts, { shouldValidate: true });
  };

  const title = order
    ? "EDITAR ORDEM DE SERVIÇO"
    : "ADICIONAR NOVA ORDEM DE SERVIÇO";
  const description = order
    ? "EDITE OS DETALHES DA ORDEM DE SERVIÇO."
    : "PREENCHA OS DETALHES PARA ADICIONAR UMA NOVA ORDEM DE SERVIÇO.";

  return (
    <>
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
                  <FormLabel>NOME DO CLIENTE</FormLabel>
                  <FormControl>
                    <Input placeholder="EX: JOÃO DA SILVA" {...field} />
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
                    <FormLabel>MARCA</FormLabel>
                    <FormControl>
                      <Input placeholder="EX: HONDA" {...field} />
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
                    <FormLabel>MODELO</FormLabel>
                    <FormControl>
                      <Input placeholder="EX: CIVIC" {...field} />
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
                    <FormLabel>ANO</FormLabel>
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
                    <FormLabel>PLACA</FormLabel>
                    <FormControl>
                      <Input placeholder="EX: ABC1234" {...field} />
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
                    <FormLabel>COR</FormLabel>
                    <FormControl>
                      <Input placeholder="EX: PRETO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>DATA DE INÍCIO</FormLabel>
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
                                format(field.value, "PPP", { locale: ptBR })
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
                name="mechanicId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>MECÂNICO RESPONSÁVEL</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="SELECIONE O MECÂNICO" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {mechanics.map(mechanic => (
                            <SelectItem key={mechanic.id} value={mechanic.id}>
                            {mechanic.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
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
                  <FormLabel>STATUS</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="SELECIONE O STATUS" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                      <SelectItem value="EM ANDAMENTO">EM ANDAMENTO</SelectItem>
                      <SelectItem value="CONCLUÍDO">CONCLUÍDO</SelectItem>
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
                    <FormLabel>SINTOMAS REPORTADOS</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="DESCREVA OS SINTOMAS REPORTADOS PELO CLIENTE..."
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
                      <FormLabel>DIAGNÓSTICO POR IA</FormLabel>
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
                        GERAR DIAGNÓSTICO
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="O DIAGNÓSTICO GERADO PELA IA APARECERÁ AQUI..."
                        {...field}
                        className="min-h-24 uppercase"
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
                    <FormLabel>{status === 'PENDENTE' ? "SERVIÇOS PLANEJADOS (OPCIONAL)" : "SERVIÇOS REALIZADOS"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={status === 'PENDENTE' ? "DESCREVA OS SERVIÇOS A SEREM REALIZADOS..." : "DESCREVA OS SERVIÇOS REALIZADOS..."}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormLabel>{status === 'PENDENTE' ? "PEÇAS ESTIMADAS (OPCIONAL)" : "PEÇAS UTILIZADAS"}</FormLabel>
              <div className="rounded-md border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>PEÇA</TableHead>
                              <TableHead className="text-center">QTD</TableHead>
                              <TableHead className="text-right">PREÇO UN.</TableHead>
                              <TableHead className="text-right">SUBTOTAL</TableHead>
                              <TableHead className="w-12"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {parts?.map((part, index) => (
                              <TableRow key={`${part.itemId}-${index}`}>
                                  <TableCell>{part.name}</TableCell>
                                  <TableCell className="text-center">{part.quantity}</TableCell>
                                  <TableCell className="text-right">R${part.sale_price.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">R${(part.quantity * part.sale_price).toFixed(2)}</TableCell>
                                  <TableCell>
                                      <Button variant="ghost" size="icon" onClick={() => handleRemovePart(index)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                          {(!parts || parts.length === 0) && (
                              <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">NENHUMA PEÇA ADICIONADA.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
              <Button type="button" variant="outline" onClick={() => setIsAddPartDialogOpen(true)}>
                  ADICIONAR PEÇA DO ESTOQUE
              </Button>
            </div>
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{status === 'PENDENTE' ? "ORÇAMENTO ESTIMADO (R$)" : "TOTAL FINAL (R$)"}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    O VALOR TOTAL É CALCULADO AUTOMATICAMENTE COM BASE NAS PEÇAS. VOCÊ PODE AJUSTÁ-LO PARA INCLUIR OS SERVIÇOS.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">SALVAR ORDEM DE SERVIÇO</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <AddPartDialog
      isOpen={isAddPartDialogOpen}
      onOpenChange={setIsAddPartDialogOpen}
      stockItems={stockItems}
      onAddParts={handleAddParts}
      currentParts={parts || []}
    />
    </>
  );
}
