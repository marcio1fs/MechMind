"use client"

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";
import { Car, DollarSign, Users, Wrench } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, Timestamp } from "firebase/firestore";
import type { Order } from "../orders/page";
import type { FinancialTransaction } from "../financial/page";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatNumber } from "@/lib/utils";

const OFICINA_ID = "default_oficina";

export default function DashboardPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const ordersCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "ordensDeServico");
  }, [firestore, profile]);
  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersCollection);
  
  const financialCollection = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "oficinas", OFICINA_ID, "financialTransactions");
  }, [firestore, profile]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<FinancialTransaction>(financialCollection);

  const {
    monthlyRevenue,
    activeCustomers,
    servicesThisMonth,
    vehiclesInWorkshop,
  } = useMemo(() => {
    if (!orders || !transactions) return {
        monthlyRevenue: 0,
        activeCustomers: 0,
        servicesThisMonth: 0,
        vehiclesInWorkshop: 0,
    };
    
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const monthlyRevenue = transactions.reduce((acc, t) => {
        const transactionDate = t.date.toDate();
         if (t.type === 'IN' && transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth) {
            return acc + t.value;
        }
        return acc;
    }, 0);
    
    const servicesThisMonth = orders.filter(o => {
        const orderDate = o.startDate instanceof Timestamp ? o.startDate.toDate() : o.startDate;
        return orderDate >= startOfCurrentMonth && orderDate <= endOfCurrentMonth;
    }).length;

    const activeCustomers = new Set(orders
        .filter(o => {
            const orderDate = o.startDate instanceof Timestamp ? o.startDate.toDate() : o.startDate;
            return orderDate >= startOfCurrentMonth && orderDate <= endOfCurrentMonth;
        })
        .map(o => o.customer)
    ).size;

    const vehiclesInWorkshop = orders.filter(o => o.status === 'EM ANDAMENTO').length;

    return { monthlyRevenue, activeCustomers, servicesThisMonth, vehiclesInWorkshop };
  }, [orders, transactions]);
  
  const chartData = useMemo(() => {
    if (!orders) return [];

    const sixMonthsAgo = subMonths(new Date(), 5);
    const monthsInterval = eachMonthOfInterval({
        start: sixMonthsAgo,
        end: new Date()
    });

    return monthsInterval.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthName = format(monthStart, "MMM", { locale: ptBR });

        const servicesCount = orders.filter(o => {
            const orderDate = o.startDate instanceof Timestamp ? o.startDate.toDate() : o.startDate;
            return orderDate >= monthStart && orderDate <= monthEnd;
        }).length;

        return {
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            services: servicesCount
        };
    });
  }, [orders]);
  
  const isLoading = isLoadingOrders || isLoadingTransactions;

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Painel</h1>
            <p className="text-muted-foreground">Bem-vindo de volta! Aqui está um resumo da sua oficina.</p>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">R$ {formatNumber(monthlyRevenue)}</div>}
            <p className="text-xs text-muted-foreground">
              Receita total para o mês atual.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes no Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{activeCustomers}</div>}
            <p className="text-xs text-muted-foreground">
              Clientes únicos no mês atual.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços no Mês</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{servicesThisMonth}</div>}
            <p className="text-xs text-muted-foreground">
              Ordens de serviço criadas no mês.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos na Oficina</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{vehiclesInWorkshop}</div>}
            <p className="text-xs text-muted-foreground">
              Ordens com status "EM ANDAMENTO".
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral dos Serviços</CardTitle>
          <CardDescription>Um resumo das ordens de serviço nos últimos 6 meses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
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
                        tickFormatter={(value) => `${value}`}
                        allowDecimals={false}
                    />
                    <Tooltip 
                        cursor={{fill: 'hsl(var(--muted))'}}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                        }}
                    />
                    <Bar dataKey="services" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Serviços"/>
                </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
