"use server";

import { NextResponse } from "next/server";
import { archiveDocument } from "@/app/(app)/ged/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const res = await archiveDocument(id);
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao arquivar" }, { status: 500 });
  }
}
