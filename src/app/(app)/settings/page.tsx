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
            CONECTE SUA CONTA DO WHATSAPP BUSINESS PARA ENVIAR ATUALIZAÇÕES AUTOMÁTICAS PARA SEUS CLIENTES.
            <span className="mt-1 block text-xs text-muted-foreground/90">
              NOTA: ESTA INTEGRAÇÃO (PAGA) É PARA AUTOMAÇÕES. O ENVIO MANUAL DE RECIBOS É GRATUITO E NÃO REQUER ESTA CONFIGURAÇÃO.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">PROVEDOR DE API</Label>
             <p className="text-sm text-muted-foreground">ATUALMENTE, OFERECEMOS SUPORTE À API DO TWILIO OU DA META PARA WHATSAPP CLOUD.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">CHAVE DA API</Label>
            <Input id="whatsapp-api-key" placeholder="Digite sua chave de API" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="whatsapp-sender-number">NÚMERO DE TELEFONE DO REMETENTE</Label>
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
