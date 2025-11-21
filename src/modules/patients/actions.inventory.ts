'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientInventorySchema, PatientInventoryDTO } from "@/data/definitions/inventory";
import { revalidatePath } from "next/cache";

// Busca itens do catálogo para o dropdown
export async function getMasterInventoryAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, is_trackable, brand')
    .order('name');
    
  if (error) console.error("Erro Master Inventory:", error);
  return data || [];
}

// Salva o item no paciente
export async function upsertPatientItemAction(data: PatientInventoryDTO) {
  const supabase = await createClient();
  const parsed = PatientInventorySchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  const form = parsed.data;

  const { error } = await supabase
    .from('patient_inventory')
    .upsert({
        id: form.id, // Se vier ID, edita. Se não, cria.
        patient_id: form.patient_id,
        item_id: form.item_id,
        current_quantity: form.current_quantity,
        serial_number: form.serial_number,
        location_note: form.location_note,
        installed_at: form.installed_at ? form.installed_at.toISOString() : new Date().toISOString(),
        status: form.status
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}

// Remove item
export async function deletePatientItemAction(id: string, patientId: string) {
  const supabase = await createClient();
  await supabase.from('patient_inventory').delete().eq('id', id);
  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
