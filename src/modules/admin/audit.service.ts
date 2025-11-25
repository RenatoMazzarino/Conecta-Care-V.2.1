'use server';

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type AuditLogParams = {
  action: 'LOGIN' | 'LOGOUT' | 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PRINT';
  entity: string; // Ex: 'patients', 'patient_addresses'
  entityId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>; // Diff mínimo
  reason?: string;
};

// Centraliza a escrita de auditoria para ser chamada pelas server actions.
export async function logSystemAction(params: AuditLogParams) {
  try {
    const supabase = await createClient();
    const headerList = await headers();

    const ip =
      headerList.get("x-forwarded-for") ||
      headerList.get("x-real-ip") ||
      "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";
    const path = headerList.get("referer") || "/";

    const { data: { user } = { user: null } } = await supabase.auth.getUser();

    await supabase.from("system_audit_logs").insert({
      actor_id: user?.id ?? null,
      ip_address: ip,
      user_agent: userAgent,
      action: params.action,
      entity_table: params.entity,
      entity_id: params.entityId,
      changes: params.changes ?? null,
      reason: params.reason,
      route_path: path,
    });
  } catch (err) {
    // Não bloqueia o fluxo principal; apenas loga para diagnóstico.
    console.error("Erro ao gravar auditoria:", err);
  }
}
