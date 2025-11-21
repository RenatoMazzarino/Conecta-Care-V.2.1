'use server'

import { createClient } from "@/lib/supabase/server";
import { CareTeamMemberSchema, EmergencyContactSchema, CareTeamMemberDTO, EmergencyContactDTO } from "@/data/definitions/team";
import { revalidatePath } from "next/cache";

// --- AÇÃO 1: GERENCIAR EQUIPE ---
export async function upsertTeamMemberAction(data: CareTeamMemberDTO) {
  const supabase = await createClient();
  const parsed = CareTeamMemberSchema.safeParse(data);
  
  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  const form = parsed.data;

  const { error } = await supabase
    .from('care_team_members')
    .upsert({
      id: form.id, // Se tiver ID, atualiza. Se não, cria.
      patient_id: form.patient_id,
      professional_id: form.professional_id,
      role: form.role,
      is_primary: form.is_primary,
      active: form.active
    });

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}

export async function deleteTeamMemberAction(id: string, patientId: string) {
  const supabase = await createClient();
  await supabase.from('care_team_members').delete().eq('id', id);
  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}

// --- AÇÃO 2: GERENCIAR CONTATOS ---
export async function upsertContactAction(data: EmergencyContactDTO) {
  const supabase = await createClient();
  const parsed = EmergencyContactSchema.safeParse(data);
  
  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  const form = parsed.data;

  const { error } = await supabase
    .from('patient_emergency_contacts')
    .upsert(form);

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}

export async function deleteContactAction(id: string, patientId: string) {
  const supabase = await createClient();
  await supabase.from('patient_emergency_contacts').delete().eq('id', id);
  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
