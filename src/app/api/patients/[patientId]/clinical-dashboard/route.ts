import { NextResponse } from "next/server";
import { getPatientClinicalDashboard } from "@/modules/patients/clinical-dashboard.data";

export async function GET(_: Request, context: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await context.params;
    const dashboard = await getPatientClinicalDashboard(patientId);
    return NextResponse.json({ data: dashboard });
  } catch (error) {
    console.error("clinical-dashboard", error);
    return NextResponse.json({ error: "Falha ao carregar resumo clínico" }, { status: 500 });
  }
}
