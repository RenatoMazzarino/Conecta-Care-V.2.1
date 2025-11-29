import { NextResponse } from "next/server";
import { getDocumentVersions } from "@/app/(app)/ged/actions";

export async function GET(_request: Request, { params }: { params: { patientId: string; documentId: string } }) {
  try {
    const data = await getDocumentVersions(params.documentId);
    const filtered = (data || []).filter((doc: any) => doc.patient_id === params.patientId);
    return NextResponse.json({ data: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao carregar versões" }, { status: 500 });
  }
}
