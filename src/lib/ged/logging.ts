import { createClient } from "@/lib/supabase/server";

type DocumentLogMeta = {
  category?: string | null;
  domain?: string | null;
  origin_module?: string | null;
  document_status?: string | null;
  version?: number | null;
};

export async function logDocumentEvent(
  documentId: string,
  patientId: string,
  action: string,
  userId?: string | null,
  details?: any,
  meta?: DocumentLogMeta,
) {
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("tenant_id").eq("id", patientId).maybeSingle();
  const tenantId = patient?.tenant_id;
  if (!tenantId) return;
  let docMeta = meta;
  if (!docMeta) {
    const { data: doc } = await supabase
      .from("patient_documents")
      .select("category, domain, origin_module, document_status, version")
      .eq("id", documentId)
      .maybeSingle();
    docMeta = doc || undefined;
  }
  await supabase.from("patient_document_logs").insert({
    document_id: documentId,
    tenant_id: tenantId,
    patient_id: patientId,
    user_id: userId || null,
    action,
    document_category: docMeta?.category || null,
    document_domain: docMeta?.domain || null,
    document_origin: docMeta?.origin_module || null,
    document_status: docMeta?.document_status || null,
    document_version: docMeta?.version || null,
    details: details ? JSON.stringify(details) : null,
  });
}

export type { DocumentLogMeta };
