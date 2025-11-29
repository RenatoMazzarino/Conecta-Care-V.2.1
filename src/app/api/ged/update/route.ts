"use server";

import { NextResponse } from "next/server";
import { updateDocumentMeta } from "@/app/(app)/ged/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body || {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID do documento obrigatório" }, { status: 400 });
    }
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    }
    const result = await updateDocumentMeta(id, data);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Erro ao atualizar" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao atualizar documento" }, { status: 500 });
  }
}
