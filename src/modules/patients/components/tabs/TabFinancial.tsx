'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientFinancialProfileSchema, PatientFinancialProfileDTO, BondEnum, FinancialRecordDTO } from "@/data/definitions/financial";
import { upsertFinancialAction } from "../../actions.upsertFinancial";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    Wallet, Receipt, SlidersHorizontal, FirstAid, Printer, DownloadSimple, 
    Eye, Warning
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- HELPERS DE FORMATAÇÃO ---
const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (value?: string | Date | null) => {
    if (!value) return '—';
    return format(new Date(value), 'dd/MM/yyyy');
};

const statusTone: Record<string, string> = {
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-300 bg-amber-50 text-amber-700',
    overdue: 'border-rose-200 bg-rose-50 text-rose-700',
    canceled: 'border-slate-200 bg-slate-50 text-slate-500',
};

export function TabFinancial({ patient }: { patient: FullPatientDetails }) {
    // Dados vindos do Banco
    const financial = patient.financial_profile?.[0] || {};
    const ledger: FinancialRecordDTO[] = patient.ledger || [];

    // Ordenar Ledger (Mais recente primeiro)
    const sortedLedger = [...ledger].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

    const form = useForm<PatientFinancialProfileDTO>({
        resolver: zodResolver(PatientFinancialProfileSchema),
        defaultValues: {
            patient_id: patient.id,
            bond_type: financial.bond_type ?? 'Particular',
            insurer_name: financial.insurer_name ?? '',
            plan_name: financial.plan_name ?? '',
            insurance_card_number: financial.insurance_card_number ?? '',
            insurance_card_validity: financial.insurance_card_validity ? new Date(financial.insurance_card_validity) : undefined,
            monthly_fee: financial.monthly_fee ?? 0,
            billing_due_day: financial.billing_due_day ?? undefined,
            payment_method: financial.payment_method ?? '',
            billing_status: financial.billing_status ?? 'active',
            notes: financial.notes ?? '',
            financial_responsible_name: financial.financial_responsible_name ?? '',
            financial_responsible_contact: financial.financial_responsible_contact ?? '',
        }
    });

    // Cálculos Rápidos
    const totalPending = ledger
        .filter(l => l.status === 'pending' || l.status === 'overdue')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    async function onSubmit(data: PatientFinancialProfileDTO) {
        // Tratamento de data para string ISO
        const payload = {
            ...data,
            insurance_card_validity: data.insurance_card_validity instanceof Date 
                ? format(data.insurance_card_validity, 'yyyy-MM-dd') as any 
                : data.insurance_card_validity
        };

        const res = await upsertFinancialAction(payload);
        if (res.success) toast.success("Perfil financeiro atualizado!");
        else toast.error("Erro: " + res.error);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
                
                <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    
                    {/* COLUNA ESQUERDA: PERFIL E CARTÃO */}
                    <div className="space-y-6">
                        
                        {/* 1. CARTÃO VIRTUAL (Visual Rico) */}
                        <div className="relative overflow-hidden rounded-lg border border-white/20 bg-gradient-to-br from-[#0F2B45] to-[#1B4B7A] p-6 text-white shadow-md">
                            <div className="flex items-start justify-between">
                                <span className="rounded border border-white/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    {form.watch('bond_type')}
                                </span>
                                <FirstAid className="h-6 w-6 opacity-80" />
                            </div>
                            <div className="mt-6 space-y-2">
                                <div className="text-[10px] uppercase opacity-80">Operadora</div>
                                <div className="text-2xl font-bold tracking-wide">{form.watch('insurer_name') || 'Sem Convênio'}</div>
                                <div className="text-sm font-medium opacity-90">{form.watch('plan_name') || 'Plano não informado'}</div>
                            </div>
                            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] uppercase opacity-80">Número da Carteira</p>
                                    <p className="font-mono text-lg tracking-widest">{form.watch('insurance_card_number') || '•••• •••• ••••'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase opacity-80">Validade</p>
                                    <p className="font-bold">{formatDate(form.watch('insurance_card_validity'))}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. REGRAS DE FATURAMENTO */}
                        <Card className="shadow-fluent border-none">
                            <CardHeader className="border-b border-slate-200 pb-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                                    <SlidersHorizontal size={20} /> Regras de Faturamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="bond_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vínculo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>{BondEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="monthly_fee" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mensalidade (R$)</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="billing_due_day" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dia Venc.</FormLabel>
                                            <FormControl><Input type="number" min={1} max={31} {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="billing_status" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="active">Ativo</SelectItem>
                                                    <SelectItem value="suspended">Suspenso</SelectItem>
                                                    <SelectItem value="defaulting">Inadimplente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observações Financeiras</FormLabel>
                                        <FormControl><Textarea {...field} placeholder="Notas internas sobre a cobrança..." /></FormControl>
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* 3. RESPONSÁVEL FINANCEIRO */}
                        <Card className="shadow-fluent border-none">
                            <CardHeader className="border-b border-slate-200 pb-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                                    <Wallet size={20} /> Responsável Financeiro
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <FormField control={form.control} name="financial_responsible_name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="financial_responsible_contact" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contato (Tel/Email)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUNA DIREITA: EXTRATO (LEDGER) */}
                    <div className="space-y-6">
                        <Card className="flex h-full flex-col border border-slate-200 shadow-fluent">
                            <CardHeader className="border-b border-slate-200 pb-4 flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                                    <Receipt size={20} /> Extrato Financeiro
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="h-8"><Printer className="mr-2"/> Imprimir</Button>
                                    <Button type="button" variant="outline" size="sm" className="h-8"><DownloadSimple className="mr-2"/> Exportar</Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0 flex-1">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead className="bg-slate-50 uppercase text-slate-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Vencimento</th>
                                                <th className="px-4 py-3 text-left">Descrição</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3 text-right">Valor</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sortedLedger.length === 0 ? (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nenhum lançamento encontrado.</td></tr>
                                            ) : (
                                                sortedLedger.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 text-slate-600 font-medium">{formatDate(item.due_date)}</td>
                                                        <td className="px-4 py-3 text-slate-800">{item.description || 'Fatura Mensal'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant="outline" className={statusTone[item.status] || statusTone.pending}>
                                                                {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                                            </Badge>
                                                        </td>
                                                        <td className={cn("px-4 py-3 text-right font-bold", item.type === 'payable' ? 'text-red-600' : 'text-[#0F2B45]')}>
                                                            {formatCurrency(Number(item.amount))}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#0F2B45]">
                                                                <Eye />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>

                            {/* RODAPÉ COM TOTAIS */}
                            <div className="flex flex-wrap justify-end gap-8 border-t border-slate-200 bg-slate-50 px-6 py-4 text-right text-sm rounded-b-lg">
                                {totalPending > 0 && (
                                    <div className="flex items-center gap-2 mr-auto text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1 rounded border border-rose-100">
                                        <Warning size={16} weight="fill" /> Pendências em aberto
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Total Pendente</p>
                                    <p className={cn("text-lg font-bold", totalPending > 0 ? "text-rose-600" : "text-emerald-600")}>
                                        {formatCurrency(totalPending)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* BOTÃO DE SALVAR FLUTUANTE */}
                <div className="flex justify-end sticky bottom-4 z-10">
                    <Button type="submit" className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white shadow-lg">
                        Salvar Perfil Financeiro
                    </Button>
                </div>
            </form>
        </Form>
    );
}
