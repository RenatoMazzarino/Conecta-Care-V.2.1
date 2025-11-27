'use client';

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientFinancialProfileSchema, PatientFinancialProfileDTO, BondEnum } from "@/data/definitions/financial";
import { upsertFinancialAction } from "../../actions.upsertFinancial";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { format } from "date-fns";
import { Lock, Wallet, Calculator, UserCircle, TrendUp, Plus } from "@phosphor-icons/react";
import { addLedgerEntry, markLedgerPaid } from "@/app/(app)/patients/actions.financial";

const formatCurrency = (v?: number | null) => (v !== undefined && v !== null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00");
const formatDate = (d?: string | Date | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

type AddEntryForm = {
  description: string;
  amount: number;
  dueDate: string;
  paymentMethod?: string;
  entryType?: string;
};

function AddEntrySheet({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddEntryForm>({ description: "", amount: 0, dueDate: "" });

  const handleSave = async () => {
    if (!form.description || !form.dueDate) return toast.error("Preencha descrição e vencimento.");
    setSaving(true);
    const res = await addLedgerEntry({
      patient_id: patientId,
      description: form.description,
      amount_due: form.amount,
      due_date: form.dueDate,
      entry_type: form.entryType,
      payment_method: form.paymentMethod,
    });
    setSaving(false);
    if (!res.success) return toast.error(res.error || "Erro ao salvar lançamento");
    toast.success("Lançamento criado");
    setOpen(false);
    onDone();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Novo Lançamento Manual</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md space-y-4">
        <SheetHeader><SheetTitle>Lançamento Manual</SheetTitle></SheetHeader>
        <div className="space-y-3">
          <div className="space-y-1"><FormLabel>Descrição</FormLabel><Input value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} /></div>
          <div className="space-y-1"><FormLabel>Valor (R$)</FormLabel><Input type="number" value={form.amount} onChange={(e)=>setForm({...form, amount: Number(e.target.value)})} /></div>
          <div className="space-y-1"><FormLabel>Vencimento</FormLabel><Input type="date" value={form.dueDate} onChange={(e)=>setForm({...form, dueDate: e.target.value})} /></div>
          <div className="space-y-1"><FormLabel>Forma Pagto</FormLabel><Input value={form.paymentMethod || ""} onChange={(e)=>setForm({...form, paymentMethod: e.target.value})} /></div>
        </div>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TabFinancial({ patient }: { patient: FullPatientDetails }) {
  const adminInfo = (patient as any).admin_info?.[0] || {};
  const financial = (patient as any).financial?.[0] || {};
  const ledger: any[] = patient.ledger || [];

  const kpis = useMemo(() => {
    const open = ledger.filter((l) => ["pending", "partial", "overdue"].includes(l.status)).reduce((s, l) => s + (Number(l.amount_due || 0) - Number(l.amount_paid || 0)), 0);
    const overdue = ledger.filter((l) => l.status === "overdue").reduce((s, l) => s + (Number(l.amount_due || 0) - Number(l.amount_paid || 0)), 0);
    const next = ledger
      .filter((l) => ["pending", "partial"].includes(l.status))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]?.due_date;
    return { open, overdue, next };
  }, [ledger]);

  const form = useForm<PatientFinancialProfileDTO>({
    resolver: zodResolver(PatientFinancialProfileSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      bond_type: financial.bond_type ?? "Particular",
      insurer_name: financial.insurer_name ?? "",
      plan_name: financial.plan_name ?? "",
      insurance_card_number: financial.insurance_card_number ?? "",
      insurance_card_validity: financial.insurance_card_validity ? new Date(financial.insurance_card_validity) : undefined,
      monthly_fee: financial.monthly_fee ?? 0,
      billing_due_day: financial.billing_due_day ?? undefined,
      payment_method: financial.payment_method ?? "",
      billing_status: financial.billing_status ?? "active",
      notes: financial.notes ?? "",
      card_holder_name: financial.card_holder_name ?? "",
      billing_model: financial.billing_model ?? "",
      billing_base_value: financial.billing_base_value ?? 0,
      billing_periodicity: financial.billing_periodicity ?? "",
      copay_percent: financial.copay_percent ?? 0,
      readjustment_index: financial.readjustment_index ?? "",
      readjustment_month: financial.readjustment_month ?? undefined,
      late_fee_percent: financial.late_fee_percent ?? 0,
      daily_interest_percent: financial.daily_interest_percent ?? 0,
      discount_early_payment: financial.discount_early_payment ?? 0,
      discount_days_limit: financial.discount_days_limit ?? undefined,
      financial_responsible_name: financial.financial_responsible_name ?? "",
      financial_responsible_contact: financial.financial_responsible_contact ?? "",
      payer_relation: financial.payer_relation ?? "",
      billing_email_list: financial.billing_email_list ?? "",
      billing_phone: financial.billing_phone ?? "",
      invoice_delivery_method: financial.invoice_delivery_method ?? "",
    },
  });

  async function onSubmit(data: PatientFinancialProfileDTO) {
    const payload = {
      ...data,
      insurance_card_validity:
        data.insurance_card_validity instanceof Date ? format(data.insurance_card_validity, "yyyy-MM-dd") as any : data.insurance_card_validity,
    };
    const res = await upsertFinancialAction(payload);
    if (res.success) toast.success("Perfil financeiro atualizado!");
    else toast.error(res.error || "Erro ao salvar.");
  }

  const savePayment = async (id: string, amount: number) => {
    const res = await markLedgerPaid(id, amount, new Date().toISOString());
    if (!res.success) return toast.error(res.error || "Erro ao registrar pagamento");
    toast.success("Pagamento registrado");
    window.location.reload();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-16">
        {/* Espelho admin (read-only) */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Lock className="w-4 h-4" /> Informações do contrato (somente leitura - editar na aba Administrativo)
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm w-full">
            <div>
              <p className="text-[10px] uppercase text-slate-500">Origem</p>
              <p className="font-semibold text-slate-800">{adminInfo.demand_origin || "N/D"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500">Vigência</p>
              <p className="font-semibold text-slate-800">
                {adminInfo.start_date ? formatDate(adminInfo.start_date) : "—"} até {adminInfo.contract_end_date ? formatDate(adminInfo.contract_end_date) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500">Status</p>
              <Badge className="bg-slate-200 text-slate-700">{adminInfo.status || "N/D"}</Badge>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500">ID Externo</p>
              <p className="font-semibold text-slate-800">{adminInfo.external_contract_id || "—"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><Calculator className="w-5 h-5" /> Regras de Faturamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="billing_model" render={({ field }) => (
                    <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} placeholder="Mensalidade, Diária" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_base_value" render={({ field }) => (
                    <FormItem><FormLabel>Valor Base</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_periodicity" render={({ field }) => (
                    <FormItem><FormLabel>Periodicidade</FormLabel><FormControl><Input {...field} placeholder="Mensal, Quinzenal" /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="billing_due_day" render={({ field }) => (
                    <FormItem><FormLabel>Dia Venc.</FormLabel><FormControl><Input type="number" min={1} max={31} value={field.value ?? ""} onChange={(e)=>field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="payment_method" render={({ field }) => (
                    <FormItem><FormLabel>Forma Pagto</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="payment_terms" render={({ field }) => (
                    <FormItem><FormLabel>Condições</FormLabel><FormControl><Input {...field} placeholder="Texto livre" /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <FormField control={form.control} name="late_fee_percent" render={({ field }) => (
                    <FormItem><FormLabel>Multa %</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="daily_interest_percent" render={({ field }) => (
                    <FormItem><FormLabel>Juros/dia %</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="readjustment_index" render={({ field }) => (
                    <FormItem><FormLabel>Índice reajuste</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="readjustment_month" render={({ field }) => (
                    <FormItem><FormLabel>Mês base</FormLabel><FormControl><Input type="number" min={1} max={12} value={field.value ?? ""} onChange={(e)=>field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><UserCircle className="w-5 h-5" /> Responsável Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="financial_responsible_name" render={({ field }) => (
                    <FormItem><FormLabel>Nome/Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="payer_relation" render={({ field }) => (
                    <FormItem><FormLabel>CPF/CNPJ ou Relação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="billing_email_list" render={({ field }) => (
                  <FormItem><FormLabel>Emails de cobrança (;)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="billing_phone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone cobrança</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="invoice_delivery_method" render={({ field }) => (
                    <FormItem><FormLabel>Método envio</FormLabel><FormControl><Input {...field} placeholder="Portal / Email / Correio" /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="flex items-center justify-between border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><TrendUp className="w-5 h-5" /> Conta Corrente</CardTitle>
                <AddEntrySheet patientId={patient.id} onDone={() => window.location.reload()} />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-3 rounded border border-slate-200 bg-slate-50">
                    <p className="text-[10px] text-slate-500 uppercase">Em aberto</p>
                    <p className="font-bold text-slate-900">{formatCurrency(kpis.open)}</p>
                  </div>
                  <div className="p-3 rounded border border-rose-200 bg-rose-50">
                    <p className="text-[10px] text-rose-700 uppercase">Vencido</p>
                    <p className="font-bold text-rose-700">{formatCurrency(kpis.overdue)}</p>
                  </div>
                  <div className="p-3 rounded border border-slate-200 bg-slate-50">
                    <p className="text-[10px] text-slate-500 uppercase">Próx. venc.</p>
                    <p className="font-bold text-slate-900">{kpis.next ? formatDate(kpis.next) : "—"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">Lançamentos</p>
                  </div>
                  {ledger.length === 0 ? (
                    <div className="text-xs text-slate-500">Nenhum lançamento.</div>
                  ) : (
                    <div className="space-y-2">
                      {ledger.slice(0, 8).map((l) => (
                        <div key={l.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-800">{l.description}</p>
                            <p className="text-[11px] text-slate-500 flex gap-3">
                              <span>Venc: {formatDate(l.due_date)}</span>
                              <span>Valor: {formatCurrency(l.amount_due)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={l.status === "paid" ? "bg-emerald-100 text-emerald-700" : l.status === "overdue" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}>
                              {l.status}
                            </Badge>
                            {l.status !== "paid" && (
                              <Button size="sm" variant="outline" onClick={() => savePayment(l.id, Number(l.amount_due || 0))}>
                                Registrar pagamento
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Button type="submit" className="w-full bg-[#0F2B45] text-white">Salvar alterações</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
