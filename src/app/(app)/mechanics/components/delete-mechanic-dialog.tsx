"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";

interface DeleteMechanicDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mechanic: Mechanic | null;
  onDelete: (mechanic: Mechanic) => Promise<void>;
}

export function DeleteMechanicDialog({ isOpen, onOpenChange, mechanic, onDelete }: DeleteMechanicDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!mechanic) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(mechanic);
        } finally {
            setIsDeleting(false);
        }
    };

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
            <AlertDialogCancel disabled={isDeleting}>CANCELAR</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                EXCLUIR
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    );
}

    