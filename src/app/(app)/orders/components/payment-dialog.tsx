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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Order } from "../page";
import { useState } from "react";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onConfirm: (order: Order, paymentMethod: string) => void;
}

const paymentMethods = ["DINHEIRO", "PIX", "CARTÃO DE CRÉDITO", "CARTÃO DE DÉBITO"];

export function PaymentDialog({ isOpen, onOpenChange, order, onConfirm }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);

  if (!order) return null;

  const handleConfirm = () => {
    onConfirm(order, paymentMethod);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>REGISTRAR PAGAMENTO</DialogTitle>
          <DialogDescription>
            CONFIRME O PAGAMENTO PARA A ORDEM DE SERVIÇO <span className="font-bold">{order.id}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">CLIENTE</span>
                <span className="font-semibold">{order.customer}</span>
            </div>
             <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">VALOR TOTAL</span>
                <span className="text-2xl font-bold">R${order.total.toFixed(2)}</span>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="payment-method">FORMA DE PAGAMENTO</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                        <SelectValue placeholder="SELECIONE A FORMA DE PAGAMENTO" />
                    </SelectTrigger>
                    <SelectContent>
                        {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>CANCELAR</Button>
            <Button onClick={handleConfirm}>CONFIRMAR PAGAMENTO</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
