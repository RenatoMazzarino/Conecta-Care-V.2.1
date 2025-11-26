'use server';

import { createSupabaseServerClient } from '@/server/supabaseServerClient';
import type { SystemAuditLog } from '@/lib/types';

export async function getPatientAuditLogs(patientId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('system_audit_logs')
    .select('*')
    .or(`entity_id.eq.${patientId},parent_patient_id.eq.${patientId}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Erro ao buscar auditoria:', error);
    return [];
  }

  return data as SystemAuditLog[];
}
