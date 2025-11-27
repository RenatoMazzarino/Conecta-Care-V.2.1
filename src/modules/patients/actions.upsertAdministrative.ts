'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientAdminInfoZ, PatientAdminInfoForm } from "@/schemas/patient.adminInfo";
import { revalidatePath } from "next/cache";

export async function upsertAdministrativeAction(data: PatientAdminInfoForm) {
  const supabase = await createClient();
  const parsed = PatientAdminInfoZ.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const form = parsed.data;
  const payload = {
    patient_id: form.patient_id,
    tenant_id: form.tenant_id,
    status: form.status,
    status_reason: form.status_reason,
    status_changed_at: form.status_changed_at,
    admission_type: form.admissionType,
    demand_origin: form.demandOrigin,
    primary_payer_type: form.primaryPayerType,
    start_date: form.startDate,
    end_date: form.endDate,
    contract_start_date: form.contractStartDate,
    contract_end_date: form.contractEndDate,
    renewal_type: form.renewalType,
    contract_id: form.contractId,
    external_contract_id: form.externalContractId,
    authorization_number: form.authorizationNumber,
    judicial_case_number: form.judicialCaseNumber,
    supervisor_id: form.supervisorId,
    escalista_id: form.escalistaId,
    commercial_responsible_id: form.commercialResponsibleId,
    contract_manager_id: form.contractManagerId,
    frequency: form.frequency,
    scale_mode: form.scaleMode,
    scale_rule_start_date: form.scaleRuleStartDate,
    scale_rule_end_date: form.scaleRuleEndDate,
    scale_notes: form.scaleNotes,
    chk_contract_ok: form.chkContractOk,
    chk_contract_at: form.chkContractAt,
    chk_contract_by: form.chkContractBy,
    chk_consent_ok: form.chkConsentOk,
    chk_consent_at: form.chkConsentAt,
    chk_consent_by: form.chkConsentBy,
    chk_medical_report_ok: form.chkMedicalReportOk,
    chk_medical_report_at: form.chkMedicalReportAt,
    chk_medical_report_by: form.chkMedicalReportBy,
    chk_legal_docs_ok: form.chkLegalDocsOk,
    chk_financial_docs_ok: form.chkFinancialDocsOk,
    chk_judicial_ok: form.chkJudicialOk,
    checklist_notes: form.checklistNotes,
  };

  const { error: adminError } = await supabase
    .from('patient_admin_info')
    .upsert(payload, { onConflict: 'patient_id' });

  if (adminError) {
    console.error("Erro Admin Upsert:", adminError);
    return { success: false, error: adminError.message };
  }

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}
