'use server';

import { createClient } from "@/lib/supabase/server";

export async function finalizeAdmissionAction(patientId: string) {
  const supabase = await createClient();

  // Valida presença de endereço e financeiro básicos
  const { data: addr } = await supabase.from("patient_addresses").select("id").eq("patient_id", patientId).maybeSingle();
  const { data: fin } = await supabase.from("patient_financial_profiles").select("id").eq("patient_id", patientId).maybeSingle();

  if (!addr) {
    return { success: false, error: "Preencha o endereço antes de concluir." };
  }

  const { error } = await supabase
    .from("patients")
    .update({ record_status: "active", onboarding_step: 4 })
    .eq("id", patientId);

  if (error) {
    console.error("Erro ao finalizar admissão:", error);
    return { success: false, error: error.message };
  }

  return { success: true, hasFinancial: !!fin };
}
