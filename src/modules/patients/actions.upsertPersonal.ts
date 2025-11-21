'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientPersonalSchema, PatientPersonalDTO } from "@/data/definitions/personal";
import { revalidatePath } from "next/cache";

export async function upsertPersonalAction(data: PatientPersonalDTO) {
  const supabase = await createClient();

  const parsed = PatientPersonalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { patient_id, ...updates } = parsed.data;

  const { error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patient_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}