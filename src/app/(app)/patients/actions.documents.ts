"use server";

import { createClient } from "@/lib/supabase/server";
import { PatientDocumentSchema, DocumentStatusEnum } from "@/data/definitions/documents";

type GetDocsOpts = { category?: string; status?: string; search?: string; origin?: string; domain?: string };

export async function getDocuments(patientId: string, opts?: GetDocsOpts) {
  const supabase = await createClient();
  let query = supabase.from("patient_documents").select("*").eq("patient_id", patientId);

  if (opts?.category && opts.category !== "all") query = query.eq("category", opts.category);
  if (opts?.domain && opts.domain !== "all") query = query.eq("domain", opts.domain);
  if (opts?.status && opts.status !== "all") query = query.eq("document_status", opts.status);
  if (opts?.origin && opts.origin !== "all") query = query.eq("origin_module", opts.origin);
  if (opts?.search) query = query.ilike("title", `%${opts.search}%`);

  const { data, error } = await query.order("uploaded_at", { ascending: false }).order("created_at", { ascending: false });
  if (error) {
    console.error("Erro ao listar documentos:", error);
    return [];
  }
  return data || [];
}

export async function upsertDocumentMeta(doc: unknown) {
  let normalized = doc;
  if (doc && typeof doc === "object") {
    normalized = { ...(doc as Record<string, any>) };
    if (!normalized.extension && typeof normalized.original_file_name === "string") {
      const ext = normalized.original_file_name.split(".").pop();
      normalized.extension = (ext || "bin").toLowerCase();
    }
  }

  const parsed = PatientDocumentSchema.safeParse(normalized);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    return { success: false, error: "Dados inválidos" };
  }

  const payload = {
    ...parsed.data,
    status: (parsed.data as any).status || parsed.data.document_status,
  };

  // Defaults e compatibilidade
  if (!payload.storage_path) payload.storage_path = payload.file_path;
  if (!payload.uploaded_at) payload.uploaded_at = new Date();
  if (!payload.document_status) payload.document_status = DocumentStatusEnum.enum.Ativo;

  const supabase = await createClient();
  const { error } = await supabase.from("patient_documents").upsert(payload);
  if (error) {
    console.error("Erro ao salvar documento:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
