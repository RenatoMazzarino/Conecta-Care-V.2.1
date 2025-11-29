"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { PatientDocumentZ } from "@/schemas/patient.document";
import { DocumentStatusEnum } from "@/data/definitions/documents";

const BUCKET = "patient-documents";

type UploadResult = { success: boolean; error?: string };

async function logDocumentEvent(documentId: string, patientId: string, action: string, userId?: string | null, details?: any) {
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("tenant_id").eq("id", patientId).maybeSingle();
  const tenantId = patient?.tenant_id;
  if (!tenantId) return; // evita falha por FK/NOT NULL
  await supabase.from("patient_document_logs").insert({
    document_id: documentId,
    tenant_id: tenantId,
    user_id: userId || null,
    action,
    details: details ? JSON.stringify(details) : null,
  });
}

function fileHashMd5(buffer: Buffer) {
  try {
    return crypto.createHash("md5").update(buffer).digest("hex");
  } catch {
    return null;
  }
}

function parseTagsFromForm(value?: string | null) {
  return value ? value.split(",").map((t) => t.trim()).filter(Boolean) : null;
}

export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as unknown as File | null;
  const patientId = formData.get("patient_id") as string | null;
  if (!file || !patientId) return { success: false, error: "Arquivo ou paciente não informados." };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filePath = `${patientId}/${Date.now()}.${fileExt}`;

  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const uploaderId = authUser?.user?.id || null;
  const expiresRaw = formData.get("expires_at") as string | null;
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  const isVerified = formData.get("is_verified") === "true";
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const hash = fileHashMd5(buffer);

  const payload = {
    patient_id: patientId,
    title: (formData.get("title") as string) || file.name,
    description: (formData.get("description") as string) || null,
    external_ref: (formData.get("external_ref") as string) || null,
    category: (formData.get("category") as string) || undefined,
    domain: (formData.get("domain") as string) || undefined,
    subcategory: (formData.get("subcategory") as string) || null,
    origin_module: (formData.get("origin_module") as string) || undefined,
    document_status: (formData.get("document_status") as string) || DocumentStatusEnum.enum.Ativo,
    confidential: formData.get("confidential") === "true",
    clinical_visible: formData.get("clinical_visible") !== "false",
    admin_fin_visible: formData.get("admin_fin_visible") !== "false",
    min_access_role: (formData.get("min_access_role") as string) || null,
    storage_provider: (formData.get("storage_provider") as string) || "Supabase",
    storage_path: filePath,
    original_file_name: file.name,
    file_path: filePath,
    file_size_bytes: buffer.byteLength,
    mime_type: file.type || "application/octet-stream",
    extension: fileExt,
    file_hash: hash,
    version: 1,
    expires_at: expiresAt || null,
    is_verified: isVerified,
    verified_at: isVerified ? new Date() : null,
    verified_by: isVerified ? uploaderId : null,
    signature_type: (formData.get("signature_type") as string) || "Nenhuma",
    signature_date: formData.get("signature_date") ? new Date(formData.get("signature_date") as string) : null,
    signature_summary: (formData.get("signature_summary") as string) || null,
    admin_contract_id: (formData.get("admin_contract_id") as string) || null,
    finance_entry_id: (formData.get("finance_entry_id") as string) || null,
    clinical_visit_id: (formData.get("clinical_visit_id") as string) || null,
    clinical_evolution_id: (formData.get("clinical_evolution_id") as string) || null,
    prescription_id: (formData.get("prescription_id") as string) || null,
    related_object_id: (formData.get("related_object_id") as string) || null,
    tags: parseTagsFromForm(formData.get("tags") as string),
    public_notes: (formData.get("public_notes") as string) || null,
    internal_notes: (formData.get("internal_notes") as string) || null,
    uploaded_at: new Date(),
    uploaded_by: uploaderId,
  };

  const parsed = PatientDocumentZ.safeParse(payload);
  if (!parsed.success) return { success: false, error: "Metadados inválidos." };

  const { error: insertError, data } = await supabase.from("patient_documents").insert(parsed.data).select("id").single();
  if (insertError) return { success: false, error: insertError.message };

  await logDocumentEvent(data.id, patientId, "Upload", uploaderId, { file: file.name });
  return { success: true };
}

export async function newDocumentVersion(previousId: string, formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const { data: previous, error: prevErr } = await supabase.from("patient_documents").select("*").eq("id", previousId).single();
  if (prevErr || !previous) return { success: false, error: "Documento anterior não encontrado" };

  const mark = await supabase.from("patient_documents").update({ document_status: "Substituido" }).eq("id", previousId);
  if (mark.error) return { success: false, error: mark.error.message };

  formData.set("patient_id", previous.patient_id);
  formData.set("document_status", DocumentStatusEnum.enum.Ativo);
  const file = formData.get("file") as unknown as File | null;
  if (!file) return { success: false, error: "Arquivo obrigatório" };
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filePath = `${previous.patient_id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const expiresRaw = formData.get("expires_at") as string | null;
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  const isVerified = formData.get("is_verified") === "true";
  const hash = fileHashMd5(buffer);
  const payload = {
    ...previous,
    id: undefined,
    previous_document_id: previousId,
    version: (previous.version || 1) + 1,
    file_path: filePath,
    storage_path: filePath,
    original_file_name: file.name,
    file_size_bytes: buffer.byteLength,
    mime_type: file.type || "application/octet-stream",
    extension: fileExt,
    file_hash: hash,
    uploaded_at: new Date(),
    uploaded_by: authUser?.user?.id || previous.uploaded_by || null,
    expires_at: expiresAt || previous.expires_at || null,
    is_verified: typeof formData.get("is_verified") !== "undefined" ? isVerified : previous.is_verified,
    verified_at: isVerified ? new Date() : previous.verified_at,
    verified_by: isVerified ? authUser?.user?.id || null : previous.verified_by,
    document_status: DocumentStatusEnum.enum.Ativo,
    title: (formData.get("title") as string) || previous.title,
    description: (formData.get("description") as string) || previous.description,
  };

  const parsed = PatientDocumentZ.safeParse(payload);
  if (!parsed.success) return { success: false, error: "Metadados inválidos" };

  const { error: insertError, data } = await supabase.from("patient_documents").insert(parsed.data).select("id").single();
  if (insertError) return { success: false, error: insertError.message };
  await logDocumentEvent(data.id, previous.patient_id, "NewVersion", authUser?.user?.id || null, { previousId });
  return { success: true };
}

export async function updateDocumentMeta(id: string, metadata: Partial<Record<string, any>>) {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const allowed = [
    "title",
    "description",
    "external_ref",
    "category",
    "domain",
    "subcategory",
    "origin_module",
    "document_status",
    "confidential",
    "clinical_visible",
    "admin_fin_visible",
    "min_access_role",
    "admin_contract_id",
    "finance_entry_id",
    "clinical_visit_id",
    "clinical_evolution_id",
    "prescription_id",
    "related_object_id",
    "tags",
    "public_notes",
    "internal_notes",
    "signature_type",
    "signature_date",
    "signature_summary",
    "external_signature_id",
    "expires_at",
    "is_verified",
  ];
  const payload: Record<string, any> = {};
  allowed.forEach((k) => {
    if (metadata[k] !== undefined) payload[k] = metadata[k];
  });
  if (metadata.tags && typeof metadata.tags === "string") {
    payload.tags = parseTagsFromForm(metadata.tags);
  }
  if (metadata.expires_at !== undefined) {
    payload.expires_at = metadata.expires_at ? new Date(metadata.expires_at as any) : null;
  }
  if (metadata.is_verified !== undefined) {
    const desired = metadata.is_verified === true || metadata.is_verified === "true";
    payload.is_verified = desired;
    if (desired) {
      payload.verified_at = new Date().toISOString();
      payload.verified_by = authUser?.user?.id || null;
    } else {
      payload.verified_at = null;
      payload.verified_by = null;
    }
  }
  payload.updated_at = new Date().toISOString();
  payload.updated_by = authUser?.user?.id || null;
  const { error } = await supabase.from("patient_documents").update(payload).eq("id", id);
  if (error) return { success: false, error: error.message };
  const { data: doc } = await supabase.from("patient_documents").select("patient_id").eq("id", id).maybeSingle();
  if (doc?.patient_id) await logDocumentEvent(id, doc.patient_id, "UpdateMeta", authUser?.user?.id || null, payload);
  return { success: true };
}

export async function archiveDocument(id: string) {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const { data: doc } = await supabase.from("patient_documents").select("patient_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("patient_documents")
    .update({
      document_status: "Arquivado",
      deleted_at: new Date().toISOString(),
      deleted_by: authUser?.user?.id || null,
    })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  if (doc?.patient_id) await logDocumentEvent(id, doc.patient_id, "Archive", authUser?.user?.id || null);
  return { success: true };
}

export async function listDocuments(
  patientId: string,
  filters?: {
    category?: string;
    domain?: string;
    text?: string;
    origin?: string;
    status?: string;
    uploaded_from?: string;
    uploaded_to?: string;
    order_by?: "uploaded_at" | "title";
    order_dir?: "asc" | "desc";
    tags?: string;
    subcategory?: string;
    min_access_role?: string;
  },
) {
  const supabase = await createClient();
  let query = supabase.from("patient_documents").select("*").eq("patient_id", patientId);
  if (filters?.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters?.domain && filters.domain !== "all") query = query.eq("domain", filters.domain);
  if (filters?.origin && filters.origin !== "all") query = query.eq("origin_module", filters.origin);
  if (filters?.status && filters.status !== "all") query = query.eq("document_status", filters.status);
  if (filters?.min_access_role && filters.min_access_role !== "all") query = query.eq("min_access_role", filters.min_access_role);
  if (filters?.text) query = query.ilike("title", `%${filters.text}%`);
  if (filters?.uploaded_from) query = query.gte("uploaded_at", filters.uploaded_from);
  if (filters?.uploaded_to) query = query.lte("uploaded_at", filters.uploaded_to);
  if (filters?.subcategory) query = query.ilike("subcategory", `%${filters.subcategory}%`);
  if (filters?.tags) {
    const tagArr = parseTagsFromForm(filters.tags);
    if (tagArr && tagArr.length > 0) query = query.contains("tags", tagArr);
  }
  const orderBy = filters?.order_by || "uploaded_at";
  const ascending = filters?.order_dir === "asc";
  const { data: docs, error } = await query.order(orderBy, { ascending });
  if (error || !docs) return [];

  const uploaderIds = Array.from(new Set(docs.map((d) => d.uploaded_by).filter(Boolean))) as string[];
  let uploaders: Record<string, string> = {};
  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase.from("user_profiles").select("auth_user_id, name").in("auth_user_id", uploaderIds);
    uploaders = Object.fromEntries((profiles || []).map((p) => [p.auth_user_id, p.name || ""]));
  }
  return docs.map((d) => ({
    ...d,
    uploaded_by_name: d.uploaded_by ? uploaders[d.uploaded_by] || "" : "",
  }));
}

// ----------------------------
// Detalhes, versões e logs
// ----------------------------

export async function getDocumentDetails(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_documents")
    .select(
      `
        *,
        uploader:user_profiles!patient_documents_uploaded_by_fkey(name),
        deleter:user_profiles!patient_documents_deleted_by_fkey(name),
        updater:user_profiles!patient_documents_updated_by_fkey(name)
      `,
    )
    .eq("id", documentId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    uploaded_by_name: (data as any).uploader?.name || "",
    deleted_by_name: (data as any).deleter?.name || "",
    updated_by_name: (data as any).updater?.name || "",
  };
}

export async function getDocumentVersions(documentId: string) {
  const supabase = await createClient();
  const { data: doc } = await supabase.from("patient_documents").select("patient_id, original_file_name").eq("id", documentId).maybeSingle();
  if (!doc) return [];
  const { data, error } = await supabase
    .from("patient_documents")
    .select("*")
    .eq("patient_id", doc.patient_id)
    .eq("original_file_name", doc.original_file_name)
    .order("version", { ascending: false });
  if (error || !data) return [];
  const uploaderIds = Array.from(new Set(data.map((d) => d.uploaded_by).filter(Boolean))) as string[];
  let uploaders: Record<string, string> = {};
  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase.from("user_profiles").select("auth_user_id, name").in("auth_user_id", uploaderIds);
    uploaders = Object.fromEntries((profiles || []).map((p) => [p.auth_user_id, p.name || ""]));
  }
  return data.map((d) => ({ ...d, uploaded_by_name: d.uploaded_by ? uploaders[d.uploaded_by] || "" : "" }));
}

export async function getDocumentLogs(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_document_logs")
    .select("*, user_profiles!patient_document_logs_user_id_fkey(name)")
    .eq("document_id", documentId)
    .order("happened_at", { ascending: false });
  if (error || !data) return [];
  return data.map((l: any) => ({
    ...l,
    user_name: l.user_profiles?.name || "",
  }));
}

export async function generatePreviewUrl(
  storagePath: string,
  opts?: { documentId?: string; action?: "Preview" | "Download" },
) {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  let documentId = opts?.documentId || null;
  let patientId: string | null = null;

  if (documentId) {
    const { data: doc } = await supabase.from("patient_documents").select("patient_id").eq("id", documentId).maybeSingle();
    patientId = doc?.patient_id || null;
  } else {
    const { data: byStorage } = await supabase.from("patient_documents").select("id, patient_id").eq("storage_path", storagePath).maybeSingle();
    if (byStorage) {
      documentId = byStorage.id;
      patientId = byStorage.patient_id;
    } else {
      const { data: byFile } = await supabase.from("patient_documents").select("id, patient_id").eq("file_path", storagePath).maybeSingle();
      documentId = byFile?.id || null;
      patientId = byFile?.patient_id || null;
    }
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 15);
  if (error || !data?.signedUrl) return { success: false, error: error?.message || "Erro ao gerar link" };

  if (documentId && patientId) {
    await logDocumentEvent(documentId, patientId, opts?.action || "Preview", authUser?.user?.id || null, { via: "signed_url" });
  }

  return { success: true, url: data.signedUrl };
}
