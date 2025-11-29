export type PatientHistoryEvent = {
  id: string;
  occurredAt: string;
  patientId: string;
  module: 'Paciente' | 'Administrativo' | 'Financeiro' | 'Clínico' | 'Estoque' | 'GED' | 'Escala' | 'Sistema';
  action: string;
  source?: {
    entityTable?: string;
    entityId?: string;
    routePath?: string;
    originTab?: string;
  };
  actor?: {
    userId?: string;
    name?: string | null;
    role?: string | null;
  };
  summary: string;
  details?: Record<string, any> | null;
};
