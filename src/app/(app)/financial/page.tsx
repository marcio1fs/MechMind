"use client"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDownCircle, ArrowUpCircle, DollarSign, PlusCircle, TrendingUp } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { mockFinancialTransactions, type FinancialTransaction } from "@/lib/mock-data"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const chartData = [
  { month: "Jan", "Entradas": 4000, "Saídas": 2400 },
  { month: "Fev", "Entradas": 3000, "Saídas": 1398 },
  { month: "Mar", "Entradas": 5000, "Saídas": 7800 },
  { month: "Abr", "Entradas": 2780, "Saídas": 3908 },
  { month: "Mai", "Entradas": 1890, "Saídas": 4800 },
  { month: "Jun", "Entradas": 2390, "Saídas": 3800 },
];

const statusVariant: { [key in FinancialTransaction["type"]]: "default" | "destructive" } = {
    "IN": "default",
    "OUT": "destructive"
}

const statusText: { [key in FinancialTransaction["type"]]: string } = {
    "IN": "ENTRADA",
    "OUT": "SAÍDA"
}


export default function FinancialPage() {
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
                <Button>
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
            <div className="text-2xl font-bold">R$15.231,89</div>
            <p className="text-xs text-muted-foreground">
              +15.3% EM RELAÇÃO AO MÊS ANTERIOR
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DESPESAS TOTAIS (MÊS)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$8.750,50</div>
            <p className="text-xs text-muted-foreground">
              +8.1% EM RELAÇÃO AO MÊS ANTERIOR
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LUCRO LÍQUIDO (MÊS)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$6.481,39</div>
            <p className="text-xs text-muted-foreground">
              +25.2% EM RELAÇÃO AO MÊS ANTERIOR
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SALDO ATUAL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$32.450,00</div>
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
                    />
                    <Bar dataKey="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockFinancialTransactions.slice(0, 5).map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <div className="font-medium">{transaction.description}</div>
                                    <div className="text-xs text-muted-foreground">{transaction.category}</div>
                                </TableCell>
                                <TableCell>{format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                <TableCell>
                                    <Badge variant={statusVariant[transaction.type]}>{statusText[transaction.type]}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${transaction.type === 'IN' ? 'text-green-500' : 'text-destructive'}`}>
                                    {transaction.type === 'OUT' && '-'}R${transaction.value.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
