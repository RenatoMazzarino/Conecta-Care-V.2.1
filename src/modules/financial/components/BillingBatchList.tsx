'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, FilePdf, CheckCircle } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type BillingBatchCard = {
  id: string;
  competence_month: string;
  contractor?: { name?: string } | null;
  status: 'open' | 'invoiced' | 'paid' | string;
  total_amount: number;
};

export function BillingBatchList({ batches }: { batches: BillingBatchCard[] }) {
  
  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {batches.length === 0 && (
        <div className="col-span-full p-8 text-center border-2 border-dashed rounded-lg text-slate-400">
            Nenhum lote de faturamento gerado.
        </div>
      )}

      {batches.map((batch) => (
        <Card key={batch.id} className="shadow-sm border-slate-200 hover:shadow-md transition-all">
            <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Receipt size={20} weight="duotone"/>
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                            {format(new Date(batch.competence_month), 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
                        </CardTitle>
                        <p className="text-xs text-slate-500">{batch.contractor?.name}</p>
                    </div>
                </div>
                <Badge variant={batch.status === 'paid' ? 'default' : 'outline'} 
                       className={batch.status === 'paid' ? 'bg-emerald-600' : 'text-slate-600'}>
                    {batch.status === 'paid' ? 'PAGO' : batch.status === 'invoiced' ? 'FATURADO' : 'ABERTO'}
                </Badge>
            </CardHeader>
            
            <CardContent className="pt-4">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Valor Total</p>
                        <p className="text-2xl font-bold text-[#0F2B45]">{formatCurrency(batch.total_amount)}</p>
                    </div>
                </div>
                
                <div className="flex gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                        <FilePdf className="mr-2"/> Relatório
                    </Button>
                    {batch.status === 'open' && (
                        <Button size="sm" className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="mr-2"/> Gerar NFe
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
