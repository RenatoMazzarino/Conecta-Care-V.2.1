"use server";

import { createClient } from "@/lib/supabase/server";
import { RelatedPersonZ, CareTeamMemberZ, RelatedPersonForm, CareTeamMemberForm } from "@/schemas/patient.support";
import { cache } from "react";

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

async function ensureTenant(patientId: string, supabase: SupabaseClientType) {
  const { data } = await supabase.from("patients").select("tenant_id").eq("id", patientId).single();
  return data?.tenant_id || null;
}

export async function upsertRelatedPerson(data: RelatedPersonForm) {
  const supabase = await createClient();
  const parsed = RelatedPersonZ.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }
  const payload = parsed.data;
  const tenantId = payload.tenantId || (await ensureTenant(payload.patientId, supabase));

  const { error, data: saved } = await supabase
    .from("patient_related_persons")
    .upsert({
      id: payload.id,
      patient_id: payload.patientId,
      tenant_id: tenantId,
      full_name: payload.fullName,
      contact_type: payload.contactType,
      relation: payload.relation,
      relation_description: payload.relationDescription,
      priority_order: payload.priorityOrder,
      phone_primary: payload.phonePrimary,
      phone_secondary: payload.phoneSecondary,
      is_whatsapp: payload.isWhatsapp,
      email: payload.email,
      is_legal_guardian: payload.isLegalGuardian,
      is_financial_responsible: payload.isFinancialResponsible,
      is_emergency_contact: payload.isEmergencyContact,
      is_main_contact: payload.isMainContact,
      can_access_records: payload.canAccessRecords,
      can_authorize_procedures: payload.canAuthorizeProcedures,
      can_authorize_financial: payload.canAuthorizeFinancial,
      lives_with_patient: payload.livesWithPatient,
      has_keys: payload.hasKeys,
      contact_window: payload.contactWindow,
      preferred_contact: payload.preferredContact,
      receive_updates: payload.receiveUpdates,
      receive_admin: payload.receiveAdmin,
      opt_out_marketing: payload.optOutMarketing,
      notes: payload.notes,
      cpf: payload.cpf,
      birth_date: payload.birthDate,
      rg: payload.rg,
      rg_issuer: payload.rgIssuer,
      rg_state: payload.rgState,
      address_street: payload.addressStreet,
      address_city: payload.addressCity,
      address_state: payload.addressState,
      address_summary: payload.addressSummary,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: saved };
}

export async function deleteRelatedPerson(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("patient_related_persons").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function upsertTeamMember(data: CareTeamMemberForm) {
  const supabase = await createClient();
  const parsed = CareTeamMemberZ.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }
  const payload = parsed.data;
  const tenantId = payload.tenantId || (await ensureTenant(payload.patientId, supabase));

  const { error, data: saved } = await supabase
    .from("care_team_members")
    .upsert({
      id: payload.id,
      patient_id: payload.patientId,
      tenant_id: tenantId,
      professional_id: payload.professionalId,
      role: payload.role,
      professional_category: payload.professionalCategory,
      case_role: payload.caseRole,
      regime: payload.regime,
      status: payload.status,
      is_primary: payload.isPrimary,
      employment_type: payload.employmentType,
      shift_summary: payload.shiftSummary,
      work_window: payload.workWindow,
      internal_extension: payload.internalExtension,
      corporate_cell: payload.corporateCell,
      contact_phone: payload.contactPhone,
      contact_email: payload.contactEmail,
      start_date: payload.startDate,
      end_date: payload.endDate,
      is_technical_responsible: payload.isTechnicalResponsible,
      is_family_focal_point: payload.isFamilyFocalPoint,
      notes: payload.notes,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: saved };
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("care_team_members").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Lista resumida de profissionais para lookup
export const getProfessionalsList = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("professionals").select("id, full_name, role");
  if (error) {
    console.error("Erro ao buscar profissionais:", error);
    return [];
  }
  return (data || []).map((p) => ({
    id: p.id as string,
    name: `${p.full_name}${p.role ? ` (${p.role})` : ""}`,
    category: p.role || "",
  }));
});
