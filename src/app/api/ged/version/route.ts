"use server";

import { NextResponse } from "next/server";
import { newDocumentVersion } from "@/app/(app)/ged/actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const previousId = formData.get("previous_id") as string | null;
    if (!previousId) return NextResponse.json({ error: "previous_id obrigatório" }, { status: 400 });
    const res = await newDocumentVersion(previousId, formData);
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao criar versão" }, { status: 500 });
  }
}
