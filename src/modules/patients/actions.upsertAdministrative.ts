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

  const form = parsed.data;

  const adminData = {
    admission_date: form.admission_date,
    discharge_prediction_date: form.discharge_prediction_date,
    discharge_date: form.discharge_date,
    admission_type: form.admission_type,
    service_package_name: form.service_package_name,
    contract_number: form.contract_number,
    contract_status: form.contract_status,
    technical_supervisor_name: form.technical_supervisor_name,
    administrative_contact_name: form.administrative_contact_name,
  };

  const scheduleData = {
    scheme_type: form.scheme_type,
    day_start_time: form.day_start_time + ":00",
    night_start_time: form.night_start_time + ":00",
    professionals_per_shift: form.professionals_per_shift,
    required_role: form.required_role,
    auto_generate: form.auto_generate,
  };

  const { error: adminError } = await supabase
    .from('patient_administrative_profiles')
    .upsert({ patient_id: form.patient_id, ...adminData }, { onConflict: 'patient_id' });

  if (adminError) {
    console.error("Erro Admin Upsert:", adminError);
    return { success: false, error: adminError.message };
  }

  const { error: schedError } = await supabase
    .from('patient_schedule_settings')
    .upsert({ patient_id: form.patient_id, ...scheduleData }, { onConflict: 'patient_id' });

  if (schedError) {
    console.error("Erro Escala Upsert:", schedError);
    return { success: false, error: schedError.message };
  }

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}
