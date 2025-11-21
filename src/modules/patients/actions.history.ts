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
  changes?: any; // O Diff (Antes/Depois)
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
  return (data ?? []).map((log: any) => {
    // Tenta pegar nome do metadata ou email
    const meta = log.actor?.raw_user_meta_data || {};
    const name = meta.full_name || meta.name || log.actor?.email || 'Sistema';
    
    return {
      id: log.id,
      action: log.action,
      entity: formatEntityName(log.entity_table),
      description: log.reason || formatAutoDescription(log.action, log.entity_table),
      actor_name: name,
      actor_role: meta.role || 'Usuário',
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
