'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientFinancialProfileSchema, PatientFinancialProfileDTO } from "@/data/definitions/financial";
import { revalidatePath } from "next/cache";

export async function upsertFinancialAction(data: PatientFinancialProfileDTO) {
  const supabase = await createClient();

  const parsed = PatientFinancialProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { patient_id, ...payload } = parsed.data;

  const { error } = await supabase
    .from("patient_financial_profiles")
    .upsert({ patient_id, ...payload }, { onConflict: "patient_id" });

  if (error) {
    console.error("Erro ao atualizar perfil financeiro:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}
