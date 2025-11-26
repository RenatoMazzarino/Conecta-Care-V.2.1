'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { isValidCPF } from "@/lib/validation";

const QuickCreateSchema = z.object({
  full_name: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().min(11, "CPF obrigatório"),
  date_of_birth: z.coerce.date(),
  gender: z.string().min(1, "Sexo obrigatório"),
  bond_type: z.string().optional(),
  mobile_phone: z.string().optional(),
  email: z.string().optional(),
});

type StatusFlag = "draft" | "onboarding";

export async function quickCreatePatientAction(input: z.infer<typeof QuickCreateSchema>, status: StatusFlag) {
  const supabase = await createClient();

  const parsed = QuickCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const payload = parsed.data;
  const cleanCpf = payload.cpf.replace(/\D/g, "");
  if (!isValidCPF(cleanCpf)) {
    return { success: false, error: "CPF inválido." };
  }

  // Duplicidade
  const { data: dup } = await supabase.from("patients").select("id").eq("cpf", cleanCpf).maybeSingle();
  if (dup?.id) {
    return { success: false, duplicate: true, patientId: dup.id, error: "CPF já cadastrado." };
  }

  const onboardingStep = status === "onboarding" ? 1 : 1;

  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      full_name: payload.full_name,
      cpf: cleanCpf,
      date_of_birth: payload.date_of_birth.toISOString(),
      gender: payload.gender,
      mobile_phone: payload.mobile_phone,
      email: payload.email,
      record_status: status,
      onboarding_step: onboardingStep,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Erro Quick Create:", error);
    return { success: false, error: error?.message || "Erro ao criar paciente." };
  }

  if (payload.bond_type) {
    await supabase
      .from("patient_financial_profiles")
      .upsert({ patient_id: created.id, bond_type: payload.bond_type }, { onConflict: "patient_id" });
  }

  // Registro de auditoria simples
  await supabase.from("system_audit_logs").insert({
    entity_table: "patients",
    entity_id: created.id,
    parent_patient_id: created.id,
    action: "CREATE",
    reason: "Quick Create",
    changes: { origin: "quick_create" },
  });

  return { success: true, patientId: created.id };
}
