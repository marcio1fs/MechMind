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
  Package,
  UserCog,
  DollarSign,
  Building,
  Search,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/firebase";

const allMenuItems = [
  { href: "/dashboard", label: "PAINEL", icon: LayoutDashboard, roles: ['ADMIN', 'OFICINA'] },
  { href: "/diagnostics", label: "DIAGNÓSTICOS", icon: Wrench, roles: ['ADMIN', 'OFICINA'] },
  { href: "/orders", label: "ORDENS DE SERVIÇO", icon: ClipboardList, roles: ['ADMIN', 'OFICINA'] },
  { href: "/os-query", label: "CONSULTA OS", icon: Search, roles: ['ADMIN', 'OFICINA'] },
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
  const { profile } = useUser();

  const menuItems = useMemo(() => {
    // In test mode, we hardcode the ADMIN role, so all items should be visible
    if (!profile?.role) return [];
    const userRole = profile.role;
    return allMenuItems.filter(item => item.roles.includes(userRole));
  }, [profile?.role]);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline">OSMECH</span>
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
         {/* Logout button removed for testing */}
      </SidebarFooter>
    </>
  );
}
