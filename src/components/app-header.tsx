"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";
import { UserNav } from "@/components/user-nav";

const pathTitles: { [key: string]: string } = {
    "/dashboard": "PAINEL",
    "/diagnostics": "DIAGNÓSTICOS",
    "/orders": "ORDENS DE SERVIÇO",
    "/os-query": "CONSULTA DE OS",
    "/vehicle-history": "HISTÓRICO DO VEÍCULO",
    "/inventory": "ESTOQUE",
    "/mechanics": "MECÂNICOS",
    "/financial": "FINANCEIRO",
    "/workshop-settings": "DADOS DA OFICINA",
    "/pricing": "PLANOS",
    "/settings": "CONFIGURAÇÕES",
};

function getTitleFromPathname(pathname: string) {
    return pathTitles[pathname] || "PAINEL";
}


export default function AppHeader() {
  const pathname = usePathname();
  const title = getTitleFromPathname(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="hidden text-lg font-semibold md:block">{title}</h1>
         <div className="flex items-center gap-2 md:hidden">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold font-headline">MECHMIND</span>
        </div>
      </div>
      
      <UserNav />
    </header>
  );
}
