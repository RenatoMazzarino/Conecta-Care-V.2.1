'use server';

import { createClient } from "@/lib/supabase/server";

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'PRINT'
  | 'SYSTEM_JOB';

type LogPatientEventInput = {
  patientId: string;
  entityTable: string;
  action: AuditActionType;
  entityId?: string | null;
  reason?: string | null;
  changes?: unknown;
  actorId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Registro manual de auditoria para eventos que não passam por trigger (cliques, exportações, atribuições).
 */
export async function logPatientEvent(input: LogPatientEventInput) {
  const supabase = await createClient();

  const { error } = await supabase.from('system_audit_logs').insert({
    parent_patient_id: input.patientId,
    entity_table: input.entityTable,
    entity_id: input.entityId,
    action: input.action,
    reason: input.reason,
    changes: input.changes,
    actor_id: input.actorId,
    route_path: input.requestId,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  });

  if (error) {
    console.error("Erro ao registrar auditoria manual:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
