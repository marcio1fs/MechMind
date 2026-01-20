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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatNumber } from "@/lib/utils";
import { Copy } from "lucide-react";

interface PixPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: {
    name: string;
    price: number;
  } | null;
}

const PIX_KEY = "77988849278";

export function PixPaymentDialog({ isOpen, onOpenChange, plan }: PixPaymentDialogProps) {
  const { toast } = useToast();
  const qrCodeImage = PlaceHolderImages.find((p) => p.id === "pix-qrcode");

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast({
      title: "Chave PIX Copiada!",
      description: "A chave PIX foi copiada para a área de transferência.",
    });
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX - Plano {plan.name}</DialogTitle>
          <DialogDescription>
            Para ativar seu plano, realize o pagamento e envie o comprovante para nosso suporte.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center">Valor a pagar: <span className="font-bold text-xl">R$ {formatNumber(plan.price)}</span></p>
            
            {qrCodeImage && (
                <Image
                    src={qrCodeImage.imageUrl}
                    alt="PIX QR Code"
                    width={250}
                    height={250}
                    className="rounded-md"
                    data-ai-hint={qrCodeImage.imageHint}
                />
            )}
            
            <p className="text-sm text-muted-foreground">Ou use a chave PIX (copia e cola):</p>

            <Card className="w-full">
                <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                        <Input value={PIX_KEY} readOnly className="font-mono"/>
                        <Button variant="outline" size="icon" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copiar Chave PIX</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground px-4">
                Após o pagamento, a ativação do plano pode levar alguns minutos. Envie o comprovante para nosso e-mail ou WhatsApp para agilizar.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
