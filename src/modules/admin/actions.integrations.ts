'use server'

import { createClient } from "@/lib/supabase/server";
import { IntegrationConfigSchema, IntegrationConfigDTO } from "@/data/definitions/integration";
import { revalidatePath } from "next/cache";

export async function getIntegrationsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .order('provider');
    
  if (error) console.error("Erro ao buscar integrações:", error);
  return data || [];
}

export async function upsertIntegrationAction(data: IntegrationConfigDTO) {
  const supabase = await createClient();
  const parsed = IntegrationConfigSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  
  const { error } = await supabase
    .from('integration_configs')
    .upsert(parsed.data);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/integrations');
  return { success: true };
}

export async function toggleIntegrationAction(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from('integration_configs').update({ is_active: isActive }).eq('id', id);
  revalidatePath('/admin/integrations');
  return { success: true };
}
