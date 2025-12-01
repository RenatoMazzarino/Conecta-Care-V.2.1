'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientPersonalSchema, PatientPersonalDTO, MARKETING_CONSENT_SOURCES, MarketingConsentSource } from "@/data/definitions/personal";
import { revalidatePath } from "next/cache";

const MARKETING_CONSENT_SOURCE_DEFAULT: MarketingConsentSource = MARKETING_CONSENT_SOURCES[0];

const MIRRORED_PERSONAL_FIELDS: Array<[keyof PatientPersonalDTO | string, string]> = [
  ["document_validation_method", "doc_validation_method"],
];

const sanitizeSource = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeMarketingConsentSource = (value?: string | null): MarketingConsentSource => {
  if (!value) return MARKETING_CONSENT_SOURCE_DEFAULT;
  const sanitized = sanitizeSource(value);
  const match = MARKETING_CONSENT_SOURCES.find((source) => sanitizeSource(source) === sanitized);
  return match ?? MARKETING_CONSENT_SOURCE_DEFAULT;
};

const syncMirroredFields = (payload: Record<string, unknown>) => {
  MIRRORED_PERSONAL_FIELDS.forEach(([primary, secondary]) => {
    const value = payload[primary as string] ?? payload[secondary];
    if (value !== undefined) {
      payload[primary as string] = value;
      payload[secondary] = value;
    }
  });
};

export async function upsertPersonalAction(data: PatientPersonalDTO) {
  const supabase = await createClient();

  const parsed = PatientPersonalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos: " + JSON.stringify(parsed.error.format()) };
  }

  const {
    patient_id,
    civil_documents,
    marketing_consent_status,
    marketing_consent_history,
    ...updates
  } = parsed.data as PatientPersonalDTO & Record<string, unknown>;

  syncMirroredFields(updates);

  // Rastreio de consentimento: se flags ou status mudarem, registrar histórico
  try {
    const { data: current } = await supabase
      .from("patients")
      .select("accept_sms, accept_email, block_marketing, marketing_consented_at, marketing_consent_source, marketing_consent_status, marketing_consent_history")
      .eq("id", patient_id)
      .maybeSingle();

    const changedFlags =
      current &&
      (current.accept_sms !== updates.accept_sms ||
        current.accept_email !== updates.accept_email ||
        current.block_marketing !== updates.block_marketing ||
        current.marketing_consent_status !== marketing_consent_status);

    if (changedFlags) {
      const nowIso = new Date().toISOString();
      updates.marketing_consented_at = nowIso as any;
      const sourceCandidate =
        (updates as PatientPersonalDTO).marketing_consent_source ??
        current?.marketing_consent_source ??
        MARKETING_CONSENT_SOURCE_DEFAULT;
      updates.marketing_consent_source = normalizeMarketingConsentSource(sourceCandidate);
      const statusText = marketing_consent_status === "accepted" ? "Aceito" : marketing_consent_status === "rejected" ? "Recusado" : "Pendente";
      const entry = `${statusText} em ${new Date().toLocaleDateString()}`;
      (updates as any).marketing_consent_history = [current?.marketing_consent_history, entry].filter(Boolean).join("; ");
      (updates as any).marketing_consent_status = marketing_consent_status || current?.marketing_consent_status || "pending";
    }
  } catch (e) {
    console.warn("Não foi possível verificar mudança de consentimento", e);
  }

  // Atualiza dados principais do paciente
  const { error: patientError } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patient_id);

  if (patientError) {
    console.error("Erro Update Personal:", patientError);
    return { success: false, error: patientError.message };
  }

  // Sincroniza documentos civis extras (se fornecidos)
  if (civil_documents && civil_documents.length > 0) {
    const { data: patientRow } = await supabase.from('patients').select('tenant_id').eq('id', patient_id).maybeSingle();
    const tenantId = (patientRow as any)?.tenant_id;

    if (!tenantId) {
      console.warn("Tenant não encontrado para inserir documentos civis.");
    } else {
      const docsToUpsert = civil_documents.map((doc) => ({
        id: doc.id,
        patient_id,
        tenant_id: tenantId,
        doc_type: (doc as any).doc_type || (doc as any).docType,
        doc_number: (doc as any).doc_number || (doc as any).docNumber,
        issuer: (doc as any).issuer,
        issuer_country: (doc as any).issuer_country || (doc as any).issuerCountry || "Brasil",
        issued_at: (doc as any).issued_at || (doc as any).issuedAt,
        valid_until: (doc as any).valid_until || (doc as any).validUntil,
      }));

      const { error: docError } = await supabase
        .from("patient_civil_documents")
        .upsert(docsToUpsert, { onConflict: "id" });

      if (docError) {
        console.error("Erro ao salvar documentos civis:", docError);
        return { success: false, error: docError.message };
      }
    }
  }


  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}
