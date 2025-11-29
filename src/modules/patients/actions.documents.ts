'use server'

import { createClient } from "@/lib/supabase/server";
import { PatientDocumentSchema, PatientDocumentDTO, DocumentStatusEnum } from "@/data/definitions/documents";
import { revalidatePath } from "next/cache";

// Salva os metadados do documento no banco
export async function createDocumentRecordAction(data: PatientDocumentDTO) {
  const supabase = await createClient();
  const parsed = PatientDocumentSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  const form = parsed.data;

  const { error } = await supabase
    .from('patient_documents')
    .insert({
      ...form,
      confidential: form.confidential ?? false,
      clinical_visible: form.clinical_visible ?? true,
      admin_fin_visible: form.admin_fin_visible ?? true,
      document_status: form.document_status || DocumentStatusEnum.enum.Ativo,
      status: (form as any).status || form.document_status || 'Ativo', // compatibilidade legada
      origin: (form as any).origin || form.origin_module || 'Ficha',
      storage_path: form.storage_path || form.file_path,
      uploaded_at: form.uploaded_at || new Date(),
    });

  if (error) {
    console.error("Erro ao registrar documento:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/patients/${form.patient_id}`);
  return { success: true };
}

// Gera URL assinada para download (já que o bucket é privado)
export async function getDocumentUrlAction(filePath: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .storage
        .from('patient-documents')
        .createSignedUrl(filePath, 3600); // Link válido por 1 hora

    if (error) return { success: false, error: error.message };
    return { success: true, url: data.signedUrl };
}

// Deletar documento
export async function deleteDocumentAction(id: string, filePath: string, patientId: string) {
    const supabase = await createClient();
    
    // 1. Remove do Storage
    const { error: storageError } = await supabase.storage.from('patient-documents').remove([filePath]);
    if (storageError) console.error("Erro ao apagar arquivo:", storageError);

    // 2. Remove do Banco
    const { error: dbError } = await supabase.from('patient_documents').delete().eq('id', id);
    
    if (dbError) return { success: false, error: dbError.message };

    revalidatePath(`/patients/${patientId}`);
    return { success: true };
}
