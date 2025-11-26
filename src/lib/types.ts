// Tipagens globais auxiliares

export type Patient = {
  id: string;
  full_name?: string | null;
  cpf?: string | null;
  status?: string | null;
};

// INTEGRATION & LOGGING TABLES
export type SystemAuditLog = {
  id: string; // uuid
  entity_table: string;
  entity_id: string; // uuid
  parent_patient_id?: string | null; // uuid
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  changes: Record<string, any> | null; // JSONB
  actor_id?: string | null; // uuid
  created_at: string; // timestamptz
  tenant_id?: string | null;
};
