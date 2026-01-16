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
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const menuItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/diagnostics", label: "Diagnósticos", icon: Wrench },
  { href: "/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/vehicle-history", label: "Histórico do Veículo", icon: History },
  { href: "/inventory", label: "Estoque", icon: Package },
  { href: "/pricing", label: "Preços", icon: CreditCard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline">MechMind</span>
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
                <SidebarMenuButton asChild tooltip="Sair">
                    <Link href="/login">
                        <LogOut/>
                        <span>Sair</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
