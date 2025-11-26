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
  actor_id?: string | null;
};

export async function getPatientHistoryAction(patientId: string): Promise<PatientHistoryItem[]> {
  const supabase = await createClient();

  // Busca na tabela MESTRA de auditoria, filtrando pelo paciente (parent_patient_id)
  const { data, error } = await supabase
    .from('system_audit_logs')
    .select(`
      id,
      action,
      entity_table,
      changes,
      reason,
      created_at,
      actor_id
    `)
    .eq('parent_patient_id', patientId)
    .order('created_at', { ascending: false });

  let historyRows = data;

  // Fallback: se não houver parent_patient_id, tenta pelo entity_id
  if (!historyRows || historyRows.length === 0) {
    const alt = await supabase
      .from('system_audit_logs')
      .select(`
        id,
        action,
        entity_table,
        changes,
        reason,
        created_at,
        actor_id
      `)
      .eq('entity_id', patientId)
      .order('created_at', { ascending: false });
    historyRows = alt.data || [];
  }

  if (error) {
    console.error("Erro ao buscar histórico:", error);
  }

  if (!historyRows) {
    return [];
  }

  // Formata para a UI
  return historyRows.map((log: AuditLogRecord) => {
    const name = log.actor_id || "Sistema";
    const role = "Usuário";
    
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
