'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { PatientAddressSchema } from "@/data/definitions/address";
import { PatientFinancialProfileSchema } from "@/data/definitions/financial";
import { revalidatePath } from "next/cache";

const PersonalStepSchema = z.object({
  patient_id: z.string().uuid().optional(),
  full_name: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().min(11, "CPF obrigatório").max(14).optional(),
  date_of_birth: z.coerce.date(),
  gender: z.string().min(1, "Gênero obrigatório"),
});

export async function upsertPersonalWizardAction(form: z.infer<typeof PersonalStepSchema>) {
  const supabase = await createClient();
  const parsed = PersonalStepSchema.safeParse(form);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }
  const data = parsed.data;

  if (data.patient_id) {
    const { error } = await supabase
      .from("patients")
      .update({
        full_name: data.full_name,
        cpf: data.cpf,
        date_of_birth: data.date_of_birth.toISOString(),
        gender: data.gender,
      })
      .eq("id", data.patient_id);

    if (error) {
      console.error("Erro ao atualizar paciente:", error);
      return { success: false, error: error.message };
    }
    revalidatePath(`/patients/${data.patient_id}`);
    return { success: true, patient_id: data.patient_id };
  }

  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      full_name: data.full_name,
      cpf: data.cpf,
      date_of_birth: data.date_of_birth.toISOString(),
      gender: data.gender,
      status: "onboarding",
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Erro ao criar paciente:", error);
    return { success: false, error: error?.message || "Erro ao criar paciente." };
  }

  revalidatePath(`/patients/${created.id}`);
  return { success: true, patient_id: created.id };
}

export async function upsertAddressWizardAction(raw: unknown) {
  const parsed = PatientAddressSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Endereço inválido." };
  const supabase = await createClient();
  const form = parsed.data;

  const { error } = await supabase
    .from("patient_addresses")
    .upsert(
      {
        patient_id: form.patient_id,
        zip_code: form.zip_code,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        reference_point: form.reference_point,
        zone_type: form.zone_type,
        travel_notes: form.travel_notes,
      },
      { onConflict: "patient_id" }
    );

  if (error) {
    console.error("Erro ao salvar endereço:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}

export async function upsertFinancialWizardAction(raw: unknown) {
  const parsed = PatientFinancialProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Dados financeiros inválidos." };
  const supabase = await createClient();
  const form = parsed.data;

  const { error } = await supabase
    .from("patient_financial_profiles")
    .upsert(
      {
        patient_id: form.patient_id,
        bond_type: form.bond_type,
        insurer_name: form.insurer_name,
        plan_name: form.plan_name,
        insurance_card_number: form.insurance_card_number,
        insurance_card_validity: form.insurance_card_validity,
        card_holder_name: form.card_holder_name,
        billing_status: form.billing_status,
      },
      { onConflict: "patient_id" }
    );

  if (error) {
    console.error("Erro ao salvar financeiro:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}

export async function finalizeWizardAction(patientId: string, hasFinancial: boolean) {
  const supabase = await createClient();
  const nextStatus = hasFinancial ? "active" : "pending_financial";
  const { error } = await supabase.from("patients").update({ status: nextStatus }).eq("id", patientId);
  if (error) {
    console.error("Erro ao finalizar admissão:", error);
    return { success: false, error: error.message };
  }
  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
