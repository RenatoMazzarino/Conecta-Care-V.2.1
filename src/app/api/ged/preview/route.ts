"use server";

import { NextResponse } from "next/server";
import { generatePreviewUrl } from "@/app/(app)/ged/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storagePath, documentId, action } = body || {};
    if (!storagePath) return NextResponse.json({ error: "storagePath obrigatório" }, { status: 400 });
    const res = await generatePreviewUrl(storagePath, { documentId, action });
    if (!res.success) return NextResponse.json({ error: res.error || "Erro ao gerar URL" }, { status: 400 });
    return NextResponse.json({ url: res.url });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao gerar URL" }, { status: 500 });
  }
}
