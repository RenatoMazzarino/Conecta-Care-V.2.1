'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function bulkDeletePatientsAction(patientIds: string[]) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('patients')
    .delete()
    .in('id', patientIds);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/patients');
  return { success: true };
}

export async function bulkInactivatePatientsAction(patientIds: string[]) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('patients')
    .update({ status: 'inactive' })
    .in('id', patientIds);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/patients');
  return { success: true };
}

export async function bulkAssignTeamMemberAction(
  patientIds: string[], 
  professionalId: string, 
  role: string
) {
  const supabase = await createClient();

  const payload = patientIds.map(pid => ({
    patient_id: pid,
    professional_id: professionalId,
    role: role,
    is_primary: true,
    active: true
  }));

  const { error } = await supabase
    .from('care_team_members')
    .upsert(payload, { onConflict: 'patient_id, professional_id' });

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/patients');
  return { success: true };
}
