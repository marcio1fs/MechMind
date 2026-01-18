
"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownCircle, ArrowUpCircle, DollarSign, PlusCircle, TrendingUp, MoreHorizontal, Search, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, Timestamp, doc, setDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast";
import { FinancialTransactionDialog } from "./components/financial-transaction-dialog";
import { DeleteTransactionDialog } from "./components/delete-transaction-dialog";
import { formatNumber, cn } from "@/lib/utils";
import AccessDenied from "@/components/access-denied";


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


export default function FinancialPage() {
  const firestore = useFirestore();
  const { profile, isUserLoading } = useUser();
  const { toast } = useToast();

  const financialCollection = useMemoFirebase(() => {
    if (!firestore || !profile?.oficinaId) return null;
    return collection(firestore, "oficinas", profile.oficinaId, "financialTransactions");
  }, [firestore, profile?.oficinaId]);

  const { data: transactions, isLoading } = useCollection<FinancialTransaction>(financialCollection);

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"TODOS" | "IN" | "OUT">("TODOS");
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenDialog = (dialog: 'transaction' | 'delete', transaction: FinancialTransaction | null) => {
    setSelectedTransaction(transaction);
    if (dialog === 'transaction') setIsTransactionDialogOpen(true);
    if (dialog === 'delete') setIsDeleteDialogOpen(true);
  };

  const handleSaveTransaction = async (transactionData: any) => {
    if (!firestore || !financialCollection || !profile?.oficinaId) {
        throw new Error("Firestore not initialized or user not associated with an oficina.");
    }
    
    const dataToSave: { [key: string]: any } = { ...transactionData };
    const transactionId = transactionData.id;
    delete dataToSave.id;

    // Clean out undefined fields before sending to Firestore
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
            delete dataToSave[key];
        }
    });

    try {
        if (transactionId) {
            // Editing existing transaction
            const transactionRef = doc(firestore, "oficinas", profile.oficinaId, "financialTransactions", transactionId);
            await setDoc(transactionRef, dataToSave, { merge: true });
            toast({ title: "SUCESSO!", description: "LANÇAMENTO ATUALIZADO COM SUCESSO." });
        } else {
            // Adding new transaction
            const newDocRef = doc(financialCollection);
            await setDoc(newDocRef, {
                ...dataToSave,
                id: newDocRef.id,
                oficinaId: profile.oficinaId,
                reference_type: "MANUAL",
            });
            toast({ title: "SUCESSO!", description: "LANÇAMENTO ADICIONADO COM SUCESSO." });
        }
        setIsTransactionDialogOpen(false);
    } catch (error: any) {
        const errorMessage = error.message || "NÃO FOI POSSÍVEL SALVAR O LANÇAMENTO.";
        toast({ variant: "destructive", title: "ERRO!", description: errorMessage });
        throw new Error(errorMessage);
    }
  };

  const handleDeleteTransaction = async (transaction: FinancialTransaction) => {
    if (!firestore || !profile?.oficinaId) {
        return;
    }
    try {
        if(transaction.reference_type !== "MANUAL"){
            toast({ variant: "destructive", title: "AÇÃO BLOQUEADA", description: "Lançamentos automáticos (gerados por OS ou Estoque) não podem ser excluídos para manter a integridade dos dados." });
        } else {
            const transactionRef = doc(firestore, "oficinas", profile.oficinaId, "financialTransactions", transaction.id);
            await deleteDoc(transactionRef);
            toast({ title: "SUCESSO!", description: "LANÇAMENTO EXCLUÍDO COM SUCESSO." });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "ERRO!", description: "NÃO FOI POSSÍVEL EXCLUIR O LANÇAMENTO." });
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

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions]
      .filter(transaction => {
        const transactionDate = transaction.date?.toDate();
        if (!transactionDate) return false;

        const matchesSearch = searchTerm
            ? transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        
        const matchesType = typeFilter === 'TODOS' || transaction.type === typeFilter;

        const matchesDate = (() => {
            if (!date?.from) return true;
            const from = new Date(date.from.setHours(0, 0, 0, 0));
            const to = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : new Date(from.setHours(23, 59, 59, 999));
            return transactionDate >= from && transactionDate <= to;
        })();

        return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => b.date?.toDate().getTime() - a.date?.toDate().getTime());
  }, [transactions, searchTerm, typeFilter, date]);

  const canSeeCashflow = profile?.activePlan === 'PRO+' || profile?.activePlan === 'PREMIUM';

  if (isUserLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (profile && profile.role !== 'ADMIN') {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="grid grid-cols-1 gap-8">
        <Card>
            <CardHeader>
            <CardTitle>FLUXO DE CAIXA MENSAL</CardTitle>
            <CardDescription>ENTRADAS E SAÍDAS NOS ÚLTIMOS 6 MESES. (RECURSO PRO+)</CardDescription>
            </CardHeader>
            <CardContent>
             {isLoading || !isMounted ? <Skeleton className="h-[300px] w-full"/> : (
                !canSeeCashflow ? (
                    <div className="h-[300px] flex flex-col items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">FAÇA UPGRADE PARA O PRO+</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mt-1">
                                OBTENHA ACESSO A GRÁFICOS DE FLUXO DE CAIXA E RELATÓRIOS AVANÇADOS PARA ENTENDER MELHOR A SAÚDE FINANCEIRA DA SUA OFICINA.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/pricing">VER PLANOS</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
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
                )
             )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>HISTÓRICO DE TRANSAÇÕES</CardTitle>
                <CardDescription>PESQUISE E FILTRE TODOS OS LANÇAMENTOS FINANCEIROS.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="PESQUISAR POR DESCRIÇÃO OU CATEGORIA..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     {isMounted ? (
                        <>
                            <Select value={typeFilter} onValueChange={(value: "TODOS" | "IN" | "OUT") => setTypeFilter(value)}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                    <SelectValue placeholder="FILTRAR POR TIPO" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">TODOS OS TIPOS</SelectItem>
                                    <SelectItem value="IN">ENTRADAS</SelectItem>
                                    <SelectItem value="OUT">SAÍDAS</SelectItem>
                                </SelectContent>
                            </Select>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal sm:w-auto min-w-[240px]",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                                    {format(date.to, "LLL dd, y", { locale: ptBR })}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y", { locale: ptBR })
                                            )
                                        ) : (
                                            <span>ESCOLHA UM PERÍODO</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" onClick={() => {
                                setSearchTerm("");
                                setTypeFilter("TODOS");
                                setDate(undefined);
                            }}>
                                LIMPAR FILTROS
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-10 w-full sm:w-[180px]" />
                            <Skeleton className="h-10 w-full sm:w-[240px]" />
                        </div>
                    )}
                </div>
                <div className="rounded-lg border">
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
                            {isLoading && Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && filteredTransactions.map((transaction) => (
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
                                                <Button variant="ghost" size="icon" disabled={!isMounted}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">AÇÕES</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('transaction', transaction)} disabled={transaction.reference_type !== "MANUAL"}>EDITAR</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('delete', transaction)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={transaction.reference_type !== "MANUAL"}>EXCLUIR</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && filteredTransactions?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada para os filtros selecionados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
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
