'use server'

import { createClient } from "@/lib/supabase/server";
import { BillingBatchSchema, BillingBatchDTO } from "@/data/definitions/billing";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { revalidatePath } from "next/cache";

// --- LEITURA ---

export async function getFinancialStatsAction() {
  const supabase = await createClient();
  
  const { data: pendingShifts } = await supabase
    .from('shifts')
    .select(`
      id, 
      service:patient_services(unit_price)
    `)
    .eq('status', 'completed')
    .is('billing_batch_id', null);

  const pendingValue = pendingShifts?.reduce((acc, shift: any) => acc + (shift.service?.unit_price || 0), 0) || 0;

  const { data: openBatches } = await supabase
    .from('billing_batches')
    .select('total_amount')
    .neq('status', 'paid');
    
  const openInvoicesValue = openBatches?.reduce((acc, b) => acc + b.total_amount, 0) || 0;

  return {
    pending_revenue: pendingValue,
    open_invoices: openInvoicesValue,
    collected_month: 0
  };
}

export async function getBillingBatchesAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('billing_batches')
    .select(`
      *,
      contractor:contractors(name)
    `)
    .order('competence_month', { ascending: false });
  return data || [];
}

// --- AÇÃO DE FECHAMENTO (CORE) ---

export async function generateBillingBatchAction(data: BillingBatchDTO) {
  const parsed = BillingBatchSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos" };

  const supabase = await createClient();
  const start = startOfMonth(parsed.data.competence_date).toISOString();
  const end = endOfMonth(parsed.data.competence_date).toISOString();
  
  const { data: shifts, error: searchError } = await supabase
    .from('shifts')
    .select(`
      id, 
      patient_services(unit_price)
    `)
    .eq('contractor_id', parsed.data.contractor_id)
    .eq('status', 'completed')
    .is('billing_batch_id', null)
    .gte('start_time', start)
    .lte('start_time', end);

  if (searchError) return { success: false, error: "Erro ao buscar plantões: " + searchError.message };
  if (!shifts || shifts.length === 0) return { success: false, error: "Nenhum plantão finalizado encontrado para este período." };

  const totalAmount = shifts.reduce((acc, s: any) => acc + (s.patient_services?.unit_price || 0), 0);

  const { data: batch, error: createError } = await supabase
    .from('billing_batches')
    .insert({
      contractor_id: parsed.data.contractor_id,
      competence_month: parsed.data.competence_date.toISOString(),
      status: 'open',
      total_amount: totalAmount,
      total_shifts: shifts.length,
      notes: `Gerado automaticamente em ${format(new Date(), 'dd/MM/yyyy')}`
    })
    .select()
    .single();

  if (createError) return { success: false, error: "Erro ao criar lote: " + createError.message };

  const shiftIds = shifts.map(s => s.id);
  const { error: updateError } = await supabase
    .from('shifts')
    .update({ billing_batch_id: batch.id })
    .in('id', shiftIds);

  if (updateError) return { success: false, error: "Lote criado, mas erro ao vincular plantões." };

  revalidatePath('/financial');
  return { success: true, batchId: batch.id, count: shifts.length, value: totalAmount };
}
