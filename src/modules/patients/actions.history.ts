'use server'

import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PatientHistoryItem = {
  id: string;
  action: string; // CREATE, UPDATE...
  entity: string; // Endereço, Clínico...
  description: string; // "Alterou rua..."
  actor_name: string;
  actor_role: string;
  created_at: string;
  time_ago: string;
  changes?: unknown; // O Diff (Antes/Depois)
};

type AuditLogRecord = {
  id: string;
  action: string;
  entity_table: string;
  changes?: unknown;
  reason?: string | null;
  created_at: string;
  actor?:
    | {
        email?: string | null;
        raw_user_meta_data?: Record<string, unknown>;
      }
    | Array<{
        email?: string | null;
        raw_user_meta_data?: Record<string, unknown>;
      }>
    | null;
};

export async function getPatientHistoryAction(patientId: string): Promise<PatientHistoryItem[]> {
  const supabase = await createClient();

  // Busca na tabela MESTRA de auditoria, filtrando pelo paciente
  const { data, error } = await supabase
    .from('system_audit_logs')
    .select(`
      id,
      action,
      entity_table,
      changes,
      reason,
      created_at,
      actor:actor_id (
         email,
         raw_user_meta_data
      )
    `)
    .eq('entity_id', patientId) // <--- Filtra só este paciente
    .in('action', ['CREATE', 'UPDATE', 'DELETE', 'VALIDATE']) // Ignora 'VIEW'/'EXPORT'
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }

  // Formata para a UI
  return (data ?? []).map((log: AuditLogRecord) => {
    // Tenta pegar nome do metadata ou email
    const actor = Array.isArray(log.actor) ? log.actor[0] : log.actor;
    const meta = (actor?.raw_user_meta_data || {}) as Record<string, unknown>;
    const name =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      (actor?.email as string | undefined) ||
      "Sistema";
    const role = (typeof meta.role === "string" && meta.role) || "Usuário";
    
    return {
      id: log.id,
      action: log.action,
      entity: formatEntityName(log.entity_table),
      description: log.reason || formatAutoDescription(log.action, log.entity_table),
      actor_name: name,
      actor_role: role,
      created_at: log.created_at,
      time_ago: formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR }),
      changes: log.changes
    };
  });
}

// Helpers de formatação
function formatEntityName(table: string) {
  const map: Record<string, string> = {
    'patients': 'Cadastro',
    'patient_addresses': 'Endereço',
    'patient_clinical_profiles': 'Prontuário',
    'patient_financial_profiles': 'Financeiro',
    'patient_documents': 'Documentos'
  };
  return map[table] || table;
}

function formatAutoDescription(action: string, table: string) {
  if (action === 'UPDATE') return `Atualizou informações de ${formatEntityName(table)}`;
  if (action === 'CREATE') return `Criou registro de ${formatEntityName(table)}`;
  if (action === 'DELETE') return `Removeu registro de ${formatEntityName(table)}`;
  if (action === 'VALIDATE') return `Validou informações de ${formatEntityName(table)}`;
  return `Realizou ação de ${action}`;
}
