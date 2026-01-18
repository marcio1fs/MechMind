"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Order } from "../page";

interface DeleteOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onDelete: (order: Order) => void;
}

export function DeleteOrderDialog({ isOpen, onOpenChange, order, onDelete }: DeleteOrderDialogProps) {
    if (!order) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a ordem de serviço <span className="font-bold">#{order.displayId}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => onDelete(order)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Excluir
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    );
}

    