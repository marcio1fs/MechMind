import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Integration</CardTitle>
          <CardDescription>
            Connect your WhatsApp Business account to send automated updates to your customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">API Provider</Label>
             <p className="text-sm text-muted-foreground">Currently supporting Twilio or Meta WhatsApp Cloud API.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-api-key">API Key</Label>
            <Input id="whatsapp-api-key" placeholder="Enter your API key" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="whatsapp-sender-number">Sender Phone Number</Label>
            <Input id="whatsapp-sender-number" placeholder="e.g., +14155552671" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button>Save and Connect</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your current subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">Current Plan: PRO+</p>
                    <p className="text-sm text-muted-foreground">Your plan renews on July 30, 2024.</p>
                </div>
                <Button variant="outline">Manage Subscription</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
