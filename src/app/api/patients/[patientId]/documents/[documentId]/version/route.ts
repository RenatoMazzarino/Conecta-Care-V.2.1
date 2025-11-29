import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPatientDocumentVersion } from "@/lib/ged/service";
import { fileHashMd5 } from "@/lib/ged/utils";

const BUCKET = "patient-documents";

const VersionSchema = z.object({
  filePath: z.string(),
  storagePath: z.string().optional(),
  originalFileName: z.string(),
  mimeType: z.string(),
  extension: z.string(),
  fileSizeBytes: z.number(),
  fileHash: z.string().nullable().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  signatureType: z.string().nullable().optional(),
  signatureDate: z.string().nullable().optional(),
  signatureSummary: z.string().nullable().optional(),
  externalSignatureId: z.string().nullable().optional(),
});

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
    filePath,
    storagePath: filePath,
    originalFileName: file.name,
    mimeType: file.type || "application/octet-stream",
    extension,
    fileSizeBytes: buffer.byteLength,
    fileHash: fileHashMd5(buffer),
  };
}

function extractOverridesFromForm(formData: FormData) {
  const normalize = (value: FormDataEntryValue | null) => {
    if (value === null) return undefined;
    const str = value.toString();
    return str.length ? str : undefined;
  };
  const isVerifiedRaw = formData.get("is_verified");
  let isVerified: boolean | undefined = undefined;
  if (typeof isVerifiedRaw === "string") {
    if (isVerifiedRaw === "true") isVerified = true;
    if (isVerifiedRaw === "false") isVerified = false;
  }
  return {
    title: normalize(formData.get("title")),
    description: normalize(formData.get("description")),
    expiresAt: normalize(formData.get("expires_at")),
    isVerified,
    signatureType: normalize(formData.get("signature_type")),
    signatureDate: normalize(formData.get("signature_date")),
    signatureSummary: normalize(formData.get("signature_summary")),
    externalSignatureId: normalize(formData.get("external_signature_id")),
  };
}

export async function POST(request: Request, { params }: { params: { patientId: string; documentId: string } }) {
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
      const overrides = extractOverridesFromForm(formData);
      const created = await createPatientDocumentVersion(
        {
          patientId: params.patientId,
          documentId: params.documentId,
          filePath: uploadInfo.filePath,
          storagePath: uploadInfo.storagePath,
          originalFileName: uploadInfo.originalFileName,
          mimeType: uploadInfo.mimeType,
          fileSizeBytes: uploadInfo.fileSizeBytes,
          fileHash: uploadInfo.fileHash,
          extension: uploadInfo.extension,
          uploadedBy: userId,
          ...overrides,
        },
        supabase,
      );
      return NextResponse.json({ data: created });
    }

    const json = await request.json();
    const parsed = VersionSchema.parse(json);
    const created = await createPatientDocumentVersion(
      {
        patientId: params.patientId,
        documentId: params.documentId,
        filePath: parsed.filePath,
        storagePath: parsed.storagePath || parsed.filePath,
        originalFileName: parsed.originalFileName,
        mimeType: parsed.mimeType,
        fileSizeBytes: parsed.fileSizeBytes,
        fileHash: parsed.fileHash || null,
        extension: parsed.extension,
        uploadedBy: userId,
        title: parsed.title,
        description: parsed.description ?? undefined,
        expiresAt: parsed.expiresAt ?? undefined,
        isVerified: parsed.isVerified,
        signatureType: parsed.signatureType ?? undefined,
        signatureDate: parsed.signatureDate ?? undefined,
        signatureSummary: parsed.signatureSummary ?? undefined,
        externalSignatureId: parsed.externalSignatureId ?? undefined,
      },
      supabase,
    );
    return NextResponse.json({ data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao criar nova versão" }, { status: 500 });
  }
}
