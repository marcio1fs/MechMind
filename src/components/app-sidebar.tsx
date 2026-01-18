"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  CreditCard,
  History,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Wrench,
  LogOut,
  Package,
  UserCog,
  DollarSign,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { href: "/dashboard", label: "PAINEL", icon: LayoutDashboard },
  { href: "/diagnostics", label: "DIAGNÓSTICOS", icon: Wrench },
  { href: "/orders", label: "ORDENS DE SERVIÇO", icon: ClipboardList },
  { href: "/vehicle-history", label: "HISTÓRICO DO VEÍCULO", icon: History },
  { href: "/inventory", label: "ESTOQUE", icon: Package },
  { href: "/mechanics", label: "MECÂNICOS", icon: UserCog },
  { href: "/financial", label: "FINANCEIRO", icon: DollarSign },
  { href: "/pricing", label: "PLANOS", icon: CreditCard },
  { href: "/settings", label: "CONFIGURAÇÕES", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    console.log("Tentando fazer logout a partir da barra lateral...");
    try {
      await signOut(auth);
      toast({ title: 'LOGOUT REALIZADO', description: 'VOCÊ FOI DESCONECTADO COM SUCESSO.' });
      router.push('/');
    } catch (error) {
      console.error("Erro no logout da barra lateral:", error);
      toast({ variant: 'destructive', title: 'ERRO NO LOGOUT', description: 'NÃO FOI POSSÍVEL SAIR. TENTE NOVAMENTE.' });
    }
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline">MECHMIND</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="SAIR">
                    <LogOut/>
                    <span>SAIR</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
