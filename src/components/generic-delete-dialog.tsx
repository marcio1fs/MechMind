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
import { Loader2 } from "lucide-react";

interface GenericDeleteDialogProps<T> {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: T | null;
  onDelete: (item: T) => Promise<void>;
  title: string;
  description: React.ReactNode;
}

export function GenericDeleteDialog<T>({ isOpen, onOpenChange, item, onDelete, title, description }: GenericDeleteDialogProps<T>) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!item) return;
        setIsDeleting(true);
        try {
            await onDelete(item);
        } finally {
            setIsDeleting(false);
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
                {description}
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
