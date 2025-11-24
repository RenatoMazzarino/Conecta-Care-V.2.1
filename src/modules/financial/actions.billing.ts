'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Busca plantões que já aconteceram mas ainda não foram faturados
export async function getPendingShiftsAction() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      id, start_time, end_time, status,
      patient:patients(full_name),
      contractor:contractor_id(id, name),
      service:service_id(name, unit_price)
    `)
    .eq('status', 'completed')
    .is('billing_batch_id', null)
    .order('start_time');

  if (error) {
    console.error("Erro ao buscar plantões pendentes:", error);
    return [];
  }
  
  return data;
}

// Cria um lote e "amarra" os plantões nele
export async function createBillingBatchAction(contractorId: string, monthDate: Date, shiftIds: string[]) {
  const supabase = await createClient();
  
  const { data: batch, error: batchError } = await supabase
    .from('billing_batches')
    .insert({
      contractor_id: contractorId,
      competence_month: monthDate.toISOString(),
      status: 'open'
    })
    .select()
    .single();

  if (batchError) return { success: false, error: batchError.message };

  const { error: updateError } = await supabase
    .from('shifts')
    .update({ billing_batch_id: batch.id })
    .in('id', shiftIds);

  if (updateError) return { success: false, error: "Erro ao vincular plantões." };

  revalidatePath('/financial');
  return { success: true, batchId: batch.id };
}
