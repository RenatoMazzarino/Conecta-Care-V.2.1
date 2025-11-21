"use server";

import { CreatePatientDTO, CreatePatientSchema } from "@/data/definitions/patient";
import { PatientPersonalDTO, PatientPersonalSchema } from "@/data/definitions/personal";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertAddressAction as upsertAddressActionImpl } from "./actions.upsertAddress";

export async function createPatientAction(data: CreatePatientDTO) {
  const supabase = await createClient();

  const parsed = CreatePatientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }
  const form = parsed.data;

  const { data: patient, error: errPatient } = await supabase
    .from("patients")
    .insert({
      full_name: form.full_name,
      cpf: form.cpf,
      date_of_birth: form.date_of_birth.toISOString(),
      gender: form.gender,
      record_status: "active",
    })
    .select("id")
    .single();

  if (errPatient || !patient) {
    console.error("Erro ao criar paciente:", errPatient);
    return { success: false, error: "Erro ao salvar paciente." };
  }

  await Promise.all([
    supabase.from("patient_financial_profiles").insert({
      patient_id: patient.id,
      bond_type: form.bond_type,
      monthly_fee: form.monthly_fee,
      billing_due_day: form.billing_due_day,
    }),
    supabase.from("patient_addresses").insert({
      patient_id: patient.id,
      city: form.city,
      state: form.state,
      street: "Não informado",
      number: "S/N",
      neighborhood: "Não informado",
      zip_code: "00000-000",
    }),
  ]);

  redirect("/patients");
}

export async function upsertPersonalAction(data: PatientPersonalDTO) {
  const supabase = await createClient();

  const parsed = PatientPersonalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { patient_id, ...updates } = parsed.data;

  const { error } = await supabase.from("patients").update(updates).eq("id", patient_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}

export async function upsertAddressAction(data: Parameters<typeof upsertAddressActionImpl>[0]) {
  return upsertAddressActionImpl(data);
}
