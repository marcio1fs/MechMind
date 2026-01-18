"use client";

import { useMemo } from "react";
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
  Building,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const allMenuItems = [
  { href: "/dashboard", label: "PAINEL", icon: LayoutDashboard, roles: ['ADMIN', 'OFICINA'] },
  { href: "/diagnostics", label: "DIAGNÓSTICOS", icon: Wrench, roles: ['ADMIN', 'OFICINA'] },
  { href: "/orders", label: "ORDENS DE SERVIÇO", icon: ClipboardList, roles: ['ADMIN', 'OFICINA'] },
  { href: "/vehicle-history", label: "HISTÓRICO DO VEÍCULO", icon: History, roles: ['ADMIN', 'OFICINA'] },
  { href: "/inventory", label: "ESTOQUE", icon: Package, roles: ['ADMIN', 'OFICINA'] },
  { href: "/mechanics", label: "MECÂNICOS", icon: UserCog, roles: ['ADMIN'] },
  { href: "/workshop-settings", label: "DADOS DA OFICINA", icon: Building, roles: ['ADMIN'] },
  { href: "/financial", label: "FINANCEIRO", icon: DollarSign, roles: ['ADMIN'] },
  { href: "/pricing", label: "PLANOS", icon: CreditCard, roles: ['ADMIN'] },
  { href: "/settings", label: "CONFIGURAÇÕES", icon: Settings, roles: ['ADMIN'] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { profile } = useUser();

  const menuItems = useMemo(() => {
    if (!profile?.role) return [];
    // A fallback for users that might not have a role defined yet
    const userRole = profile.role || 'OFICINA';
    return allMenuItems.filter(item => item.roles.includes(userRole));
  }, [profile?.role]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'LOGOUT REALIZADO', description: 'VOCÊ FOI DESCONECTADO COM SUCESSO.' });
      router.push('/');
    } catch (error) {
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
