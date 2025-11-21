'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientAddressSchema, PatientAddressDTO } from "@/data/definitions/address";
import { revalidatePath } from "next/cache";

export async function upsertAddressAction(data: PatientAddressDTO) {
  const supabase = await createClient();
  const parsed = PatientAddressSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  const form = parsed.data;

  // 1. Salvar Endereço Base
  const { error: addrError } = await supabase
    .from('patient_addresses')
    .upsert({
      patient_id: form.patient_id,
      street: form.street,
      number: form.number,
      complement: form.complement,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      reference_point: form.reference_point,
      zone_type: form.zone_type,
      travel_notes: form.travel_notes
    }, { onConflict: 'patient_id' });

  if (addrError) return { success: false, error: "Erro endereço: " + addrError.message };

  // 2. Salvar Domicílio
  const { error: domError } = await supabase
    .from('patient_domiciles')
    .upsert({
      patient_id: form.patient_id,
      ambulance_access: form.ambulance_access,
      team_parking: form.team_parking,
      night_access_risk: form.night_access_risk,
      entry_procedure: form.entry_procedure,
      bed_type: form.bed_type,
      mattress_type: form.mattress_type,
      voltage: form.voltage,
      has_wifi: form.has_wifi,
      has_smokers: form.has_smokers,
      pets_description: form.pets_description,
      animals_behavior: form.animals_behavior
    }, { onConflict: 'patient_id' });

  if (domError) return { success: false, error: "Erro domicílio: " + domError.message };

  // 3. Salvar Membros (Estratégia simples: Delete All + Insert All para este paciente)
  // Para edição granular, precisaríamos de lógica de diff, mas para V2 isso resolve.
  if (form.household_members) {
     await supabase.from('patient_household_members').delete().eq('patient_id', form.patient_id);
     
     const membersToInsert = form.household_members.map(m => ({
         patient_id: form.patient_id,
         name: m.name,
         role: m.role,
         type: m.type,
         schedule_note: m.schedule_note
     }));
     
     if (membersToInsert.length > 0) {
        await supabase.from('patient_household_members').insert(membersToInsert);
     }
  }

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}