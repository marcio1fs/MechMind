
"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownCircle, ArrowUpCircle, DollarSign, PlusCircle, TrendingUp, MoreHorizontal } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, Timestamp, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast";
import { FinancialTransactionDialog } from "./components/financial-transaction-dialog";
import { DeleteTransactionDialog } from "./components/delete-transaction-dialog";
import { formatNumber } from "@/lib/utils";


export type FinancialTransaction = {
  id: string;
  oficinaId: string;
  description: string;
  category: string;
  type: "IN" | "OUT";
  value: number;
  date: Timestamp;
  reference_id?: string;
  reference_type?: "OS" | "STOCK" | "MANUAL";
}

const statusVariant: { [key in FinancialTransaction["type"]]: "default" | "destructive" } = {
    "IN": "default",
    "OUT": "destructive"
}
const statusText: { [key in FinancialTransaction["type"]]: string } = {
    "IN": "ENTRADA",
    "OUT": "SAÍDA"
}

const OFICINA_ID = "default_oficina";


export default function FinancialPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const { toast } = useToast();

  const financialCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "financialTransactions");
  }, [firestore, profile]);

  const { data: transactions, isLoading } = useCollection<FinancialTransaction>(financialCollection);

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenDialog = (dialog: 'transaction' | 'delete', transaction: FinancialTransaction | null) => {
    setSelectedTransaction(transaction);
    if (dialog === 'transaction') setIsTransactionDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
  };

  const handleSaveTransaction = async (transactionData: any) => {
    if (!firestore || !financialCollection || !profile) {
        throw new Error("Firestore not initialized");
    }
    
    const { id, ...data } = transactionData;

    try {
        if (id) {
            // Editing existing transaction
            const transactionRef = doc(firestore, "oficinas", OFICINA_ID, "financialTransactions", id);
            await setDoc(transactionRef, data, { merge: true });
            toast({ title: "SUCESSO!", description: "LANÇAMENTO ATUALIZADO COM SUCESSO." });
        } else {
            // Adding new transaction
            const newDocRef = doc(financialCollection);
            await setDoc(newDocRef, {
                ...data,
                id: newDocRef.id,
                oficinaId: OFICINA_ID,
                reference_type: "MANUAL",
            });
            toast({ title: "SUCESSO!", description: "LANÇAMENTO ADICIONADO COM SUCESSO." });
        }
        setIsTransactionDialogOpen(false);
    } catch (error) {
        console.error("Error saving transaction: ", error);
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL SALVAR O LANÇAMENTO." });
        throw error;
    }
  };

  const handleDeleteTransaction = async (transaction: FinancialTransaction) => {
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }
    try {
        if(transaction.reference_type !== "MANUAL"){
            toast({ variant: "destructive", title: "ERRO!", description: "LANÇAMENTOS AUTOMÁTICOS (OS, ESTOQUE) NÃO PODEM SER EXCLUÍDOS." });
        } else {
            const transactionRef = doc(firestore, "oficinas", OFICINA_ID, "financialTransactions", transaction.id);
            await deleteDoc(transactionRef);
            toast({ title: "SUCESSO!", description: "LANÇAMENTO EXCLUÍDO COM SUCESSO." });
        }
    } catch (error) {
        console.error("Error deleting transaction: ", error);
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL EXCLUIR O LANÇAMENTO." });
        throw error;
    } finally {
        setIsDeleteDialogOpen(false);
    }
  };

  const { monthlyRevenue, monthlyExpenses, monthlyNetProfit, totalBalance } = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    let monthlyRevenue = 0;
    let monthlyExpenses = 0;
    let totalBalance = 0;

    if (transactions) {
        transactions.forEach(t => {
            const transactionDate = t.date?.toDate();
            if(!transactionDate) return;

            if (t.type === 'IN') {
                totalBalance += t.value;
                if (transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth) {
                    monthlyRevenue += t.value;
                }
            } else {
                totalBalance -= t.value;
                if (transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth) {
                    monthlyExpenses += t.value;
                }
            }
        });
    }

    const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

    return { monthlyRevenue, monthlyExpenses, monthlyNetProfit, totalBalance };

  }, [transactions]);

  const chartData = useMemo(() => {
    if (!transactions) return [];
    
    const sixMonthsAgo = subMonths(new Date(), 5);
    const monthsInterval = eachMonthOfInterval({
        start: sixMonthsAgo,
        end: new Date()
    });

    return monthsInterval.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthName = format(monthStart, "MMM", { locale: ptBR });

        const monthlyData = transactions.reduce((acc, t) => {
            const transactionDate = t.date?.toDate();
            if (transactionDate && transactionDate >= monthStart && transactionDate <= monthEnd) {
                if (t.type === 'IN') {
                    acc.Entradas += t.value;
                } else {
                    acc.Saídas += t.value;
                }
            }
            return acc;
        }, { Entradas: 0, Saídas: 0 });

        return {
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            ...monthlyData
        };
    });
  }, [transactions]);

  const recentTransactions = useMemo(() => {
      if(!transactions) return [];
      return [...transactions].sort((a,b) => b.date?.toDate().getTime() - a.date?.toDate().getTime()).slice(0,5);
  }, [transactions]);


  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">VISÃO GERAL FINANCEIRA</h1>
                <p className="text-muted-foreground">
                ACOMPANHE AS FINANÇAS DA SUA OFICINA.
                </p>
            </div>
            <div>
                <Button onClick={() => handleOpenDialog('transaction', null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    NOVO LANÇAMENTO
                </Button>
            </div>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RECEITA TOTAL (MÊS)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading || !isMounted ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">R$ {formatNumber(monthlyRevenue)}</div>}
            <p className="text-xs text-muted-foreground">
              RECEITA DESTE MÊS
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DESPESAS TOTAIS (MÊS)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             {isLoading || !isMounted ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">R$ {formatNumber(monthlyExpenses)}</div>}
            <p className="text-xs text-muted-foreground">
              DESPESAS DESTE MÊS
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LUCRO LÍQUIDO (MÊS)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
             {isLoading || !isMounted ? <Skeleton className="h-8 w-3/4"/> : <div className={`text-2xl font-bold ${monthlyNetProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>R$ {formatNumber(monthlyNetProfit)}</div>}
            <p className="text-xs text-muted-foreground">
              LUCRO LÍQUIDO DESTE MÊS
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SALDO ATUAL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading || !isMounted ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">R$ {formatNumber(totalBalance)}</div>}
            <p className="text-xs text-muted-foreground">
              SALDO TOTAL EM CAIXA E BANCOS
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
            <CardTitle>FLUXO DE CAIXA MENSAL</CardTitle>
            <CardDescription>ENTRADAS E SAÍDAS NOS ÚLTIMOS 6 MESES.</CardDescription>
            </CardHeader>
            <CardContent>
             {isLoading || !isMounted ? <Skeleton className="h-[300px] w-full"/> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$${value/1000}k`}
                        />
                        <Tooltip 
                            cursor={{fill: 'hsl(var(--muted))'}}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                            }}
                            formatter={(value: number) => `R$ ${formatNumber(value)}`}
                        />
                        <Legend wrapperStyle={{fontSize: "0.75rem"}}/>
                        <Bar dataKey="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>ÚLTIMAS TRANSAÇÕES</CardTitle>
                <CardDescription>AS 5 TRANSAÇÕES MAIS RECENTES.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>DESCRIÇÃO</TableHead>
                            <TableHead>DATA</TableHead>
                            <TableHead>TIPO</TableHead>
                            <TableHead className="text-right">VALOR</TableHead>
                            <TableHead className="w-[80px] text-right">AÇÕES</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(isLoading || !isMounted) && Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {isMounted && !isLoading && recentTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <div className="font-medium">{transaction.description}</div>
                                    <div className="text-xs text-muted-foreground">{transaction.category}</div>
                                </TableCell>
                                <TableCell>{transaction.date ? format(transaction.date.toDate(), "dd/MM/yyyy", { locale: ptBR }) : ''}</TableCell>
                                <TableCell>
                                    <Badge variant={statusVariant[transaction.type]}>{statusText[transaction.type]}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${transaction.type === 'IN' ? 'text-green-500' : 'text-destructive'}`}>
                                    {transaction.type === 'OUT' && '-'}R$ {formatNumber(transaction.value)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">AÇÕES</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenDialog('transaction', transaction)} disabled={transaction.reference_type !== "MANUAL"}>EDITAR</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDialog('delete', transaction)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={transaction.reference_type !== "MANUAL"}>EXCLUIR</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {isMounted && !isLoading && transactions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <FinancialTransactionDialog
        isOpen={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        transaction={selectedTransaction}
        onSave={handleSaveTransaction}
      />

      <DeleteTransactionDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        transaction={selectedTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  )
}
