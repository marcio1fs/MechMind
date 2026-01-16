import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua conta e as configurações do aplicativo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integração com WhatsApp</CardTitle>
          <CardDescription>
            Conecte sua conta do WhatsApp Business para enviar atualizações automáticas para seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">Provedor de API</Label>
             <p className="text-sm text-muted-foreground">Atualmente, oferecemos suporte à API do Twilio ou da Meta para WhatsApp Cloud.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">Chave da API</Label>
            <Input id="whatsapp-api-key" placeholder="Digite sua chave de API" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="whatsapp-sender-number">Número de Telefone do Remetente</Label>
            <Input id="whatsapp-sender-number" placeholder="ex: +5511999998888" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button>Salvar e Conectar</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
          <CardDescription>
            Gerencie seu plano de assinatura atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">Plano Atual: PRO+</p>
                    <p className="text-sm text-muted-foreground">Seu plano será renovado em 30 de julho de 2024.</p>
                </div>
                <Button variant="outline">Gerenciar Assinatura</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
