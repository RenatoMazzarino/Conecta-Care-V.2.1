'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientClinicalSchema, PatientClinicalDTO } from "@/data/definitions/clinical";
import { revalidatePath } from "next/cache";

export async function upsertClinicalAction(data: PatientClinicalDTO) {
  const supabase = await createClient();
  const parsed = PatientClinicalSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  
  const { patient_id, medications, ...profileData } = parsed.data;

  const { error: profileError } = await supabase
    .from('patient_clinical_profiles')
    .upsert({ patient_id, ...profileData }, { onConflict: 'patient_id' });

  if (profileError) return { success: false, error: profileError.message };

  if (medications) {
    await supabase.from('patient_medications').delete().eq('patient_id', patient_id);
    
    if (medications.length > 0) {
      const medsToInsert = medications.map(m => ({
        patient_id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        is_critical: m.is_critical,
        status: m.status
      }));
      
      const { error: medsError } = await supabase.from('patient_medications').insert(medsToInsert);
      if (medsError) console.error("Erro ao salvar medicamentos:", medsError);
    }
  }

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}
