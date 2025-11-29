import { createClient } from "@/lib/supabase/server";
import { PatientDocumentZ } from "@/schemas/patient.document";
import { DocumentStatusEnum } from "@/data/definitions/documents";
import { parseTagsInput } from "@/lib/ged/utils";
import { logDocumentEvent } from "@/lib/ged/logging";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getClient(existing?: SupabaseServerClient) {
  if (existing) return existing;
  return createClient();
}

export type ListDocumentsFilters = {
  category?: string;
  domain?: string;
  status?: string;
  origin?: string;
  text?: string;
  tags?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "uploaded_at" | "title" | "created_at";
  orderDir?: "asc" | "desc";
  subcategory?: string;
  minAccessRole?: string;
};

export async function listPatientDocuments(patientId: string, filters: ListDocumentsFilters = {}, client?: SupabaseServerClient) {
  const supabase = await getClient(client);
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("patient_documents").select("*", { count: "exact" }).eq("patient_id", patientId);
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.domain && filters.domain !== "all") query = query.eq("domain", filters.domain);
  if (filters.origin && filters.origin !== "all") query = query.eq("origin_module", filters.origin);
  if (filters.status && filters.status !== "all") query = query.eq("document_status", filters.status);
  if (filters.minAccessRole && filters.minAccessRole !== "all") query = query.eq("min_access_role", filters.minAccessRole);
  if (filters.text) query = query.ilike("title", `%${filters.text}%`);
  if (filters.from) query = query.gte("uploaded_at", filters.from);
  if (filters.to) query = query.lte("uploaded_at", filters.to);
  if (filters.subcategory) query = query.ilike("subcategory", `%${filters.subcategory}%`);
  if (filters.tags) {
    const tagArr = parseTagsInput(filters.tags);
    if (tagArr && tagArr.length > 0) query = query.contains("tags", tagArr);
  }
  const orderBy = filters.orderBy || "uploaded_at";
  const ascending = filters.orderDir === "asc";
  const { data, error, count } = await query.order(orderBy, { ascending }).range(from, to);
  if (error) throw new Error(error.message);
  return {
    data: data || [],
    page,
    pageSize,
    total: count ?? data?.length ?? 0,
  };
}

export type CreateDocumentInput = {
  patientId: string;
  title: string;
  description?: string | null;
  externalRef?: string | null;
  category: string;
  domain: string;
  subcategory?: string | null;
  originModule?: string;
  documentStatus?: string;
  confidential?: boolean;
  clinicalVisible?: boolean;
  adminVisible?: boolean;
  minAccessRole?: string | null;
  storageProvider?: string;
  storagePath: string;
  filePath?: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  extension: string;
  fileHash?: string | null;
  version?: number;
  previousDocumentId?: string | null;
  expiresAt?: string | Date | null;
  isVerified?: boolean;
  verifiedAt?: string | Date | null;
  verifiedBy?: string | null;
  adminContractId?: string | null;
  financeEntryId?: string | null;
  clinicalVisitId?: string | null;
  clinicalEvolutionId?: string | null;
  prescriptionId?: string | null;
  relatedObjectId?: string | null;
  signatureType?: string;
  signatureDate?: string | Date | null;
  signatureSummary?: string | null;
  externalSignatureId?: string | null;
  tags?: string[];
  publicNotes?: string | null;
  internalNotes?: string | null;
  uploadedBy?: string | null;
  uploadedAt?: string | Date;
};

export async function createPatientDocument(input: CreateDocumentInput, client?: SupabaseServerClient) {
  const supabase = await getClient(client);
  const now = new Date();
  const payload = {
    patient_id: input.patientId,
    title: input.title,
    description: input.description ?? null,
    external_ref: input.externalRef ?? null,
    category: input.category,
    domain: input.domain,
    subcategory: input.subcategory ?? null,
    origin_module: input.originModule || "Ficha_Documentos",
    document_status: input.documentStatus || DocumentStatusEnum.enum.Ativo,
    confidential: input.confidential ?? false,
    clinical_visible: input.clinicalVisible ?? true,
    admin_fin_visible: input.adminVisible ?? true,
    min_access_role: input.minAccessRole ?? null,
    storage_provider: input.storageProvider || "Supabase",
    storage_path: input.storagePath,
    file_path: input.filePath || input.storagePath,
    original_file_name: input.originalFileName,
    file_size_bytes: input.fileSizeBytes,
    mime_type: input.mimeType,
    extension: input.extension,
    file_hash: input.fileHash || null,
    version: input.version ?? 1,
    previous_document_id: input.previousDocumentId || null,
    expires_at: input.expiresAt ? new Date(input.expiresAt) : null,
    is_verified: input.isVerified ?? false,
    verified_at: input.isVerified ? new Date(input.verifiedAt || now) : null,
    verified_by: input.isVerified ? input.verifiedBy || input.uploadedBy || null : null,
    admin_contract_id: input.adminContractId || null,
    finance_entry_id: input.financeEntryId || null,
    clinical_visit_id: input.clinicalVisitId || null,
    clinical_evolution_id: input.clinicalEvolutionId || null,
    prescription_id: input.prescriptionId || null,
    related_object_id: input.relatedObjectId || null,
    signature_type: input.signatureType || "Nenhuma",
    signature_date: input.signatureDate ? new Date(input.signatureDate) : null,
    signature_summary: input.signatureSummary || null,
    external_signature_id: input.externalSignatureId || null,
    tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
    public_notes: input.publicNotes || null,
    internal_notes: input.internalNotes || null,
    uploaded_at: input.uploadedAt ? new Date(input.uploadedAt) : now,
    uploaded_by: input.uploadedBy || null,
    created_at: now,
  } as const;

  const parsed = PatientDocumentZ.safeParse(payload);
  if (!parsed.success) throw new Error("Metadados inválidos para documento");

  const { data, error } = await supabase.from("patient_documents").insert(parsed.data).select("*").single();
  if (error) throw new Error(error.message);

  await logDocumentEvent(
    data.id,
    data.patient_id,
    "document.create",
    input.uploadedBy || null,
    { title: data.title },
    {
      category: data.category,
      domain: data.domain,
      origin_module: data.origin_module,
      document_status: data.document_status,
      version: data.version,
    },
  );
  return data;
}

export type UpdateDocumentInput = {
  title?: string;
  description?: string | null;
  externalRef?: string | null;
  status?: string;
  expiresAt?: string | Date | null;
  isVisibleAdmin?: boolean;
  isVisibleClinical?: boolean;
  isConfidential?: boolean;
  minAccessRole?: string | null;
  isVerified?: boolean;
  publicNotes?: string | null;
  internalNotes?: string | null;
  signatureType?: string | null;
  signatureDate?: string | Date | null;
  signatureSummary?: string | null;
  externalSignatureId?: string | null;
  tags?: string[];
  updatedBy?: string | null;
  category?: string;
  domain?: string;
  originModule?: string;
  subcategory?: string | null;
  adminContractId?: string | null;
  financeEntryId?: string | null;
  clinicalVisitId?: string | null;
  clinicalEvolutionId?: string | null;
  prescriptionId?: string | null;
  relatedObjectId?: string | null;
};

export async function updatePatientDocument(
  patientId: string,
  documentId: string,
  input: UpdateDocumentInput,
  client?: SupabaseServerClient,
) {
  const supabase = await getClient(client);
  const { data: existing, error: fetchError } = await supabase
    .from("patient_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  if (fetchError || !existing) throw new Error("Documento não encontrado");
  if (existing.patient_id !== patientId) throw new Error("Documento não pertence ao paciente informado");

  const payload: Record<string, any> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.externalRef !== undefined) payload.external_ref = input.externalRef;
  if (input.category !== undefined) payload.category = input.category;
  if (input.domain !== undefined) payload.domain = input.domain;
  if (input.originModule !== undefined) payload.origin_module = input.originModule;
  if (input.subcategory !== undefined) payload.subcategory = input.subcategory;
  if (input.status !== undefined) payload.document_status = input.status;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt ? new Date(input.expiresAt) : null;
  if (input.isVisibleAdmin !== undefined) payload.admin_fin_visible = input.isVisibleAdmin;
  if (input.isVisibleClinical !== undefined) payload.clinical_visible = input.isVisibleClinical;
  if (input.isConfidential !== undefined) payload.confidential = input.isConfidential;
  if (input.minAccessRole !== undefined) payload.min_access_role = input.minAccessRole;
  if (input.adminContractId !== undefined) payload.admin_contract_id = input.adminContractId;
  if (input.financeEntryId !== undefined) payload.finance_entry_id = input.financeEntryId;
  if (input.clinicalVisitId !== undefined) payload.clinical_visit_id = input.clinicalVisitId;
  if (input.clinicalEvolutionId !== undefined) payload.clinical_evolution_id = input.clinicalEvolutionId;
  if (input.prescriptionId !== undefined) payload.prescription_id = input.prescriptionId;
  if (input.relatedObjectId !== undefined) payload.related_object_id = input.relatedObjectId;
  if (input.publicNotes !== undefined) payload.public_notes = input.publicNotes;
  if (input.internalNotes !== undefined) payload.internal_notes = input.internalNotes;
  if (input.signatureType !== undefined) payload.signature_type = input.signatureType;
  if (input.signatureDate !== undefined) payload.signature_date = input.signatureDate ? new Date(input.signatureDate) : null;
  if (input.signatureSummary !== undefined) payload.signature_summary = input.signatureSummary;
  if (input.externalSignatureId !== undefined) payload.external_signature_id = input.externalSignatureId;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.isVerified !== undefined) {
    payload.is_verified = input.isVerified;
    payload.verified_at = input.isVerified ? new Date() : null;
  }

  payload.updated_at = new Date();
  payload.updated_by = input.updatedBy || null;
  const { error: updateError, data: updated } = await supabase
    .from("patient_documents")
    .update(payload)
    .eq("id", documentId)
    .select("*")
    .single();
  if (updateError || !updated) throw new Error(updateError?.message || "Erro ao atualizar documento");

  await logDocumentEvent(
    documentId,
    patientId,
    "document.update",
    input.updatedBy || null,
    payload,
    {
      category: updated.category,
      domain: updated.domain,
      origin_module: updated.origin_module,
      document_status: updated.document_status,
      version: updated.version,
    },
  );

  if (input.isVerified !== undefined) {
    await logDocumentEvent(
      documentId,
      patientId,
      input.isVerified ? "document.verify" : "document.unverify",
      input.updatedBy || null,
      payload,
    );
  }

  if (input.status && input.status !== existing.document_status) {
    const action = input.status === "Arquivado" ? "document.archive" : existing.document_status === "Arquivado" ? "document.restore" : "document.status_change";
    await logDocumentEvent(documentId, patientId, action, input.updatedBy || null, payload);
  }

  return updated;
}

export type CreateVersionInput = {
  patientId: string;
  documentId: string;
  filePath: string;
  storagePath?: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileHash?: string | null;
  extension: string;
  uploadedBy?: string | null;
  title?: string;
  description?: string | null;
  expiresAt?: string | Date | null;
  isVerified?: boolean;
  signatureType?: string | null;
  signatureDate?: string | Date | null;
  signatureSummary?: string | null;
  externalSignatureId?: string | null;
};

export async function createPatientDocumentVersion(input: CreateVersionInput, client?: SupabaseServerClient) {
  const supabase = await getClient(client);
  const { data: previous, error: prevErr } = await supabase
    .from("patient_documents")
    .select("*")
    .eq("id", input.documentId)
    .maybeSingle();
  if (prevErr || !previous) throw new Error("Documento anterior não encontrado");
  if (previous.patient_id !== input.patientId) throw new Error("Documento não pertence ao paciente informado");

  const payload = {
    ...previous,
    id: undefined,
    patient_id: input.patientId,
    previous_document_id: input.documentId,
    version: (previous.version || 1) + 1,
    file_path: input.filePath,
    storage_path: input.storagePath || input.filePath,
    original_file_name: input.originalFileName,
    file_size_bytes: input.fileSizeBytes,
    mime_type: input.mimeType,
    extension: input.extension,
    file_hash: input.fileHash || null,
    uploaded_at: new Date(),
    uploaded_by: input.uploadedBy || null,
    document_status: DocumentStatusEnum.enum.Ativo,
    deleted_at: null,
    deleted_by: null,
  } as any;

  if (input.title !== undefined && input.title !== "") payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt ? new Date(input.expiresAt) : null;
  if (input.isVerified !== undefined) {
    payload.is_verified = input.isVerified;
    payload.verified_at = input.isVerified ? new Date() : null;
    payload.verified_by = input.isVerified ? input.uploadedBy || null : null;
  }
  if (input.signatureType !== undefined) payload.signature_type = input.signatureType;
  if (input.signatureDate !== undefined) payload.signature_date = input.signatureDate ? new Date(input.signatureDate) : null;
  if (input.signatureSummary !== undefined) payload.signature_summary = input.signatureSummary;
  if (input.externalSignatureId !== undefined) payload.external_signature_id = input.externalSignatureId;

  const parsed = PatientDocumentZ.safeParse(payload);
  if (!parsed.success) throw new Error("Metadados inválidos para nova versão");

  const { data, error } = await supabase.from("patient_documents").insert(parsed.data).select("*").single();
  if (error) throw new Error(error.message);

  await logDocumentEvent(
    data.id,
    input.patientId,
    "document.version_create",
    input.uploadedBy || null,
    { previousId: input.documentId },
    {
      category: data.category,
      domain: data.domain,
      origin_module: data.origin_module,
      document_status: data.document_status,
      version: data.version,
    },
  );

  return data;
}
