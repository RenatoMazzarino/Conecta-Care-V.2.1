import { NextResponse } from "next/server";
import { getDocumentLogs } from "@/app/(app)/ged/actions";

export async function GET(_request: Request, { params }: { params: { patientId: string; documentId: string } }) {
  try {
    const data = await getDocumentLogs(params.documentId);
    const filtered = (data || []).filter((log: any) => log.patient_id ? log.patient_id === params.patientId : true);
    return NextResponse.json({ data: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao carregar auditoria" }, { status: 500 });
  }
}
