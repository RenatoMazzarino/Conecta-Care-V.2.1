'use server'

import { createClient } from "@/lib/supabase/server";
import { ProfessionalSchema, ProfessionalDTO } from "@/data/definitions/professional";
import { revalidatePath } from "next/cache";

export async function getProfessionalsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .order('full_name');
    
  if (error) {
    console.error("Erro ao buscar profissionais:", error?.message || error);
    return [];
  }
  return data || [];
}

export async function upsertProfessionalAction(data: ProfessionalDTO) {
  const supabase = await createClient();
  const parsed = ProfessionalSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  const form = parsed.data;

  const payload = {
    ...(form.user_id ? { user_id: form.user_id } : {}),
    full_name: form.full_name,
    social_name: form.social_name,
    cpf: form.cpf,
    email: form.email,
    role: form.role,
    professional_license: form.professional_license,
    bond_type: form.bond_type,
    contact_phone: form.phone, // Mapeando phone -> contact_phone
    is_active: form.is_active,
  };

  const { error } = await supabase
    .from('professional_profiles')
    .upsert(payload as any); // Cast simples pois o user_id pode ser opcional

  if (error) return { success: false, error: error.message };

  revalidatePath('/team');
  return { success: true };
}
