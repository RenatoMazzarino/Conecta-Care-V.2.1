"use server";

import { NextResponse } from "next/server";
import { listDocuments } from "@/app/(app)/ged/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, filters } = body || {};
    if (!patientId) return NextResponse.json({ error: "patientId obrigatório" }, { status: 400 });
    const data = await listDocuments(patientId as string, filters);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao listar" }, { status: 500 });
  }
}
