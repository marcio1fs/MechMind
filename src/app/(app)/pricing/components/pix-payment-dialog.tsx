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
import { Terminal, Copy } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";


interface PixPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: {
    name: string;
    price: number;
  } | null;
  pixKey?: string | null;
}

export function PixPaymentDialog({ isOpen, onOpenChange, plan, pixKey }: PixPaymentDialogProps) {
  const { toast } = useToast();

  if (!plan) return null;

  const handleCopy = async () => {
    if (pixKey) {
        try {
            await navigator.clipboard.writeText(pixKey);
            toast({
                title: "Chave PIX Copiada!",
                description: "A chave foi copiada para sua área de transferência.",
            });
        } catch (err) {
            console.error("Falha ao copiar para a área de transferência:", err);
            toast({
                variant: "destructive",
                title: "Falha ao Copiar",
                description: "Não foi possível copiar a chave. Por favor, copie manualmente.",
            });
        }
    }
  };
  
  if (!pixKey) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pagamento via PIX - Plano {plan.name}</DialogTitle>
                </DialogHeader>
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Configuração de Pagamento Pendente</AlertTitle>
                    <AlertDescription>
                        A chave PIX da oficina ainda não foi configurada. Por favor, vá para a página de configurações para adicionar a chave PIX e poder aceitar pagamentos.
                    </AlertDescription>
                </Alert>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                    <Button asChild><Link href="/settings">Ir para Configurações</Link></Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX - Plano {plan.name}</DialogTitle>
          <DialogDescription>
            Use o QR Code ou a chave abaixo para realizar o pagamento.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg border">
                <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`}
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                />
            </div>
            <p className="text-center">Valor a pagar: <span className="font-bold text-xl">R$ {formatNumber(plan.price)}</span></p>
            
             <div className="w-full space-y-2">
                <p className="text-sm font-medium">Chave PIX (Copia e Cola)</p>
                <div className="flex items-center gap-2">
                    <pre className="text-sm p-2 bg-muted rounded-md w-full overflow-x-auto font-code">{pixKey}</pre>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <p className="text-xs text-center text-muted-foreground px-4">
                Após o pagamento, a ativação do plano pode levar alguns minutos.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Pagamento Realizado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
