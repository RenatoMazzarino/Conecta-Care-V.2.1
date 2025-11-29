'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Patient, SystemAuditLog } from '@/lib/types';
import { getPatientAuditLogs } from '@/app/(app)/patients/[patientId]/actions.getAuditLogs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Eye,
  PencilSimpleLine,
  Trash,
  PlusCircle,
  WarningCircle,
  ArrowsLeftRight,
  User,
  ShieldCheck,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type TabHistoryAuditProps = {
  patient: Patient; // Mantido para compatibilidade, mas usaremos fetch real
};

// Mapa de cores e ícones para as ações do banco
const ACTION_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  INSERT: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: PlusCircle, label: 'Criação' },
  UPDATE: { color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: PencilSimpleLine, label: 'Edição' },
  DELETE: { color: 'text-rose-600 bg-rose-50 border-rose-200', icon: Trash, label: 'Exclusão' },
  default: { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Eye, label: 'Evento' },
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
};

// Formata o nome da tabela para algo legível
const formatEntityName = (table: string) => {
  const map: Record<string, string> = {
    patients: 'Dados Pessoais',
    patient_addresses: 'Endereço',
    patient_clinical_summaries: 'Resumo Clínico',
    patient_financial_profiles: 'Perfil Financeiro',
    patient_documents: 'Documentos',
    patient_admin_info: 'Dados Administrativos',
  };
  return map[table] || table;
};

export function TabHistoryAudit({ patient }: TabHistoryAuditProps) {
  const params = useParams();
  const toast = useToast();
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  void patient;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const patientId = params.patientId as string;
        if (!patientId) return;
        
        const data = await getPatientAuditLogs(patientId);
        setLogs(data);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar auditoria");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [params.patientId, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-fluent border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Trilha de Auditoria Segura
          </CardTitle>
          <CardDescription>
            Registro imutável de todas as alterações realizadas neste prontuário e sub-registos.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="relative border-l border-slate-200 pl-8 ml-4 space-y-8">
        {logs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <WarningCircle size={32} className="mx-auto mb-2 opacity-50" />
            Nenhuma atividade registrada no sistema de auditoria até o momento.
          </div>
        ) : (
          logs.map((log) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.default;
            const Icon = config.icon;

            // Tenta processar o JSONB de mudanças
            // O formato depende do trigger: UPDATE geralmente traz keys que mudaram
            const changes = log.changes || {};
            const hasChanges = Object.keys(changes).length > 0;

            return (
              <div key={log.id} className="relative">
                {/* Ícone da Timeline */}
                <span className="absolute -left-[44px] top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm text-slate-500">
                  <Icon size={16} />
                </span>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("capitalize", config.color)}>
                        {config.label}
                      </Badge>
                      <span className="font-semibold text-slate-700">
                        {formatEntityName(log.entity_table)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={14} />
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>

                  {/* Detalhes do Autor */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 border-b border-slate-100 pb-2">
                    <User size={14} />
                    <span>Feito por ID: <code className="bg-slate-100 px-1 rounded">{log.actor_id || 'Sistema'}</code></span>
                  </div>

                  {/* Área de Diff (Mudanças) */}
                  {hasChanges && (
                    <div className="bg-slate-50 rounded-md p-3 text-xs overflow-x-auto">
                       <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center min-w-[300px]">
                          <div className="font-mono text-slate-500 text-center border-b pb-1 mb-1">Campo</div>
                          <div className="text-center border-b pb-1 mb-1"></div>
                          <div className="font-mono text-slate-700 text-center border-b pb-1 mb-1">Valor Registado</div>

                          {Object.entries(changes).map(([key, value]) => (
                            <div key={key} className="contents group hover:bg-slate-100">
                              <span className="font-medium text-slate-600 truncate p-1">{key}</span>
                              <ArrowsLeftRight size={12} className="text-slate-300 mx-auto" />
                              <span className="font-mono text-slate-800 truncate p-1">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
