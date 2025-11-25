'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Heartbeat,
  Bed,
  CurrencyDollar,
  WarningOctagon,
  Funnel,
  CaretDown,
  CaretUp,
  FirstAidKit,
  Buildings,
  GenderIntersex,
  Stethoscope,
  MapPin,
  UserGear,
  Tag
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComponentType } from "react";
import { IconProps } from "@phosphor-icons/react";

type StatFilterCardProps = {
  label: string;
  count: number;
  icon: ComponentType<IconProps>;
  active: boolean;
  onClick: () => void;
  colorClass: string;
  borderClass: string;
};

// Card KPI estilo Fluent (borda lateral colorida)
function StatFilterCard({ label, count, icon: Icon, active, onClick, colorClass, borderClass }: StatFilterCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-md border bg-white cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md",
        active
          ? `border-${colorClass}-500 ring-1 ring-${colorClass}-500`
          : "border-slate-200 hover:border-slate-300",
        borderClass
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
          {label}
        </p>
        <Icon
          weight={active ? "fill" : "duotone"}
          className={cn("text-xl transition-transform group-hover:scale-110", `text-${colorClass}-600`)}
        />
      </div>
      <p className={cn("text-2xl font-bold leading-none", active ? "text-slate-900" : "text-slate-700")}>
        {count}
      </p>
    </div>
  );
}

type PatientStats = {
  total: number;
  active: number;
  hospitalized: number;
  highComplexity?: number;
  financialPending?: number;
};

export function PatientStatsFilters({
  stats,
  contractors = [],
}: {
  stats: PatientStats;
  contractors?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentStatus = searchParams.get('status') || 'all';
  const currentComplexity = searchParams.get('complexity') || 'all';
  const currentFinancial = searchParams.get('billingStatus') || 'all';
  const currentContractor = searchParams.get('contractorId') || 'all';
  const currentCity = searchParams.get('city') || '';
  const currentNeighborhood = searchParams.get('neighborhood') || '';
  const currentZone = searchParams.get('zoneType') || 'all';
  const currentDiagnosis = searchParams.get('diagnosis') || '';
  const currentAdmission = searchParams.get('admissionType') || 'all';
  const currentSupervisor = searchParams.get('supervisor') || '';
  const currentClinicalTag = searchParams.get('clinicalTag') || '';
  const currentGender = searchParams.get('gender') || 'all';
  const currentAgeMin = searchParams.get('ageMin') || '';
  const currentAgeMax = searchParams.get('ageMax') || '';
  const currentBondType = searchParams.get('bondType') || 'all';
  const currentPaymentMethod = searchParams.get('paymentMethod') || '';
  const currentContractStatus = searchParams.get('contractStatus') || 'all';
  const currentRiskBradenMin = searchParams.get('riskBradenMin') || '';
  const currentRiskBradenMax = searchParams.get('riskBradenMax') || '';
  const currentRiskMorseMin = searchParams.get('riskMorseMin') || '';
  const currentRiskMorseMax = searchParams.get('riskMorseMax') || '';
  const currentOxygen = searchParams.get('oxygenUsage') || 'all';
  const currentSearch = searchParams.get('q') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatFilterCard
          label="Total Ativos"
          count={stats.active ?? stats.total ?? 0}
          icon={Heartbeat}
          active={currentStatus === 'active'}
          onClick={() => updateFilter('status', currentStatus === 'active' ? 'all' : 'active')}
          colorClass="emerald"
          borderClass="border-l-4 border-l-emerald-500"
        />
        <StatFilterCard
          label="Internados"
          count={stats.hospitalized ?? 0}
          icon={Bed}
          active={currentStatus === 'hospitalized'}
          onClick={() => updateFilter('status', currentStatus === 'hospitalized' ? 'all' : 'hospitalized')}
          colorClass="purple"
          borderClass="border-l-4 border-l-purple-500"
        />
        <StatFilterCard
          label="Alta Complex."
          count={stats.highComplexity ?? 0}
          icon={WarningOctagon}
          active={currentComplexity === 'high'}
          onClick={() => updateFilter('complexity', currentComplexity === 'high' ? 'all' : 'high')}
          colorClass="rose"
          borderClass="border-l-4 border-l-rose-500"
        />
        <StatFilterCard
          label="Financeiro"
          count={stats.financialPending ?? 0}
          icon={CurrencyDollar}
          active={currentFinancial === 'defaulting'}
          onClick={() => updateFilter('billingStatus', currentFinancial === 'defaulting' ? 'all' : 'defaulting')}
          colorClass="amber"
          borderClass="border-l-4 border-l-amber-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded border",
            isOpen ? "border-[#0F2B45] text-[#0F2B45] bg-blue-50" : "border-slate-200 text-slate-600 hover:border-[#0F2B45]"
          )}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Funnel size={16} weight="bold" />
          Filtros Avançados
          {isOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><Heartbeat weight="bold" /> Status</label>
              <Select value={currentStatus} onValueChange={(v) => updateFilter('status', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="hospitalized">Internado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><FirstAidKit weight="bold" /> Complexidade</label>
              <Select value={currentComplexity} onValueChange={(v) => updateFilter('complexity', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><CurrencyDollar weight="bold" /> Financeiro</label>
              <Select value={currentFinancial} onValueChange={(v) => updateFilter('billingStatus', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Em dia</SelectItem>
                  <SelectItem value="defaulting">Pendente</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><Buildings weight="bold" /> Operadora</label>
              <Select value={currentContractor} onValueChange={(v) => updateFilter('contractorId', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><GenderIntersex weight="bold" /> Gênero</label>
              <Select value={currentGender} onValueChange={(v) => updateFilter('gender', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="Other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><MapPin weight="bold" /> Cidade</label>
              <input
                defaultValue={currentCity}
                onBlur={(e) => updateFilter('city', e.target.value)}
                placeholder="Cidade"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Bairro</label>
              <input
                defaultValue={currentNeighborhood}
                onBlur={(e) => updateFilter('neighborhood', e.target.value)}
                placeholder="Bairro"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Zona</label>
              <Select value={currentZone} onValueChange={(v) => updateFilter('zoneType', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Urbana">Urbana</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                  <SelectItem value="Comunidade">Comunidade</SelectItem>
                  <SelectItem value="Risco">Risco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><Stethoscope weight="bold" /> Diagnóstico</label>
              <input
                defaultValue={currentDiagnosis}
                onBlur={(e) => updateFilter('diagnosis', e.target.value)}
                placeholder="CID ou texto"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><Tag weight="bold" /> Tag Clínica</label>
              <input
                defaultValue={currentClinicalTag}
                onBlur={(e) => updateFilter('clinicalTag', e.target.value)}
                placeholder="Ex: GTT, TQT"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Tipo de Admissão</label>
              <Select value={currentAdmission} onValueChange={(v) => updateFilter('admissionType', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="home_care">Home Care</SelectItem>
                  <SelectItem value="paliativo">Paliativo</SelectItem>
                  <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                  <SelectItem value="procedimento_pontual">Procedimento Pontual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase flex items-center gap-1"><UserGear weight="bold" /> Supervisor</label>
              <input
                defaultValue={currentSupervisor}
                onBlur={(e) => updateFilter('supervisor', e.target.value)}
                placeholder="Nome do supervisor"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Idade mínima</label>
              <input
                defaultValue={currentAgeMin}
                type="number"
                min={0}
                onBlur={(e) => updateFilter('ageMin', e.target.value)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Idade máxima</label>
              <input
                defaultValue={currentAgeMax}
                type="number"
                min={0}
                onBlur={(e) => updateFilter('ageMax', e.target.value)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Vínculo</label>
              <Select value={currentBondType} onValueChange={(v) => updateFilter('bondType', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Plano de Saúde">Plano de Saúde</SelectItem>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Convênio">Convênio</SelectItem>
                  <SelectItem value="Público">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Forma de Pagamento</label>
              <input
                defaultValue={currentPaymentMethod}
                onBlur={(e) => updateFilter('paymentMethod', e.target.value)}
                placeholder="Boleto, PIX..."
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Status Contrato</label>
              <Select value={currentContractStatus} onValueChange={(v) => updateFilter('contractStatus', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="negotiating">Em negociação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Braden mín/máx</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  defaultValue={currentRiskBradenMin}
                  type="number"
                  min={0}
                  onBlur={(e) => updateFilter('riskBradenMin', e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
                />
                <input
                  defaultValue={currentRiskBradenMax}
                  type="number"
                  min={0}
                  onBlur={(e) => updateFilter('riskBradenMax', e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Morse mín/máx</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  defaultValue={currentRiskMorseMin}
                  type="number"
                  min={0}
                  onBlur={(e) => updateFilter('riskMorseMin', e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
                />
                <input
                  defaultValue={currentRiskMorseMax}
                  type="number"
                  min={0}
                  onBlur={(e) => updateFilter('riskMorseMax', e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Oxigenoterapia</label>
              <Select value={currentOxygen} onValueChange={(v) => updateFilter('oxygenUsage', v)}>
                <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Utiliza</SelectItem>
                  <SelectItem value="no">Não utiliza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase">Busca geral</label>
              <input
                defaultValue={currentSearch}
                onBlur={(e) => updateFilter('q', e.target.value)}
                placeholder="Nome, CPF..."
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
