import { NextResponse } from "next/server";
import { getPatientClinicalDashboard } from "@/modules/patients/clinical-dashboard.data";

export async function GET(_: Request, { params }: { params: { patientId: string } }) {
  try {
    const dashboard = await getPatientClinicalDashboard(params.patientId);
    return NextResponse.json({ data: dashboard });
  } catch (error) {
    console.error("clinical-dashboard", error);
    return NextResponse.json({ error: "Falha ao carregar resumo clínico" }, { status: 500 });
  }
}
