"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useAuth } from "@/firebase"
import { useRouter } from "next/navigation"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { CreditCard, LifeBuoy, LogOut, Settings, User } from "lucide-react"
import { signOut } from "firebase/auth"

export function UserNav() {
    const { profile } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const avatarImage = PlaceHolderImages.find(p => p.id === 'avatar-user');
    
    const handleLogout = async () => {
        await signOut(auth);
        // The onAuthStateChanged listener in the FirebaseProvider will handle redirecting to the login page.
    }

    if (!profile) {
        return null;
    }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt="Avatar do usuário" />}
            <AvatarFallback>{profile.firstName.charAt(0)}{profile.lastName.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{`${profile.firstName} ${profile.lastName}`}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/workshop-settings')}>
            <User className="mr-2 h-4 w-4" />
            <span>Oficina</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/pricing')}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Plano</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.open('mailto:suporte@osmech.com')}>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Suporte</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
