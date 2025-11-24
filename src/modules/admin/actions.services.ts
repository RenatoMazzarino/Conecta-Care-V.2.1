'use server'

import { createClient } from "@/lib/supabase/server";
import { ServiceSchema, ServiceDTO } from "@/data/definitions/service";
import { revalidatePath } from "next/cache";

export async function getServicesAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');
    
  if (error) console.error("Erro buscar serviços:", error);
  return data || [];
}

export async function upsertServiceAction(data: ServiceDTO) {
  const supabase = await createClient();
  const parsed = ServiceSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  
  const { error } = await supabase
    .from('services')
    .upsert(parsed.data);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/services');
  return { success: true };
}

export async function deleteServiceAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    
    revalidatePath('/admin/services');
    return { success: true };
}
