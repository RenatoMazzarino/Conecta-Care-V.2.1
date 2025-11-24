import { getFinancialStatsAction, getBillingBatchesAction } from "@/modules/financial/actions";
import { BillingGenerator } from "@/modules/financial/components/BillingGenerator";
import { BillingBatchList } from "@/modules/financial/components/BillingBatchList";
import { Card, CardContent } from "@/components/ui/card";
import { Bank, TrendUp, WarningCircle } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function FinancialPage() {
  const stats = await getFinancialStatsAction();
  const batches = await getBillingBatchesAction();

  const fMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
                    <Bank weight="duotone" className="opacity-80"/>
                    Gestão Financeira
                </h1>
                <p className="text-slate-500 mt-1">Faturamento de convênios e repasse médico.</p>
            </div>
            <BillingGenerator />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600"><TrendUp size={24} weight="fill"/></div>
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Faturamento Pendente</p>
                        <h3 className="text-2xl font-bold text-[#0F2B45]">{fMoney(stats.pending_revenue)}</h3>
                        <p className="text-[10px] text-slate-400">Plantões realizados sem lote</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-full text-amber-600"><WarningCircle size={24} weight="fill"/></div>
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Faturas em Aberto</p>
                        <h3 className="text-2xl font-bold text-amber-700">{fMoney(stats.open_invoices)}</h3>
                        <p className="text-[10px] text-slate-400">Aguardando pagamento</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F2B45]">Lotes de Faturamento (Ciclos)</h2>
            <BillingBatchList batches={batches} />
        </div>

      </div>
    </div>
  );
}
