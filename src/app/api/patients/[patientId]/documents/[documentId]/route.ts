import { NextResponse } from "next/server";
import { z } from "zod";
import { getDocumentDetails } from "@/app/(app)/ged/actions";
import { logDocumentEvent } from "@/lib/ged/logging";
import { createClient } from "@/lib/supabase/server";
import { updatePatientDocument } from "@/lib/ged/service";

const UpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  externalRef: z.string().nullable().optional(),
  status: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  isVisibleAdmin: z.boolean().optional(),
  isVisibleClinical: z.boolean().optional(),
  isConfidential: z.boolean().optional(),
  minAccessRole: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  publicNotes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  signatureType: z.string().nullable().optional(),
  signatureDate: z.string().nullable().optional(),
  signatureSummary: z.string().nullable().optional(),
  externalSignatureId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  domain: z.string().optional(),
  originModule: z.string().optional(),
  subcategory: z.string().nullable().optional(),
  adminContractId: z.string().nullable().optional(),
  financeEntryId: z.string().nullable().optional(),
  clinicalVisitId: z.string().nullable().optional(),
  clinicalEvolutionId: z.string().nullable().optional(),
  prescriptionId: z.string().nullable().optional(),
  relatedObjectId: z.string().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: { patientId: string; documentId: string } }) {
  try {
    const data = await getDocumentDetails(params.documentId);
    if (!data) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    if (data.patient_id !== params.patientId) {
      return NextResponse.json({ error: "Documento não pertence ao paciente informado" }, { status: 403 });
    }
    const supabase = await createClient();
    const { data: authUser } = await supabase.auth.getUser();
    await logDocumentEvent(params.documentId, params.patientId, "document.view", authUser?.user?.id || null, { via: "details-endpoint" });
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao carregar documento" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { patientId: string; documentId: string } }) {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const userId = authUser?.user?.id || null;
  try {
    const json = await request.json();
    const parsed = UpdateSchema.parse(json);
    const result = await updatePatientDocument(
      params.patientId,
      params.documentId,
      {
        title: parsed.title,
        description: parsed.description ?? undefined,
        externalRef: parsed.externalRef ?? undefined,
        status: parsed.status,
        expiresAt: parsed.expiresAt ?? undefined,
        isVisibleAdmin: parsed.isVisibleAdmin,
        isVisibleClinical: parsed.isVisibleClinical,
        isConfidential: parsed.isConfidential,
        minAccessRole: parsed.minAccessRole ?? undefined,
        isVerified: parsed.isVerified,
        publicNotes: parsed.publicNotes ?? undefined,
        internalNotes: parsed.internalNotes ?? undefined,
        signatureType: parsed.signatureType ?? undefined,
        signatureDate: parsed.signatureDate ?? undefined,
        signatureSummary: parsed.signatureSummary ?? undefined,
        externalSignatureId: parsed.externalSignatureId ?? undefined,
        tags: parsed.tags,
        category: parsed.category,
        domain: parsed.domain,
        originModule: parsed.originModule,
        subcategory: parsed.subcategory ?? undefined,
        adminContractId: parsed.adminContractId ?? undefined,
        financeEntryId: parsed.financeEntryId ?? undefined,
        clinicalVisitId: parsed.clinicalVisitId ?? undefined,
        clinicalEvolutionId: parsed.clinicalEvolutionId ?? undefined,
        prescriptionId: parsed.prescriptionId ?? undefined,
        relatedObjectId: parsed.relatedObjectId ?? undefined,
        updatedBy: userId,
      },
      supabase,
    );
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao atualizar documento" }, { status: 400 });
  }
}
