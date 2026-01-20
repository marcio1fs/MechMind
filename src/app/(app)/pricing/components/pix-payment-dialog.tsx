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
import { formatNumber } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


interface PixPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: {
    name: string;
    price: number;
  } | null;
}

export function PixPaymentDialog({ isOpen, onOpenChange, plan }: PixPaymentDialogProps) {

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX - Plano {plan.name}</DialogTitle>
          <DialogDescription>
            Para ativar seu plano, entre em contato com nosso suporte para receber as instruções de pagamento.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center">Valor a pagar: <span className="font-bold text-xl">R$ {formatNumber(plan.price)}</span></p>
            
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Configuração Pendente</AlertTitle>
                <AlertDescription>
                    A chave PIX não está configurada. Por favor, entre em contato com o suporte para finalizar a assinatura.
                </AlertDescription>
            </Alert>

            <p className="text-xs text-center text-muted-foreground px-4">
                Após o contato e o pagamento, a ativação do plano pode levar alguns minutos.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
