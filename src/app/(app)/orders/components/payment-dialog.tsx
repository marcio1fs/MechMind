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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "../page";
import { useState, useEffect } from "react";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onConfirm: (order: Order, paymentMethod: string, discountValue: number) => void;
}

const paymentMethods = ["DINHEIRO", "PIX", "CARTÃO DE CRÉDITO", "CARTÃO DE DÉBITO"];

export function PaymentDialog({ isOpen, onOpenChange, order, onConfirm }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setDiscountPercent(0);
      setPaymentMethod(paymentMethods[0]);
    }
  }, [isOpen]);

  if (!order) return null;

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let percent = parseFloat(e.target.value) || 0;
    if (percent > 10) {
      percent = 10;
      toast({
        variant: "destructive",
        title: "LIMITE DE DESCONTO ATINGIDO",
        description: "O DESCONTO MÁXIMO PERMITIDO É DE 10%.",
      });
    }
    if (percent < 0) {
        percent = 0;
    }
    setDiscountPercent(percent);
  };
  
  const discountValue = (order.total * discountPercent) / 100;
  const finalTotal = order.total - discountValue;

  const handleConfirm = () => {
    onConfirm(order, paymentMethod, discountValue);
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
            <div className="space-y-2 rounded-md border p-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">VALOR ORIGINAL</span>
                    <span>R${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-destructive">
                    <span className="text-destructive">DESCONTO ({discountPercent}%)</span>
                    <span>-R${discountValue.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
                    <span>VALOR FINAL</span>
                    <span>R${finalTotal.toFixed(2)}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                 <div className="grid gap-2">
                    <Label htmlFor="discount">DESCONTO (%)</Label>
                    <Input id="discount" type="number" value={discountPercent} onChange={handleDiscountChange} max={10} min={0} placeholder="0"/>
                </div>
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
