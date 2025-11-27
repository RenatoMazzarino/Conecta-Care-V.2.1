"use server";

import { createClient } from "@/lib/supabase/server";
import { PatientDocumentSchema } from "@/data/definitions/documents";

export async function getDocuments(patientId: string, opts?: { category?: string; status?: string; search?: string; origin?: string }) {
  const supabase = await createClient();
  let query = supabase.from("patient_documents").select("*").eq("patient_id", patientId);
  if (opts?.category && opts.category !== "all") query = query.eq("category", opts.category);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.origin) query = query.eq("origin", opts.origin);
  if (opts?.search) query = query.ilike("title", `%${opts.search}%`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Erro ao listar documentos:", error);
    return [];
  }
  return data || [];
}

export async function upsertDocumentMeta(doc: unknown) {
  const parsed = PatientDocumentSchema.safeParse(doc);
  if (!parsed.success) return { success: false, error: "Dados inválidos" };
  const supabase = await createClient();
  const { error } = await supabase.from("patient_documents").upsert(parsed.data);
  if (error) {
    console.error("Erro ao salvar documento:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
