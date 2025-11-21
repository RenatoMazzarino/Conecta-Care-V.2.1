'use client';

import { FullPatientDetails } from "@/modules/patients/patient.data";

type TabProps = { patient?: FullPatientDetails };

const PlaceholderCard = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
    <p className="mt-2 text-slate-600">{description}</p>
  </div>
);

export function TabPlaceholders({ patient }: TabProps) {
  const birthDate = patient?.date_of_birth ? new Date(patient.date_of_birth) : null;

  return (
    <div className="space-y-4">
      <PlaceholderCard
        title="Anexos e alertas"
        description="Use esta área para anexos, alertas clínicos ou checklists específicos do prontuário."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CPF</p>
          <p className="mt-2 text-lg font-semibold text-[#0F2B45]">{patient?.cpf || "Não informado"}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Data de nascimento</p>
          <p className="mt-2 text-lg font-semibold text-[#0F2B45]">
            {birthDate ? birthDate.toLocaleDateString("pt-BR") : "Sem data"}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
          <p className="mt-2 text-lg font-semibold text-[#0F2B45]">
            {patient?.status || "Ativo"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TabGeneral({ patient }: TabProps) {
  return (
    <div className="space-y-4">
      <PlaceholderCard
        title="Visão geral"
        description="Resumo inicial do paciente. Conecte a dados de admissões, plano de cuidado e alertas rápidos."
      />
      <TabPlaceholders patient={patient} />
    </div>
  );
}

export function TabClinical({ patient }: TabProps) {
  return (
    <div className="space-y-4">
      <PlaceholderCard
        title="Dados clínicos"
        description="Traga alergias, diagnósticos e plano terapêutico diretamente das tabelas clínicas."
      />
      <TabPlaceholders patient={patient} />
    </div>
  );
}

export function TabTeam() {
  return (
    <PlaceholderCard
      title="Rede de apoio"
      description="Associe responsáveis, cuidadores e profissionais do time a este prontuário."
    />
  );
}

export function TabInventory() {
  return (
    <PlaceholderCard
      title="Estoque e entregas"
      description="Conecte aos registros de estoque domiciliar, kits de curativo e logs de entrega."
    />
  );
}

export function TabAdministrative() {
  return (
    <PlaceholderCard
      title="Administrativo"
      description="Espaço para autorizações, contratos e registros de cobrança ligados ao paciente."
    />
  );
}

export function TabDocuments() {
  return (
    <PlaceholderCard
      title="Documentos"
      description="Faça upload ou referencie documentos no storage do Supabase."
    />
  );
}

export function TabHistory() {
  return (
    <PlaceholderCard
      title="Histórico"
      description="Linha do tempo de atendimentos, visitas e atualizações de status."
    />
  );
}
