import { NextResponse } from "next/server";
import { getProfessionalsList } from "@/app/(app)/patients/actions.support";

export async function GET() {
  const list = await getProfessionalsList();
  return NextResponse.json(list);
}
