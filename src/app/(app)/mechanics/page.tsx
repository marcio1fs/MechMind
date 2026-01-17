"use client";

import { useState } from "react";
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
import { MoreHorizontal, PlusCircle, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockMechanics, type Mechanic } from "@/lib/mock-data";
import { MechanicDialog } from "./components/mechanic-dialog";
import { DeleteMechanicDialog } from "./components/delete-mechanic-dialog";

export type { Mechanic };

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState(mockMechanics);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [isMechanicDialogOpen, setIsMechanicDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (dialog: 'mechanic' | 'delete', mechanic: Mechanic | null) => {
    setSelectedMechanic(mechanic);
    if (dialog === 'mechanic') setIsMechanicDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
  };
  
  const handleSaveMechanic = (mechanic: Mechanic) => {
    const existingMechanic = mechanics.find(m => m.id === mechanic.id);
    if (existingMechanic) {
      setMechanics(mechanics.map(m => m.id === mechanic.id ? mechanic : m));
      toast({ title: "SUCESSO!", description: "MECÂNICO ATUALIZADO COM SUCESSO." });
    } else {
      setMechanics([...mechanics, mechanic]);
      toast({ title: "SUCESSO!", description: "MECÂNICO ADICIONADO COM SUCESSO." });
    }
    setSelectedMechanic(null);
  };

  const handleDeleteMechanic = (mechanic: Mechanic) => {
    setMechanics(mechanics.filter(m => m.id !== mechanic.id));
    toast({ title: "SUCESSO!", description: "MECÂNICO EXCLUÍDO COM SUCESSO." });
    setSelectedMechanic(null);
    setIsDeleteDialogOpen(false);
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
                    <TableHead className="w-[100px] text-right">AÇÕES</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mechanics.map((mechanic) => (
                        <TableRow key={mechanic.id}>
                        <TableCell className="font-medium">
                            <div>{mechanic.name}</div>
                        </TableCell>
                        <TableCell>{mechanic.specialty}</TableCell>
                        <TableCell className="text-right">
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
                        </TableCell>
                        </TableRow>
                    ))}
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
