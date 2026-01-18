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
import type { Order } from "../page";
import { Wrench, Printer, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
}

export function ReceiptDialog({ isOpen, onOpenChange, order }: ReceiptDialogProps) {
  
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const hasDiscount = order.subtotal && order.discount && order.discount > 0;

  const handleWhatsApp = () => {
      const servicesText = order.services && order.services.length > 0 
        ? order.services.map(s => `- ${s.quantity}x ${s.description}: R$${(s.quantity * s.unitPrice).toFixed(2)}`).join('\n')
        : "Nenhum serviço realizado.";

      const partsText = order.parts && order.parts.length > 0
        ? order.parts.map(p => `- ${p.quantity}x ${p.name}: R$${(p.quantity * p.sale_price).toFixed(2)}`).join('\n')
        : "Nenhuma peça utilizada.";
      
      const documentText = order.customerDocumentType === 'CNPJ' && order.customerCnpj 
        ? `*CNPJ:* ${order.customerCnpj}\n`
        : (order.customerCpf ? `*CPF:* ${order.customerCpf}\n` : '');

      let message = `*Recibo de Pagamento - MechMind*\n\n`;
      message += `Olá ${order.customer},\n`;
      message += `Agradecemos pela preferência! Segue o resumo da sua Ordem de Serviço *#${order.displayId}*.\n\n`;
      message += `*Cliente:* ${order.customer}\n`;
      if (documentText) {
        message += documentText;
      }
      message += `*Veículo:* ${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.plate})\n`;
      message += `*Data:* ${format(new Date(), "dd/MM/yyyy")}\n\n`;
      message += `*Serviços Realizados:*\n${servicesText}\n\n`;
      message += `*Peças Utilizadas:*\n${partsText}\n\n`;
      
      if (hasDiscount && order.subtotal && order.discount) {
          message += `*Subtotal:* R$${order.subtotal.toFixed(2)}\n`;
          message += `*Desconto:* -R$${order.discount.toFixed(2)}\n`;
      }

      message += `*Valor Total Pago:* R$${order.total.toFixed(2)}\n`;
      if(order.paymentMethod) {
        message += `*Forma de Pagamento:* ${order.paymentMethod}\n\n`;
      }
      message += `Atenciosamente,\nEquipe MechMind`;
      
      const phone = order.customerPhone?.replace(/\D/g, '');
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone || ''}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="no-print">
          <DialogTitle>RECIBO DE PAGAMENTO</DialogTitle>
          <DialogDescription>
            RECIBO PARA A ORDEM DE SERVIÇO <span className="font-bold">#{order.displayId}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div id="receipt-print-content" className="text-sm p-4 border rounded-md bg-background">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Wrench className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold font-headline">MECHMIND</span>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-lg">RECIBO</h2>
                    <p className="text-muted-foreground">#{order.displayId}</p>
                </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 className="font-semibold mb-1">CLIENTE</h3>
                    <p>{order.customer}</p>
                    {order.customerDocumentType === 'CNPJ' && order.customerCnpj
                        ? <p className="text-muted-foreground text-xs">CNPJ: {order.customerCnpj}</p>
                        : order.customerCpf && <p className="text-muted-foreground text-xs">CPF: {order.customerCpf}</p>
                    }
                    {order.customerPhone && <p className="text-muted-foreground text-xs">TELEFONE: {order.customerPhone}</p>}
                </div>
                <div>
                    <h3 className="font-semibold mb-1">VEÍCULO</h3>
                    <p>{order.vehicle.make} {order.vehicle.model} - {order.vehicle.year}</p>
                    <p className="font-mono">{order.vehicle.plate}</p>
                </div>
            </div>
            
            <Separator className="my-2" />

            <div>
                <h3 className="font-semibold my-2 uppercase">Serviços Realizados</h3>
                {order.services.length > 0 ? order.services.map((service, index) => (
                    <div key={`service-${index}`} className="flex justify-between items-center py-1">
                        <span>{service.quantity}x {service.description}</span>
                        <span>R${(service.quantity * service.unitPrice).toFixed(2)}</span>
                    </div>
                )) : <p className="text-muted-foreground">Nenhum serviço realizado.</p>}
            </div>

            <Separator className="my-2" />
            
             <div>
                <h3 className="font-semibold my-2 uppercase">Peças Utilizadas</h3>
                {order.parts.length > 0 ? order.parts.map((part, index) => (
                    <div key={`part-${index}`} className="flex justify-between items-center py-1">
                        <span>{part.quantity}x {part.name}</span>
                        <span>R${(part.quantity * part.sale_price).toFixed(2)}</span>
                    </div>
                )) : <p className="text-muted-foreground">Nenhuma peça utilizada.</p>}
            </div>
            
            <Separator className="my-4" />

            {hasDiscount && order.subtotal && order.discount ? (
                <>
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span>Subtotal</span>
                        <span>R${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span>Desconto</span>
                        <span className="text-destructive">-R${order.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg mt-2 pt-2 border-t">
                        <span>TOTAL PAGO</span>
                        <span>R${order.total.toFixed(2)}</span>
                    </div>
                </>
            ) : (
                <div className="flex justify-between items-center font-bold text-lg">
                    <span>TOTAL PAGO</span>
                    <span>R${order.total.toFixed(2)}</span>
                </div>
            )}

            <div className="text-right text-muted-foreground mt-2">
                <p>Pago em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")} {order.paymentMethod ? `via ${order.paymentMethod}` : ''}</p>
            </div>
        </div>

        <DialogFooter className="mt-4 sm:justify-between gap-2 no-print">
            <Button variant="outline" onClick={handleWhatsApp} className="w-full sm:w-auto"><MessageSquare className="mr-2" />ENVIAR VIA WHATSAPP</Button>
            <Button onClick={handlePrint} className="w-full sm:w-auto"><Printer className="mr-2" />IMPRIMIR RECIBO</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    