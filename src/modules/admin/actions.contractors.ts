'use server'

import { createClient } from "@/lib/supabase/server";
import { ContractorSchema, ContractorDTO } from "@/data/definitions/contractor";
import { revalidatePath } from "next/cache";

export async function getContractorsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .order('name');
    
  if (error) console.error("Erro buscar contractors:", error);
  return data || [];
}

export async function upsertContractorAction(data: ContractorDTO) {
  const supabase = await createClient();
  const parsed = ContractorSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  
  const { error } = await supabase
    .from('contractors')
    .upsert(parsed.data);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/contractors');
  return { success: true };
}

export async function deleteContractorAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('contractors').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    
    revalidatePath('/admin/contractors');
    return { success: true };
}