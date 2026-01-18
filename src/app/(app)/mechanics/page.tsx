
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MechanicDialog } from "./components/mechanic-dialog";
import { DeleteMechanicDialog } from "./components/delete-mechanic-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";

// This type should align with the User entity in backend.json
export type Mechanic = {
  id: string;
  oficinaId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  role: string;
};

// A hardcoded oficinaId for demonstration purposes.
// In a real multi-tenant app, this would come from the user's profile.
const OFICINA_ID = "default_oficina";

export default function MechanicsPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const mechanicsCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "users");
  }, [firestore, profile]);

  const { data: mechanics, isLoading } = useCollection<Mechanic>(mechanicsCollection);

  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [isMechanicDialogOpen, setIsMechanicDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenDialog = (dialog: 'mechanic' | 'delete', mechanic: Mechanic | null) => {
    setSelectedMechanic(mechanic);
    if (dialog === 'mechanic') setIsMechanicDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
  };
  
  const handleSaveMechanic = async (mechanicData: Omit<Mechanic, 'id' | 'oficinaId' | 'role'> & { id?: string }) => {
    if (!firestore || !mechanicsCollection) return;

    const { id, ...data } = mechanicData;
    
    try {
      if (id) {
        // Editing existing mechanic
        const mechanicRef = doc(firestore, "oficinas", OFICINA_ID, "users", id);
        await setDoc(mechanicRef, data, { merge: true });
        toast({ title: "SUCESSO!", description: "MECÂNICO ATUALIZADO COM SUCESSO." });
      } else {
        // Adding new mechanic
        // Note: This flow doesn't create a Firebase Auth user, only a Firestore document.
        // A complete solution would involve a Cloud Function or a more complex client-side flow.
        const newDocRef = doc(mechanicsCollection);
        await setDoc(newDocRef, {
            ...data,
            id: newDocRef.id,
            oficinaId: OFICINA_ID,
            role: "OFICINA", // Default role
        });
        toast({ title: "SUCESSO!", description: "MECÂNICO ADICIONADO COM SUCESSO." });
      }
    } catch (error) {
        
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL SALVAR O MECÂNICO." });
        throw error;
    }
  };

  const handleDeleteMechanic = async (mechanic: Mechanic) => {
    if (!firestore) return;
    try {
        const mechanicRef = doc(firestore, "oficinas", OFICINA_ID, "users", mechanic.id);
        await deleteDoc(mechanicRef);
        toast({ title: "SUCESSO!", description: "MECÂNICO EXCLUÍDO COM SUCESSO." });
        setSelectedMechanic(null);
        setIsDeleteDialogOpen(false);
    } catch (error) {
        
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL EXCLUIR O MECÂNICO." });
    }
  };

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">MECÂNICOS</h1>
                <p className="text-muted-foreground">
                GERENCIE A EQUIPE DA SUA OFICINA.
                </p>
            </div>
            <div>
                <Button onClick={() => handleOpenDialog('mechanic', null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    ADICIONAR MECÂNICO
                </Button>
            </div>
        </div>

      <Card>
        <CardHeader>
            <CardTitle>EQUIPE</CardTitle>
            <CardDescription>
                A LISTA DE TODOS OS MECÂNICOS CADASTRADOS.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>NOME</TableHead>
                    <TableHead>ESPECIALIDADE</TableHead>
                    <TableHead>E-MAIL</TableHead>
                    <TableHead className="w-[100px] text-right">AÇÕES</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                        Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    )}
                    {!isLoading && mechanics?.map((mechanic) => (
                        <TableRow key={mechanic.id}>
                        <TableCell className="font-medium">
                            <div>{`${mechanic.firstName} ${mechanic.lastName}`}</div>
                        </TableCell>
                        <TableCell>{mechanic.specialty}</TableCell>
                        <TableCell>{mechanic.email}</TableCell>
                        <TableCell className="text-right">
                            {isMounted ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">AÇÕES</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenDialog('mechanic', mechanic)}>EDITAR</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDialog('delete', mechanic)} className="text-destructive focus:text-destructive focus:bg-destructive/10">EXCLUIR</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex justify-end">
                                    <Skeleton className="h-10 w-10" />
                                </div>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                     {!isLoading && mechanics?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">Nenhum mecânico encontrado.</TableCell>
                        </TableRow>
                     )}
                </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <MechanicDialog
        isOpen={isMechanicDialogOpen}
        onOpenChange={setIsMechanicDialogOpen}
        mechanic={selectedMechanic}
        onSave={handleSaveMechanic}
      />

      <DeleteMechanicDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        mechanic={selectedMechanic}
        onDelete={handleDeleteMechanic}
      />
    </div>
  );
}
