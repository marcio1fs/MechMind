import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">CONFIGURAÇÕES</h1>
        <p className="text-muted-foreground">
          GERENCIE SUA CONTA E AS CONFIGURAÇÕES DO APLICATIVO.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>INTEGRAÇÃO COM WHATSAPP</CardTitle>
          <CardDescription>
            Para habilitar o envio automático de notificações (ex: atualizações de status da OS), você deve contratar um provedor de API do WhatsApp Business (como Twilio ou Meta) e inserir suas credenciais abaixo. Esta configuração é de responsabilidade do cliente.
            <span className="mt-2 block text-xs text-muted-foreground/90">
              LEMBRETE: O envio manual de recibos via WhatsApp é gratuito e não precisa desta configuração. Esta seção é apenas para automações (recurso pago).
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>PROVEDOR DE API</Label>
             <p className="text-sm text-muted-foreground">ATUALMENTE, OFERECEMOS SUPORTE À API DO TWILIO OU DA META PARA WHATSAPP CLOUD.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">SUA CHAVE DE API (API Key)</Label>
            <Input id="whatsapp-api-key" placeholder="Cole sua chave de API aqui" className="normal-case placeholder:normal-case" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="whatsapp-sender-number">SEU NÚMERO DE TELEFONE DO REMETENTE</Label>
            <Input id="whatsapp-sender-number" placeholder="ex: +5511999998888" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button>SALVAR E CONECTAR</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ASSINATURA</CardTitle>
          <CardDescription>
            GERENCIE SEU PLANO DE ASSINATURA ATUAL.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">PLANO ATUAL: PRO+</p>
                    <p className="text-sm text-muted-foreground">SEU PLANO SERÁ RENOVADO EM 30 DE JULHO DE 2024.</p>
                </div>
                <Button variant="outline">GERENCIAR ASSINATURA</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
