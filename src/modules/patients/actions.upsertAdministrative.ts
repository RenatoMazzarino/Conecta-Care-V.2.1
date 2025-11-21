'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientAdministrativeSchema, PatientAdministrativeDTO } from "@/data/definitions/administrative";
import { revalidatePath } from "next/cache";

export async function upsertAdministrativeAction(data: PatientAdministrativeDTO) {
  const supabase = await createClient();
  const parsed = PatientAdministrativeSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }
  
  const { patient_id, ...profileData } = parsed.data;

  const { error } = await supabase
    .from('patient_administrative_profiles')
    .upsert({ patient_id, ...profileData }, { onConflict: 'patient_id' });

  if (error) {
    console.error("Erro Admin Upsert:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}
