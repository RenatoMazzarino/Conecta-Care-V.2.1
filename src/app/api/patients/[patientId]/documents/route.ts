import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPatientDocument, listPatientDocuments } from "@/lib/ged/service";
import { fileHashMd5, parseTagsInput } from "@/lib/ged/utils";
import { DocumentStatusEnum } from "@/data/definitions/documents";

const BUCKET = "patient-documents";

const CreateDocumentSchema = z.object({
  title: z.string().min(2),
  description: z.string().nullable().optional(),
  externalRef: z.string().nullable().optional(),
  category: z.string().min(1),
  domainType: z.string().min(1),
  subcategory: z.string().nullable().optional(),
  originModule: z.string().optional(),
  documentStatus: z.string().optional(),
  confidential: z.boolean().optional(),
  clinicalVisible: z.boolean().optional(),
  adminVisible: z.boolean().optional(),
  minAccessRole: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  publicNotes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  signatureType: z.string().optional(),
  signatureDate: z.string().nullable().optional(),
  signatureSummary: z.string().nullable().optional(),
  externalSignatureId: z.string().nullable().optional(),
  adminContractId: z.string().nullable().optional(),
  financeEntryId: z.string().nullable().optional(),
  clinicalVisitId: z.string().nullable().optional(),
  clinicalEvolutionId: z.string().nullable().optional(),
  prescriptionId: z.string().nullable().optional(),
  relatedObjectId: z.string().nullable().optional(),
  storageProvider: z.string().optional(),
  filePath: z.string().optional(),
  storagePath: z.string().optional(),
  originalFileName: z.string().optional(),
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  fileHash: z.string().nullable().optional(),
});

function parseFilters(searchParams: URLSearchParams) {
  return {
    category: searchParams.get("category") || undefined,
    domain: searchParams.get("domain") || undefined,
    status: searchParams.get("status") || undefined,
    origin: searchParams.get("origin") || undefined,
    text: searchParams.get("text") || undefined,
    tags: searchParams.get("tags") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    subcategory: searchParams.get("subcategory") || undefined,
    minAccessRole: searchParams.get("minAccessRole") || undefined,
    orderBy: (searchParams.get("orderBy") as "uploaded_at" | "title" | "created_at") || undefined,
    orderDir: (searchParams.get("orderDir") as "asc" | "desc") || undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  };
}

async function uploadFileToBucket(supabase: Awaited<ReturnType<typeof createClient>>, patientId: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filePath = `${patientId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return {
    storagePath: filePath,
    filePath,
    originalFileName: file.name,
    mimeType: file.type || "application/octet-stream",
    extension,
    fileSizeBytes: buffer.byteLength,
    fileHash: fileHashMd5(buffer),
  };
}

export async function GET(request: Request, { params }: { params: { patientId: string } }) {
  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    const result = await listPatientDocuments(params.patientId, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao listar documentos" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { patientId: string } }) {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const userId = authUser?.user?.id || null;
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
      const uploadInfo = await uploadFileToBucket(supabase, params.patientId, file);
      const created = await createPatientDocument(
        {
          patientId: params.patientId,
          title: (formData.get("title") as string) || file.name,
          description: (formData.get("description") as string) || null,
          externalRef: (formData.get("external_ref") as string) || null,
          category: (formData.get("category") as string) || "",
          domain: (formData.get("domain") as string) || "Administrativo",
          subcategory: (formData.get("subcategory") as string) || null,
          originModule: (formData.get("origin_module") as string) || undefined,
          documentStatus: (formData.get("document_status") as string) || DocumentStatusEnum.enum.Ativo,
          confidential: formData.get("confidential") === "true",
          clinicalVisible: formData.get("clinical_visible") !== "false",
          adminVisible: formData.get("admin_fin_visible") !== "false",
          minAccessRole: (formData.get("min_access_role") as string) || null,
          tags: parseTagsInput(formData.get("tags") as string | null),
          publicNotes: (formData.get("public_notes") as string) || null,
          internalNotes: (formData.get("internal_notes") as string) || null,
          expiresAt: (formData.get("expires_at") as string) || null,
          isVerified: formData.get("is_verified") === "true",
          signatureType: (formData.get("signature_type") as string) || undefined,
          signatureDate: (formData.get("signature_date") as string) || null,
          signatureSummary: (formData.get("signature_summary") as string) || null,
          externalSignatureId: (formData.get("external_signature_id") as string) || null,
          adminContractId: (formData.get("admin_contract_id") as string) || null,
          financeEntryId: (formData.get("finance_entry_id") as string) || null,
          clinicalVisitId: (formData.get("clinical_visit_id") as string) || null,
          clinicalEvolutionId: (formData.get("clinical_evolution_id") as string) || null,
          prescriptionId: (formData.get("prescription_id") as string) || null,
          relatedObjectId: (formData.get("related_object_id") as string) || null,
          storageProvider: (formData.get("storage_provider") as string) || undefined,
          storagePath: uploadInfo.storagePath,
          filePath: uploadInfo.filePath,
          originalFileName: uploadInfo.originalFileName,
          mimeType: uploadInfo.mimeType,
          extension: uploadInfo.extension,
          fileSizeBytes: uploadInfo.fileSizeBytes,
          fileHash: uploadInfo.fileHash,
          uploadedBy: userId,
        },
        supabase,
      );
      return NextResponse.json({ data: created });
    }

    const json = await request.json();
    const parsed = CreateDocumentSchema.parse(json);
    if (!parsed.filePath && !parsed.storagePath) {
      return NextResponse.json({ error: "Informe filePath ou storagePath" }, { status: 400 });
    }
    const created = await createPatientDocument(
      {
        patientId: params.patientId,
        title: parsed.title,
        description: parsed.description ?? null,
        externalRef: parsed.externalRef ?? null,
        category: parsed.category,
        domain: parsed.domainType,
        subcategory: parsed.subcategory ?? null,
        originModule: parsed.originModule,
        documentStatus: parsed.documentStatus,
        confidential: parsed.confidential,
        clinicalVisible: parsed.clinicalVisible,
        adminVisible: parsed.adminVisible,
        minAccessRole: parsed.minAccessRole ?? null,
        tags: parsed.tags,
        publicNotes: parsed.publicNotes ?? null,
        internalNotes: parsed.internalNotes ?? null,
        expiresAt: parsed.expiresAt ?? null,
        isVerified: parsed.isVerified,
        signatureType: parsed.signatureType,
        signatureDate: parsed.signatureDate ?? null,
        signatureSummary: parsed.signatureSummary ?? null,
        externalSignatureId: parsed.externalSignatureId ?? null,
        adminContractId: parsed.adminContractId ?? null,
        financeEntryId: parsed.financeEntryId ?? null,
        clinicalVisitId: parsed.clinicalVisitId ?? null,
        clinicalEvolutionId: parsed.clinicalEvolutionId ?? null,
        prescriptionId: parsed.prescriptionId ?? null,
        relatedObjectId: parsed.relatedObjectId ?? null,
        storageProvider: parsed.storageProvider,
        storagePath: parsed.storagePath || parsed.filePath!,
        filePath: parsed.filePath || parsed.storagePath!,
        originalFileName: parsed.originalFileName || "",
        mimeType: parsed.mimeType || "application/octet-stream",
        extension: parsed.extension || "bin",
        fileSizeBytes: parsed.fileSizeBytes || 0,
        fileHash: parsed.fileHash || null,
        uploadedBy: userId,
      },
      supabase,
    );
    return NextResponse.json({ data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao criar documento" }, { status: 500 });
  }
}
