'use client';

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PatientFinancialProfileSchema,
  PatientFinancialProfileDTO,
  BillingModelEnum,
  PaymentMethodEnum,
  LedgerEntryDTO,
} from "@/data/definitions/financial";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Lock, Calculator, UserCircle, TrendUp, Plus, LinkSimple, Phone, IdentificationCard } from "@phosphor-icons/react";
import { addLedgerEntry, markLedgerPaid } from "@/app/(app)/patients/actions.financial";

const formatCurrency = (v?: number | null) => (v !== undefined && v !== null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00");
const formatDate = (d?: string | Date | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

const billingModelOptions = BillingModelEnum.options;
const paymentMethodOptions = PaymentMethodEnum.options;
const deliveryOptions = ["Email", "Portal", "WhatsApp", "Correio", "Nao_Envia"];

type AddEntryForm = {
  description: string;
  amount: number;
  dueDate: string;
  paymentMethod?: string;
  entryType?: string;
  referencePeriod?: string;
};

function AddEntrySheet({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddEntryForm>({ description: "", amount: 0, dueDate: "", entryType: "Cobranca_Recorrente" });

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
      reference_period: form.referencePeriod || null,
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
          <div className="space-y-1">
            <FormLabel>Competência (MM/AAAA)</FormLabel>
            <Input type="month" value={form.referencePeriod || ""} onChange={(e)=>setForm({...form, referencePeriod: e.target.value})} />
          </div>
          <div className="space-y-1">
            <FormLabel>Tipo de lançamento</FormLabel>
            <Select value={form.entryType} onValueChange={(v)=>setForm({...form, entryType: v})}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cobranca_Recorrente">Cobrança Recorrente</SelectItem>
                <SelectItem value="Insumo_Extra">Insumo Extra</SelectItem>
                <SelectItem value="Ajuste_Credito">Ajuste Crédito</SelectItem>
                <SelectItem value="Ajuste_Debito">Ajuste Débito</SelectItem>
                <SelectItem value="Pagamento_Recebido">Pagamento Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <FormLabel>Forma Pagto</FormLabel>
            <Select value={form.paymentMethod} onValueChange={(v)=>setForm({...form, paymentMethod: v})}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((p)=>(
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
  const ledger = (patient.ledger as unknown as LedgerEntryDTO[]) || [];
  const relatedPersons = (patient.related_persons as any[]) || [];
  const [selectedResponsible, setSelectedResponsible] = useState<any | null>(null);

  useEffect(() => {
    if (financial.responsible_related_person_id && relatedPersons.length > 0) {
      const found = relatedPersons.find((p) => p.id === financial.responsible_related_person_id);
      if (found) setSelectedResponsible(found);
    }
  }, [financial.responsible_related_person_id, relatedPersons]);

  const kpis = useMemo(() => {
    const now = new Date();
    const open = ledger
      .filter((l) => ["Aberto", "Parcial", "Vencido"].includes(l.status))
      .reduce((s, l) => s + (Number(l.amount_due || 0) - Number(l.amount_paid || 0)), 0);
    const overdue = ledger
      .filter((l) => l.status === "Vencido" || (l.status === "Aberto" && l.due_date && new Date(l.due_date) < now))
      .reduce((s, l) => s + (Number(l.amount_due || 0) - Number(l.amount_paid || 0)), 0);
    const next = ledger
      .filter((l) => ["Aberto", "Parcial"].includes(l.status))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]?.due_date;
    return { open, overdue, next };
  }, [ledger]);

  const form = useForm<PatientFinancialProfileDTO>({
    resolver: zodResolver(PatientFinancialProfileSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      responsible_related_person_id: financial.responsible_related_person_id ?? undefined,
      bond_type: financial.bond_type ?? "Particular",
      insurer_name: financial.insurer_name ?? "",
      plan_name: financial.plan_name ?? "",
      insurance_card_number: financial.insurance_card_number ?? "",
      insurance_card_validity: financial.insurance_card_validity ? new Date(financial.insurance_card_validity) : undefined,
      monthly_fee: financial.monthly_fee ?? 0,
      billing_due_day: financial.billing_due_day ?? undefined,
      payment_method: financial.payment_method ?? undefined,
      billing_status: financial.billing_status ?? "active",
      notes: financial.notes ?? "",
      card_holder_name: financial.card_holder_name ?? "",
      billing_model: financial.billing_model ?? undefined,
      billing_base_value: financial.billing_base_value ?? 0,
      billing_periodicity: financial.billing_periodicity ?? undefined,
      copay_percent: financial.copay_percent ?? 0,
      readjustment_index: financial.readjustment_index ?? "",
      readjustment_month: financial.readjustment_month ?? undefined,
      late_fee_percent: financial.late_fee_percent ?? 0,
      daily_interest_percent: financial.daily_interest_percent ?? 0,
      discount_early_payment: financial.discount_early_payment ?? 0,
      discount_days_limit: financial.discount_days_limit ?? undefined,
      receiving_account_info: financial.receiving_account_info ?? "",
      financial_responsible_name: financial.financial_responsible_name ?? "",
      financial_responsible_contact: financial.financial_responsible_contact ?? "",
      payer_relation: financial.payer_relation ?? "",
      billing_email_list: financial.billing_email_list ?? "",
      billing_phone: financial.billing_phone ?? "",
      invoice_delivery_method: financial.invoice_delivery_method ?? undefined,
    },
  });

  async function onSubmit(data: PatientFinancialProfileDTO) {
    const payload = {
      ...data,
      responsible_related_person_id: data.responsible_related_person_id || selectedResponsible?.id,
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
                    <FormItem><FormLabel>Modelo</FormLabel><FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {billingModelOptions.map((o)=>(
                            <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_base_value" render={({ field }) => (
                    <FormItem><FormLabel>Valor Base</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_periodicity" render={({ field }) => (
                    <FormItem><FormLabel>Periodicidade</FormLabel><FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {["Mensal", "Quinzenal", "Semanal", "Por_Evento"].map((o)=>(
                            <SelectItem key={o} value={o}>{o.replace("_"," ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="billing_due_day" render={({ field }) => (
                    <FormItem><FormLabel>Dia Venc.</FormLabel><FormControl><Input type="number" min={1} max={31} value={field.value ?? ""} onChange={(e)=>field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="payment_method" render={({ field }) => (
                    <FormItem><FormLabel>Forma Pagto</FormLabel><FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((o)=>(
                            <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl></FormItem>
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Vincular contato da Rede de Apoio</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" type="button">
                        <LinkSimple className="w-4 h-4 mr-1" /> Vincular
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                      <DialogHeader><DialogTitle>Selecionar contato</DialogTitle></DialogHeader>
                      <div className="max-h-[320px] overflow-y-auto space-y-2">
                        {relatedPersons.length === 0 && <p className="text-sm text-slate-500">Nenhum contato cadastrado na Rede de Apoio.</p>}
                        {relatedPersons.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left rounded border border-slate-200 px-3 py-2 hover:bg-slate-50"
                            onClick={() => {
                              setSelectedResponsible(p);
                              form.setValue("responsible_related_person_id", p.id);
                              form.setValue("financial_responsible_name", p.full_name || "");
                              form.setValue("billing_phone", p.phone_primary || "");
                              toast.success("Contato vinculado");
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-800 flex items-center gap-2">
                                  <IdentificationCard className="w-4 h-4" /> {p.full_name}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                  <Phone className="w-3 h-3" /> {p.phone_primary || "Sem telefone"}
                                </p>
                              </div>
                              {p.contact_type && <Badge variant="secondary" className="text-[10px]">{p.contact_type}</Badge>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedResponsible && (
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedResponsible.full_name}</p>
                      <p className="text-xs text-slate-500">Tel: {selectedResponsible.phone_primary || "N/D"}</p>
                    </div>
                    <Badge variant="outline">Vinculado</Badge>
                  </div>
                )}
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
                    <FormItem><FormLabel>Método envio</FormLabel><FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {deliveryOptions.map((o)=>(
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="receiving_account_info" render={({ field }) => (
                  <FormItem><FormLabel>Conta de recebimento</FormLabel><FormControl><Input {...field} placeholder="Conta Santander Principal" /></FormControl></FormItem>
                )} />
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
                      {ledger.slice(0, 8).map((l) => {
                        const overdue = (l.status === "Vencido") || (l.status === "Aberto" && l.due_date && new Date(l.due_date) < new Date());
                        const statusClass =
                          l.status === "Pago"
                            ? "bg-emerald-100 text-emerald-700"
                            : overdue
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-800";
                        const competence = l.reference_period
                          ? format(new Date(l.reference_period), "MM/yyyy")
                          : l.due_date
                            ? format(new Date(l.due_date), "MM/yyyy")
                            : "—";
                        const statusLabel = l.status || "Aberto";
                        return (
                          <div key={l.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-slate-800">{l.description}</p>
                              <p className="text-[11px] text-slate-500 flex gap-3">
                                <span>Comp.: {competence}</span>
                                <span>Venc: {formatDate(l.due_date)}</span>
                                <span>Valor: {formatCurrency(l.amount_due)}</span>
                              </p>
                              {l.entry_type && <Badge variant="outline" className="text-[10px]">{l.entry_type.replace("_", " ")}</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={statusClass}>
                                {statusLabel}
                              </Badge>
                              {statusLabel !== "Pago" && (
                                <Button size="sm" variant="outline" onClick={() => savePayment(l.id, Number(l.amount_due || 0))}>
                                  Registrar pagamento
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
