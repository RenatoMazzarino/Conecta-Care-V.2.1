"use server";

import { NextResponse } from "next/server";
import { uploadDocument } from "@/app/(app)/ged/actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const res = await uploadDocument(formData);
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao fazer upload" }, { status: 500 });
  }
}
