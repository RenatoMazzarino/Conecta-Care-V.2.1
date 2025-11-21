'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientAddressSchema, PatientAddressDTO } from "@/data/definitions/address";
import { revalidatePath } from "next/cache";
import { logSystemAction } from "../admin/audit.service";

export async function upsertAddressAction(data: PatientAddressDTO) {
  const supabase = await createClient();

  // 1. Validação Zod
  const parsed = PatientAddressSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Erro validação address:", parsed.error);
    return { success: false, error: "Dados inválidos. Verifique os campos obrigatórios." };
  }
  
  const form = parsed.data;
  const patientId = form.patient_id;

  // 2. Upsert Endereço (Tabela 1)
  const { error: addrError } = await supabase
    .from('patient_addresses')
    .upsert({
      patient_id: patientId,
      street: form.street,
      number: form.number,
      complement: form.complement,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      reference_point: form.reference_point,
      zone_type: form.zone_type,
      travel_notes: form.travel_notes,
      // facade_image_url: form.facade_image_url, // Se tiver upload no futuro
    }, { onConflict: 'patient_id' });

  if (addrError) {
    console.error("Erro ao salvar endereço:", addrError);
    return { success: false, error: "Erro ao salvar endereço base." };
  }

  // 3. Upsert Domicílio (Tabela 2 - Infraestrutura)
  const { error: domError } = await supabase
    .from('patient_domiciles')
    .upsert({
      patient_id: patientId,
      ambulance_access: form.ambulance_access,
      team_parking: form.team_parking,
      night_access_risk: form.night_access_risk,
      entry_procedure: form.entry_procedure,
      
      bed_type: form.bed_type,
      mattress_type: form.mattress_type,
      voltage: form.voltage,
      backup_power_source: form.backup_power_source,
      has_wifi: form.has_wifi,
      water_source: form.water_source,
      
      has_smokers: form.has_smokers,
      pets_description: form.pets_description,
      animals_behavior: form.animals_behavior,
      general_observations: form.general_observations,
    }, { onConflict: 'patient_id' });

  if (domError) {
    console.error("Erro ao salvar domicílio:", domError);
    return { success: false, error: "Erro ao salvar dados de domicílio." };
  }

  // 4. Atualizar Membros da Casa (Tabela 3 - Lista)
  // Estratégia: Se o array vier preenchido, substituímos a lista antiga.
  if (form.household_members) {
    // Remove antigos
    await supabase.from('patient_household_members').delete().eq('patient_id', patientId);
    
    // Insere novos (se houver)
    if (form.household_members.length > 0) {
        const membersToInsert = form.household_members.map(m => ({
            patient_id: patientId,
            name: m.name,
            role: m.role,
            type: m.type,
            schedule_note: m.schedule_note
        }));
        
        const { error: memberError } = await supabase
            .from('patient_household_members')
            .insert(membersToInsert);
            
        if (memberError) {
            console.error("Erro ao salvar membros:", memberError);
            return { success: false, error: "Erro ao salvar familiares." };
        }
    }
  }

  // 5. Sucesso
  try {
    await logSystemAction({
      action: "UPDATE",
      entity: "patient_addresses",
      entityId: patientId,
      changes: { payload: { old: null, new: form } },
      reason: "Atualização via Portal Administrativo",
    });
  } catch (logErr) {
    console.error("Erro ao auditar endereço:", logErr);
  }

  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
