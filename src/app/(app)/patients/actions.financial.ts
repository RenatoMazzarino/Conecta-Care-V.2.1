"use server";

import { createClient } from "@/lib/supabase/server";

export async function getFinancialLedger(patientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_ledger_entries")
    .select("*")
    .eq("patient_id", patientId)
    .order("due_date", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erro ao buscar ledger:", error);
    return { entries: [], kpis: { open: 0, overdue: 0, nextDue: null } };
  }

  const entries = data || [];
  const open = entries
    .filter((e) => e.status === "Aberto" || e.status === "Parcial" || e.status === "Vencido")
    .reduce((sum, e) => sum + Number(e.amount_due || 0) - Number(e.amount_paid || 0), 0);
  const overdue = entries
    .filter((e) => e.status === "Vencido")
    .reduce((sum, e) => sum + Number(e.amount_due || 0) - Number(e.amount_paid || 0), 0);
  const nextDue = entries
    .filter((e) => e.status === "Aberto" || e.status === "Parcial")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]?.due_date ?? null;

  return { entries, kpis: { open, overdue, nextDue } };
}

export async function addLedgerEntry(entry: {
  patient_id: string;
  description: string;
  amount_due: number;
  due_date: string;
  entry_type?: string;
  payment_method?: string;
  reference_period?: string | null;
}) {
  const supabase = await createClient();
  const payload = {
    ...entry,
    status: "Aberto",
  };
  const { error } = await supabase.from("financial_ledger_entries").insert(payload);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markLedgerPaid(id: string, amountPaid: number, paidAt: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("financial_ledger_entries")
    .update({ status: "Pago", amount_paid: amountPaid, paid_at: paidAt })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
