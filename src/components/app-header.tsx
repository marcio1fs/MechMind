"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { usePathname, useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const pathTitles: { [key: string]: string } = {
    "/dashboard": "PAINEL",
    "/diagnostics": "DIAGNÓSTICOS",
    "/orders": "ORDENS DE SERVIÇO",
    "/vehicle-history": "HISTÓRICO DO VEÍCULO",
    "/inventory": "ESTOQUE",
    "/mechanics": "MECÂNICOS",
    "/financial": "FINANCEIRO",
    "/pricing": "PLANOS",
    "/settings": "CONFIGURAÇÕES",
};

function getTitleFromPathname(pathname: string) {
    return pathTitles[pathname] || "PAINEL";
}


export default function AppHeader() {
  const userAvatar = PlaceHolderImages.find((p) => p.id === "avatar-user");
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const title = getTitleFromPathname(pathname);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'LOGOUT REALIZADO', description: 'VOCÊ FOI DESCONECTADO COM SUCESSO.' });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: 'ERRO NO LOGOUT', description: 'NÃO FOI POSSÍVEL SAIR. TENTE NOVAMENTE.' });
    }
  };
  
  const getAvatarFallback = () => {
    if (!user?.displayName) return "U";
    const names = user.displayName.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.displayName.substring(0, 2).toUpperCase();
  }

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
      
      {isMounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user?.photoURL || userAvatar?.imageUrl} alt="User Avatar" />
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.displayName || 'MINHA CONTA'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/settings">CONFIGURAÇÕES</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>SUPORTE</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              SAIR
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Skeleton className="h-10 w-10 rounded-full" />
      )}
    </header>
  );
}
