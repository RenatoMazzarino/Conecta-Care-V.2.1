'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientPersonalSchema, PatientPersonalDTO } from "@/data/definitions/personal";
import { revalidatePath } from "next/cache";

export async function upsertPersonalAction(data: PatientPersonalDTO) {
  const supabase = await createClient();

  const parsed = PatientPersonalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos: " + JSON.stringify(parsed.error.format()) };
  }

  const { patient_id, civil_documents, ...updates } = parsed.data;

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
