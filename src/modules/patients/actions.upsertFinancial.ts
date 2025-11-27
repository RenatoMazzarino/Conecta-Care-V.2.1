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

  const mapped = {
    patient_id,
    responsible_related_person_id: payload.responsible_related_person_id,
    bond_type: payload.bond_type,
    insurer_name: payload.insurer_name,
    plan_name: payload.plan_name,
    insurance_card_number: payload.insurance_card_number,
    insurance_card_validity: payload.insurance_card_validity,
    card_holder_name: payload.card_holder_name,
    billing_model: payload.billing_model,
    billing_base_value: payload.billing_base_value,
    billing_periodicity: payload.billing_periodicity,
    monthly_fee: payload.monthly_fee,
    billing_due_day: payload.billing_due_day,
    payment_method: payload.payment_method,
    payment_terms: payload.payment_terms,
    copay_percent: payload.copay_percent,
    readjustment_index: payload.readjustment_index,
    readjustment_month: payload.readjustment_month,
    late_fee_percent: payload.late_fee_percent,
    daily_interest_percent: payload.daily_interest_percent,
    discount_early_payment: payload.discount_early_payment,
    discount_days_limit: payload.discount_days_limit,
    receiving_account_info: payload.receiving_account_info,
    financial_responsible_name: payload.financial_responsible_name,
    financial_responsible_contact: payload.financial_responsible_contact,
    payer_relation: payload.payer_relation,
    billing_email_list: payload.billing_email_list,
    billing_phone: payload.billing_phone,
    invoice_delivery_method: payload.invoice_delivery_method,
    billing_status: payload.billing_status,
    notes: payload.notes,
  };

  const { error } = await supabase
    .from("patient_financial_profiles")
    .upsert(mapped, { onConflict: "patient_id" });

  if (error) {
    console.error("Erro ao atualizar perfil financeiro:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}
