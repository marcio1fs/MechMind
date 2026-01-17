
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAIDiagnosisForOrder } from "../actions";
import type { Order, UsedPart, PerformedService } from "../page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPartDialog } from "./add-part-dialog";
import type { StockItem } from "../../inventory/page";
import type { Mechanic } from "../../mechanics/page";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(1, "O NOME DO CLIENTE É OBRIGATÓRIO."),
  customerDocumentType: z.enum(["CPF", "CNPJ"]).default("CPF"),
  customerCpf: z.string().optional(),
  customerCnpj: z.string().optional(),
  customerPhone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Allow empty
      const cleanVal = val.replace(/\D/g, '');
      return cleanVal.length === 10 || cleanVal.length === 11;
    }, {
      message: "TELEFONE INVÁLIDO. DEVE CONTER 10 OU 11 DÍGITOS.",
    }),
  vehicle: z.object({
    make: z.string().min(1, "A MARCA É OBRIGATÓRIA."),
    model: z.string().min(1, "O MODELO É OBRIGATÓRIO."),
    year: z.coerce
      .number()
      .min(1900, "ANO INVÁLIDO.")
      .max(new Date().getFullYear() + 1, "ANO INVÁLIDO."),
    plate: z.string()
        .min(7, "A PLACA DEVE TER 7 CARACTERES.")
        .max(7, "A PLACA DEVE TER 7 CARACTERES.")
        .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i, "PLACA INVÁLIDA. USE O FORMATO ABC1234 OU ABC1D23.")
        .transform(val => val.toUpperCase()),
    color: z.string().min(1, "A COR DO VEÍCULO É OBRIGATÓRIA."),
  }),
  mechanicId: z.string().optional(),
  mechanicName: z.string().optional(),
  startDate: z.date({
    required_error: "A DATA DE INÍCIO É OBRIGATÓRIA.",
  }),
  status: z.enum(["CONCLUÍDO", "EM ANDAMENTO", "PENDENTE", "FINALIZADO"]),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  services: z.array(z.object({
    description: z.string().min(1, "A DESCRIÇÃO É OBRIGATÓRIA."),
    quantity: z.coerce.number().min(1, "A QUANTIDADE DEVE SER PELO MENOS 1."),
    unitPrice: z.coerce.number().min(0, "O PREÇO NÃO PODE SER NEGATIVO."),
  })).optional(),
  parts: z.array(z.object({
    itemId: z.string(),
    code: z.string(),
    name: z.string(),
    quantity: z.number(),
    sale_price: z.number(),
  })).optional(),
  total: z.coerce.number().min(0, "O TOTAL NÃO PODE SER NEGATIVO."),
}).superRefine((data, ctx) => {
    if (data.customerDocumentType === 'CPF' && data.customerCpf) {
        if (data.customerCpf.replace(/\D/g, '').length !== 11) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CPF INVÁLIDO. DEVE CONTER 11 DÍGITOS.",
                path: ["customerCpf"],
            });
        }
    }
    if (data.customerDocumentType === 'CNPJ' && data.customerCnpj) {
        if (data.customerCnpj.replace(/\D/g, '').length !== 14) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CNPJ INVÁLIDO. DEVE CONTER 14 DÍGITOS.",
                path: ["customerCnpj"],
            });
        }
    }
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onSave: (order: Order) => void;
  stockItems: StockItem[];
  mechanics: Mechanic[];
  vehicleMakes: string[];
}

export function OrderDialog({
  isOpen,
  onOpenChange,
  order,
  onSave,
  stockItems,
  mechanics,
  vehicleMakes,
}: OrderDialogProps) {
  const { toast } = useToast();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      customerDocumentType: "CPF",
      customerCpf: "",
      customerCnpj: "",
      customerPhone: "",
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
      services: [],
      parts: [],
      total: 0,
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const status = form.watch("status");
  const isFinalizado = status === "FINALIZADO";
  const parts = form.watch("parts");
  const watchedServices = form.watch("services");
  const documentType = form.watch("customerDocumentType");

  const partsTotal = useMemo(() => {
    if (!parts) return 0;
    return parts.reduce((acc, part) => acc + (part.quantity * part.sale_price), 0);
  }, [parts]);

  const servicesTotal = useMemo(() => {
    if (!watchedServices) return 0;
    return watchedServices.reduce((acc, service) => {
        const qty = Number(service.quantity) || 0;
        const price = Number(service.unitPrice) || 0;
        return acc + (qty * price);
    }, 0);
  }, [watchedServices]);

  useEffect(() => {
    if (isOpen) {
      if (order) {
        form.reset({
          ...order,
          customerDocumentType: order.customerDocumentType || "CPF",
          startDate: new Date(order.startDate),
          services: order.services || [],
          parts: order.parts || [],
        });
      } else {
        form.reset({
          customer: "",
          customerDocumentType: "CPF",
          customerCpf: "",
          customerCnpj: "",
          customerPhone: "",
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
          services: [],
          parts: [],
          total: 0,
        });
      }
    }
  }, [order, form, isOpen]);

  useEffect(() => {
    form.setValue("total", partsTotal + servicesTotal, { shouldValidate: true });
  }, [partsTotal, servicesTotal, form]);

  const onSubmit = (data: OrderFormValues) => {
    const selectedMechanic = mechanics.find(m => m.id === data.mechanicId);
    onSave({
      ...data,
      id: order?.id || `ORD-${Date.now()}`,
      mechanicName: selectedMechanic?.name,
      services: data.services || [],
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
    const updatedParts: UsedPart[] = [...currentParts];

    newParts.forEach(newPart => {
        const existingPartIndex = updatedParts.findIndex(p => p.itemId === newPart.itemId);
        if (existingPartIndex > -1) {
            updatedParts[existingPartIndex].quantity += newPart.quantity;
        } else {
            updatedParts.push(newPart);
        }
    });

    form.setValue('parts', updatedParts, { shouldValidate: true });
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto pr-4"
          >
            {isFinalizado && (
              <div className="p-4 rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                ORDEM DE SERVIÇO FINALIZADA E PAGA. A EDIÇÃO NÃO É PERMITIDA.
              </div>
            )}
            <h3 className="text-base font-semibold text-foreground border-b pb-2 mt-2">CLIENTE E VEÍCULO</h3>
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NOME DO CLIENTE</FormLabel>
                  <FormControl>
                    <Input placeholder="EX: JOÃO DA SILVA" {...field} disabled={isFinalizado} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerDocumentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIPO DE DOCUMENTO</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      disabled={isFinalizado}
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="CPF" id="cpf" />
                        </FormControl>
                        <Label htmlFor="cpf" className="font-normal">PESSOA FÍSICA (CPF)</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="CNPJ" id="cnpj" />
                        </FormControl>
                        <Label htmlFor="cnpj" className="font-normal">PESSOA JURÍDICA (CNPJ)</Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                {documentType === "CPF" ? (
                    <FormField
                    control={form.control}
                    name="customerCpf"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                            <Input placeholder="000.000.000-00" {...field} value={field.value ?? ""} disabled={isFinalizado} maxLength={14} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                ) : (
                    <FormField
                    control={form.control}
                    name="customerCnpj"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                            <Input placeholder="00.000.000/0000-00" {...field} value={field.value ?? ""} disabled={isFinalizado} maxLength={18} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>TELEFONE/WHATSAPP</FormLabel>
                    <FormControl>
                        <Input placeholder="5511999998888" {...field} value={field.value ?? ""} disabled={isFinalizado} maxLength={15} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle.make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MARCA</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFinalizado}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="SELECIONE A MONTADORA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleMakes.map(make => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="EX: CIVIC" {...field} disabled={isFinalizado}/>
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
                      <Input type="number" {...field} disabled={isFinalizado}/>
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
                      <Input placeholder="EX: ABC1234" {...field} disabled={isFinalizado} maxLength={7}/>
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
                      <Input placeholder="EX: PRETO" {...field} disabled={isFinalizado}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <h3 className="text-base font-semibold text-foreground border-b pb-2">DETALHES DA ORDEM DE SERVIÇO</h3>
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
                            disabled={isFinalizado}
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
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01") || isFinalizado}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFinalizado}>
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
                    disabled={isFinalizado}
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
                       <SelectItem value="FINALIZADO" disabled>FINALIZADO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />

            <h3 className="text-base font-semibold text-foreground border-b pb-2">DIAGNÓSTICO E SERVIÇOS</h3>
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
                        disabled={isFinalizado}
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
                        disabled={isDiagnosing || isFinalizado}
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
                <FormLabel>{status === 'PENDENTE' ? "SERVIÇOS PLANEJADOS" : "SERVIÇOS REALIZADOS"}</FormLabel>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SERVIÇO</TableHead>
                                <TableHead className="w-[100px] text-center">QTD</TableHead>
                                <TableHead className="w-[150px] text-right">VALOR UN.</TableHead>
                                <TableHead className="w-[150px] text-right">SUBTOTAL</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {serviceFields.map((field, index) => {
                                const quantity = watchedServices?.[index]?.quantity || 0;
                                const unitPrice = watchedServices?.[index]?.unitPrice || 0;
                                const subtotal = quantity * unitPrice;
                                return (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`services.${index}.description`}
                                                render={({ field }) => (
                                                    <Input {...field} placeholder="EX: TROCA DE ÓLEO" className="w-full" disabled={isFinalizado}/>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`services.${index}.quantity`}
                                                render={({ field }) => (
                                                    <Input type="number" {...field} className="w-full text-center" min="1" disabled={isFinalizado}/>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`services.${index}.unitPrice`}
                                                render={({ field }) => (
                                                    <Input type="number" step="0.01" {...field} className="w-full text-right" min="0" disabled={isFinalizado}/>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">R${subtotal.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeService(index)} disabled={isFinalizado}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {serviceFields.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">NENHUM SERVIÇO ADICIONADO.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => appendService({ description: "", quantity: 1, unitPrice: 0 })}
                    className="w-full sm:w-auto self-start"
                    disabled={isFinalizado}
                >
                    ADICIONAR SERVIÇO
                </Button>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="text-base font-semibold text-foreground border-b pb-2">{status === 'PENDENTE' ? "PEÇAS E CUSTOS ESTIMADOS" : "PEÇAS E CUSTOS FINAIS"}</h3>
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
                                      <Button variant="ghost" size="icon" onClick={() => handleRemovePart(index)} disabled={isFinalizado}>
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
              <Button type="button" variant="outline" onClick={() => setIsAddPartDialogOpen(true)} disabled={isFinalizado}>
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
                    <Input type="number" step="0.01" {...field} disabled={isFinalizado} />
                  </FormControl>
                  <FormDescription>
                    O VALOR TOTAL É A SOMA DOS SERVIÇOS E PEÇAS. VOCÊ PODE AJUSTÁ-LO MANUALMENTE SE NECESSÁRIO.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>CANCELAR</Button>
              <Button type="submit" disabled={isFinalizado}>SALVAR ORDEM DE SERVIÇO</Button>
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
