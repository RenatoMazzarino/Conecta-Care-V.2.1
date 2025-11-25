import { getDashboardKPIsAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarningOctagon, ChartPieSlice, CurrencyDollar, UsersThree, CalendarCheck } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const kpis = await getDashboardKPIsAction();
  const fMoney = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight">Visão Executiva</h1>
                <p className="text-slate-500 mt-1">Indicadores de performance do mês atual.</p>
            </div>
            <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border shadow-sm">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
        </div>

        {/* 1. BIG NUMBERS */}
        <div className="grid gap-4 md:grid-cols-3">
            {/* Faturamento Projetado */}
            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Faturamento Projetado</p>
                            <h3 className="text-3xl font-bold text-emerald-700 mt-1">{fMoney(kpis.finance.projected_revenue)}</h3>
                            <p className="text-xs text-emerald-600/80 mt-1 font-medium">Baseado nos {kpis.coverage.total} plantões</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><CurrencyDollar size={24} weight="duotone"/></div>
                    </div>
                </CardContent>
            </Card>

            {/* Taxa de Cobertura */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Taxa de Cobertura</p>
                            <h3 className="text-3xl font-bold text-[#0F2B45] mt-1">{kpis.coverage.rate}%</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                {kpis.coverage.completed} realizados de {kpis.coverage.total}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><ChartPieSlice size={24} weight="duotone"/></div>
                    </div>
                </CardContent>
            </Card>

            {/* Furos e Vagas */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Atenção Operacional</p>
                            <div className="flex gap-4 mt-2">
                                <div>
                                    <span className="text-2xl font-bold text-rose-600 block">{kpis.coverage.missed}</span>
                                    <span className="text-[10px] text-rose-400 font-bold uppercase">Faltas</span>
                                </div>
                                <div className="w-px bg-slate-200 h-10"></div>
                                <div>
                                    <span className="text-2xl font-bold text-amber-600 block">{kpis.coverage.open}</span>
                                    <span className="text-[10px] text-amber-400 font-bold uppercase">Vagas</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-600"><WarningOctagon size={24} weight="duotone"/></div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* 2. ALERTAS */}
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2 border-b border-slate-50">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        <UsersThree className="text-rose-500" weight="bold"/> Maior Índice de Absenteísmo
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                    {kpis.alerts.top_absent_count > 0 ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-lg">
                                    {(kpis.alerts.top_absent_name || '').substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-[#0F2B45]">{kpis.alerts.top_absent_name || '-'}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Profissional</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-bold text-rose-600">{kpis.alerts.top_absent_count}</span>
                                <p className="text-[10px] font-bold text-rose-400 uppercase">Ocorrências</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-2">
                            <p className="text-sm">Nenhuma falta registrada este mês. Parabéns!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-[#0F2B45] to-[#1B4B7A] text-white">
                <CardHeader className="pb-2 border-b border-white/10">
                    <CardTitle className="text-sm font-bold uppercase text-white/70 flex items-center gap-2">
                        <CalendarCheck className="text-emerald-400" weight="bold"/> Status do Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold">Operação Ativa</p>
                            <p className="text-sm text-emerald-300 mt-1 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Todos os serviços online
                            </p>
                        </div>
                        <div className="text-right opacity-80">
                            <p className="text-xs uppercase tracking-widest">Última atualização</p>
                            <p className="font-mono text-sm">{new Date().toLocaleTimeString('pt-BR')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
