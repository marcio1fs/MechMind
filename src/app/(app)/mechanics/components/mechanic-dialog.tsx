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
import { useEffect } from "react";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O NOME É OBRIGATÓRIO."),
  specialty: z.string().min(1, "A ESPECIALIDADE É OBRIGATÓRIA."),
});

type MechanicFormValues = z.infer<typeof formSchema>;

interface MechanicDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mechanic: Mechanic | null;
  onSave: (mechanic: Mechanic) => void;
}

export function MechanicDialog({ isOpen, onOpenChange, mechanic, onSave }: MechanicDialogProps) {
  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specialty: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (mechanic) {
          form.reset(mechanic);
        } else {
          form.reset({
            name: "",
            specialty: "",
          });
        }
    }
  }, [mechanic, form, isOpen]);

  const onSubmit = (data: MechanicFormValues) => {
    onSave({
      ...data,
      id: mechanic?.id || `MEC-${Date.now()}`,
    });
    onOpenChange(false);
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
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>NOME DO MECÂNICO</FormLabel>
                <FormControl>
                    <Input placeholder="EX: CARLOS ALBERTO" {...field} />
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
              <Button type="submit">SALVAR ALTERAÇÕES</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
