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
import type { Mechanic } from "../page";

interface DeleteMechanicDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mechanic: Mechanic | null;
  onDelete: (mechanic: Mechanic) => void;
}

export function DeleteMechanicDialog({ isOpen, onOpenChange, mechanic, onDelete }: DeleteMechanicDialogProps) {
    if (!mechanic) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>VOCÊ TEM CERTEZA?</AlertDialogTitle>
            <AlertDialogDescription>
                ESTA AÇÃO NÃO PODE SER DESFEITA. ISTO EXCLUIRÁ PERMANENTEMENTE O MECÂNICO <span className="font-bold">{`${mechanic.firstName} ${mechanic.lastName}`}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>CANCELAR</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => onDelete(mechanic)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                EXCLUIR
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    );
}

    