
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
import type { FinancialTransaction } from "../page";

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: FinancialTransaction | null;
  onDelete: (transaction: FinancialTransaction) => void;
}

export function DeleteTransactionDialog({ isOpen, onOpenChange, transaction, onDelete }: DeleteTransactionDialogProps) {
    if (!transaction) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento financeiro: <span className="font-bold">{transaction.description}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => onDelete(transaction)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Excluir
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    );
}

    