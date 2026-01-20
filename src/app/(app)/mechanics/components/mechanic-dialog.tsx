
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
import type { Mechanic } from "../page";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "O NOME É OBRIGATÓRIO."),
  lastName: z.string().min(1, "O SOBRENOME É OBRIGATÓRIO."),
  email: z.string().email("O E-MAIL É INVÁLIDO."),
  specialty: z.string().min(1, "A ESPECIALIDADE É OBRIGATÓRIA."),
});

type MechanicFormValues = z.infer<typeof formSchema>;

interface MechanicDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mechanic: Mechanic | null;
  onSave: (mechanic: Omit<Mechanic, 'oficinaId' | 'role' | 'createdAt'> & { id?: string }) => Promise<void>;
}

export function MechanicDialog({ isOpen, onOpenChange, mechanic, onSave }: MechanicDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      specialty: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (mechanic) {
          form.reset(mechanic);
        } else {
          form.reset({
            id: undefined,
            firstName: "",
            lastName: "",
            email: "",
            specialty: "",
          });
        }
    }
  }, [mechanic, form, isOpen]);

  const onSubmit = async (data: MechanicFormValues) => {
    setIsSaving(true);
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled and toasted in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  const title = mechanic ? "EDITAR MECÂNICO" : "ADICIONAR NOVO MECÂNICO";
  const description = mechanic ? "EDITE OS DETALHES DO MECÂNICO." : "PREENCHA OS DETALHES PARA ADICIONAR UM NOVO MECÂNICO.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>NOME</FormLabel>
                    <FormControl>
                        <Input placeholder="EX: CARLOS" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SOBRENOME</FormLabel>
                    <FormControl>
                        <Input placeholder="EX: ALBERTO" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>E-MAIL</FormLabel>
                <FormControl>
                    <Input placeholder="EX: carlos@email.com" {...field} type="email" readOnly={!!mechanic} />
                </FormControl>
                 <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
                <FormItem>
                <FormLabel>ESPECIALIDADE</FormLabel>
                <FormControl>
                    <Input placeholder="EX: MOTOR E INJEÇÃO" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                SALVAR ALTERAÇÕES
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
