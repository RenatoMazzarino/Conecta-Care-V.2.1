'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientAdminInfoZ, PatientAdminInfoForm } from "@/schemas/patient.adminInfo";
import { revalidatePath } from "next/cache";

export async function upsertAdministrativeAction(data: PatientAdminInfoForm) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData?.user?.id || null;
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
    contract_status_enum: form.contractStatusEnum,
    service_package_name: form.servicePackageName,
    service_package_description: form.servicePackageDescription,
    effective_discharge_date: form.effectiveDischargeDate,
    admission_type: form.admissionType,
    demand_origin: form.demandOrigin,
    demand_origin_description: form.demandOriginDescription,
    primary_payer_type: form.primaryPayerType,
    start_date: form.startDate,
    end_date: form.endDate,
    contract_category: form.contractCategory,
    acquisition_channel: form.acquisitionChannel,
    contract_start_date: form.contractStartDate,
    contract_end_date: form.contractEndDate,
    renewal_type: form.renewalType,
    contract_id: form.contractId,
    external_contract_id: form.externalContractId,
    authorization_number: form.authorizationNumber,
    judicial_case_number: form.judicialCaseNumber,
    official_letter_number: form.officialLetterNumber,
    contract_status_reason: form.contractStatusReason,
    admin_notes: form.adminNotes,
    cost_center_id: form.costCenterId,
    erp_case_code: form.erpCaseCode,
    supervisor_id: form.supervisorId,
    escalista_id: form.escalistaId,
    commercial_responsible_id: form.commercialResponsibleId,
    contract_manager_id: form.contractManagerId,
    payer_admin_contact_id: form.payerAdminContactId,
    payer_admin_contact_description: form.payerAdminContactDescription,
    primary_payer_description: form.primaryPayerDescription,
    primary_payer_related_person_id: form.primaryPayerRelatedPersonId,
    primary_payer_legal_entity_id: form.primaryPayerLegalEntityId,
    primary_payer_type: form.primaryPayerType,
    cost_center_id: form.costCenterId,
    erp_case_code: form.erpCaseCode,
    frequency: form.frequency,
    scale_model: form.scaleModel,
    scale_mode: form.scaleMode,
    shift_modality: form.shiftModality,
    base_professional_category: form.baseProfessionalCategory,
    quantity_per_shift: form.quantityPerShift,
    weekly_hours_expected: form.weeklyHoursExpected,
    day_shift_start: form.dayShiftStart,
    night_shift_start: form.nightShiftStart,
    day_shift_end: form.dayShiftEnd,
    night_shift_end: form.nightShiftEnd,
    reference_location_id: form.referenceLocationId,
    includes_weekends: form.includesWeekends,
    holiday_rule: form.holidayRule,
    auto_generate_scale: form.autoGenerateScale,
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
    chk_judicial_at: form.chkJudicialAt,
    chk_judicial_by: form.chkJudicialBy,
    chk_address_proof_ok: form.chkAddressProofOk,
    chk_legal_guardian_docs_ok: form.chkLegalGuardianDocsOk,
    chk_financial_responsible_docs_ok: form.chkFinancialResponsibleDocsOk,
    chk_other_docs_ok: form.chkOtherDocsOk,
    chk_other_docs_desc: form.chkOtherDocsDesc,
    chk_address_proof_at: form.chkAddressProofAt,
    chk_address_proof_by: form.chkAddressProofBy,
    chk_legal_guardian_docs_at: form.chkLegalGuardianDocsAt,
    chk_legal_guardian_docs_by: form.chkLegalGuardianDocsBy,
    chk_financial_responsible_docs_at: form.chkFinancialResponsibleDocsAt,
    chk_financial_responsible_docs_by: form.chkFinancialResponsibleDocsBy,
    chk_other_docs_at: form.chkOtherDocsAt,
    chk_other_docs_by: form.chkOtherDocsBy,
    chk_contract_doc_id: form.chkContractDocId,
    chk_consent_doc_id: form.chkConsentDocId,
    chk_medical_report_doc_id: form.chkMedicalReportDocId,
    chk_address_proof_doc_id: form.chkAddressProofDocId,
    chk_legal_docs_doc_id: form.chkLegalDocsDocId,
    chk_financial_docs_doc_id: form.chkFinancialDocsDocId,
    chk_judicial_doc_id: form.chkJudicialDocId,
    checklist_complete: form.checklistComplete,
    checklist_notes: form.checklistNotes,
    checklist_notes_detailed: form.checklistNotesDetailed,
  };

  const nowIso = new Date().toISOString();
  if (payload.chk_address_proof_ok && !payload.chk_address_proof_at) {
    payload.chk_address_proof_at = nowIso;
    payload.chk_address_proof_by = payload.chk_address_proof_by || currentUserId;
  }
  if (payload.chk_legal_guardian_docs_ok && !payload.chk_legal_guardian_docs_at) {
    payload.chk_legal_guardian_docs_at = nowIso;
    payload.chk_legal_guardian_docs_by = payload.chk_legal_guardian_docs_by || currentUserId;
  }
  if (payload.chk_financial_responsible_docs_ok && !payload.chk_financial_responsible_docs_at) {
    payload.chk_financial_responsible_docs_at = nowIso;
    payload.chk_financial_responsible_docs_by = payload.chk_financial_responsible_docs_by || currentUserId;
  }
  if (payload.chk_other_docs_ok && !payload.chk_other_docs_at) {
    payload.chk_other_docs_at = nowIso;
    payload.chk_other_docs_by = payload.chk_other_docs_by || currentUserId;
  }
  if (payload.chk_judicial_ok && !payload.chk_judicial_at) {
    payload.chk_judicial_at = nowIso;
    payload.chk_judicial_by = payload.chk_judicial_by || currentUserId;
  }

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
