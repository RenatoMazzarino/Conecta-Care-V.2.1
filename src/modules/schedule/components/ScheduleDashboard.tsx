"use client";

import * as React from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Moon,
  Plus,
  Sun,
  UsersThree as Users,
  IconProps,
  Funnel,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShiftMonitorSheet } from './ShiftMonitorSheet';
import { ShiftMonitorDataDTO } from '@/data/definitions/schedule';
import { getScheduleGrid, getShiftDetails } from '../actions';
import {
  STATUS_CLASSES,
  getInitials,
  type WeekDay,
  type ScheduleSlot,
  type ScheduleRow,
} from '../utils';

type VacancyContext = {
  shiftId: string;
  patientId: string;
  patientName: string;
  shiftType: 'day' | 'night';
  dayLabel: string;
  caution?: string;
  candidateCount?: number;
};

type PeriodFilter = 7 | 15 | 30;

function CommandBarButton({
  icon: Icon,
  label,
  accent,
}: {
  icon: React.ComponentType<IconProps>;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition',
        'hover:bg-slate-100 hover:text-[#0F2B45]',
        accent && 'text-[#D46F5D] font-bold'
      )}
    >
      <Icon className={cn('h-4 w-4', accent && 'text-[#D46F5D]')} />
      {label}
    </button>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      {label}
    </span>
  );
}

function renderSlotCard(
  slot: ScheduleSlot,
  day: WeekDay,
  patientName: string,
  patientId: string,
  onClick: (slot: ScheduleSlot, patientName: string, patientId: string, day: WeekDay) => void,
) {
  const baseIcon = slot.shiftType === 'day' ? Sun : Moon;
  const professionalName = slot.professional?.name ?? 'Folguista';
  const showAction = ['live', 'warning', 'open', 'open-candidates', 'critical'].includes(slot.status);

  const actionLabel =
    slot.status === 'live' ? 'Monitorar' : slot.status === 'critical' ? 'Alocar' : slot.status === 'warning' ? 'Resolver' : 'Gerenciar';

  return (
    <div
      onClick={() => onClick(slot, patientName, patientId, day)}
      className={cn(
        'space-y-1 rounded border bg-white px-3 py-2 text-left text-xs shadow-sm transition cursor-pointer h-full min-h-[80px]',
        'hover:-translate-y-0.5 hover:shadow-md',
        STATUS_CLASSES[slot.status]
      )}
    >
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase">
        <span className="flex items-center gap-1">
          {React.createElement(baseIcon, { className: 'h-3 w-3 text-slate-500' })}
          {slot.shiftType === 'day' ? '07h-19h' : '19h-07h'}
        </span>
        {slot.checkIn && <span className="text-slate-400">{slot.checkIn}</span>}
        {slot.candidateCount ? (
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-[9px] font-bold text-orange-700">
            {slot.candidateCount}
          </Badge>
        ) : null}
      </div>

      <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
        {slot.status === 'open'
          ? 'Vaga aberta'
          : slot.status === 'open-candidates'
          ? 'Candidatos disp.'
          : slot.status === 'critical'
          ? 'SEM COBERTURA'
          : professionalName}
      </p>

      {slot.caution && <p className="text-[10px] font-semibold text-amber-600 truncate">{slot.caution}</p>}

      {showAction && (
        <button
          type="button"
          className={cn(
            'mt-1 w-full rounded border text-[10px] py-1 font-semibold transition',
            slot.status === 'live'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : slot.status === 'critical'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          )}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ScheduleDashboard() {
  const [anchorDate, setAnchorDate] = React.useState(new Date());

  const [periodDays, setPeriodDays] = React.useState<PeriodFilter>(7);

  const [rows, setRows] = React.useState<ScheduleRow[]>([]);
  const [weekDays, setWeekDays] = React.useState<WeekDay[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [monitorData, setMonitorData] = React.useState<ShiftMonitorDataDTO | undefined>();
  const [isMonitorOpen, setIsMonitorOpen] = React.useState(false);
  const [vacancyContext, setVacancyContext] = React.useState<VacancyContext | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      const start = periodDays === 7 ? startOfWeek(anchorDate, { weekStartsOn: 1 }) : anchorDate;

      const data = await getScheduleGrid(start, periodDays);

      const generatedDays = Array.from({ length: periodDays }, (_, index) => {
        const date = addDays(start, index);
        return {
          key: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3),
          dateLabel: format(date, 'dd'),
          isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
          isWeekend: [0, 6].includes(date.getDay()),
          fullDate: date,
        };
      });

      setRows(data);
      setWeekDays(generatedDays);
      setIsLoading(false);
    }

    fetchData();
  }, [anchorDate, periodDays]);

  function handleNavigate(direction: 'prev' | 'next') {
    setAnchorDate((prev) => addDays(prev, direction === 'next' ? periodDays : -periodDays));
  }

  async function handleSlotClick(slot: ScheduleSlot, patientName: string, patientId: string, day: WeekDay) {
    if (['live', 'planned', 'warning', 'completed'].includes(slot.status)) {
      // Open sheet optimistically and clear previous data
      setIsMonitorOpen(true);
      setMonitorData(undefined);

      // Fetch real details from the server
      try {
        const details = await getShiftDetails(slot.id);
        if (details) {
          setMonitorData(details);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do plantão', err);
      }

    } else if (['open', 'open-candidates', 'critical'].includes(slot.status)) {
      setVacancyContext({
        shiftId: slot.id,
        patientId,
        patientName,
        shiftType: slot.shiftType,
        dayLabel: `${day.label} ${day.dateLabel}`,
        caution: slot.caution,
        candidateCount: slot.candidateCount,
      });
    }
  }

  return (
    <div className="space-y-4 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operação • Escala assistencial</p>
          <h1 className="text-3xl font-semibold text-[#0F2B45]">Central de Plantões</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {[7, 15, 30].map((days) => (
              <Button
                key={days}
                variant="ghost"
                size="sm"
                onClick={() => setPeriodDays(days as PeriodFilter)}
                className={cn(
                  'h-7 text-xs font-semibold px-3',
                  periodDays === days ? 'bg-slate-100 text-[#0F2B45]' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {days} dias
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button onClick={() => handleNavigate('prev')} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3 text-sm font-semibold text-[#0F2B45]">
              <Calendar className="h-4 w-4" />
              <span>{format(anchorDate, 'dd MMM', { locale: ptBR })}</span>
              <span className="text-slate-300">-</span>
              <span>{format(addDays(anchorDate, periodDays - 1), 'dd MMM', { locale: ptBR })}</span>
            </div>
            <button onClick={() => handleNavigate('next')} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="sticky top-4 z-20 rounded-lg border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur flex justify-between">
        <div className="flex gap-2">
          <CommandBarButton icon={Plus} label="Nova Vaga" accent />
          <div className="h-5 w-px bg-slate-200 mx-2" />
          <CommandBarButton icon={Users} label="Filtrar" />
          <CommandBarButton icon={Funnel} label="Avançado" />
        </div>
        <div className="flex gap-4 text-xs items-center text-slate-500">
          <LegendDot className="bg-emerald-500" label="Ao Vivo" />
          <LegendDot className="bg-rose-500" label="Crítico" />
          <LegendDot className="bg-slate-300" label="Aberto" />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,43,69,0.08)]">
        <div className="relative overflow-auto">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">Carregando escala...</div>
          ) : (
            <div style={{ minWidth: `${280 + periodDays * 140}px` }}>
              <div
                className="grid border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                style={{ gridTemplateColumns: `280px repeat(${periodDays}, 1fr)` }}
              >
                <div className="border-r border-slate-200 px-4 py-3 sticky left-0 bg-slate-50 z-10">Paciente / Contrato</div>
                {weekDays.map((day) => (
                  <div
                    key={day.key}
                    className={cn('border-r border-slate-200 px-2 py-2 text-center', day.isToday && 'bg-blue-50 text-[#0F2B45] border-b-2 border-b-[#0F2B45]', day.isWeekend && 'bg-slate-100')}
                  >
                    {day.label} <span className="text-slate-400">{day.dateLabel}</span>
                  </div>
                ))}
              </div>

              {rows.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Nenhum paciente ativo encontrado.</div>
              ) : (
                rows.map((row) => (
                  <div key={row.id} className="group grid border-b border-slate-100 hover:bg-slate-50" style={{ gridTemplateColumns: `280px repeat(${periodDays}, 1fr)` }}>
                    <div className="sticky left-0 z-10 flex items-center gap-3 border-r border-slate-100 bg-white px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)]">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold', row.badge)}>{getInitials(row.patientName)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F2B45] truncate">{row.patientName}</p>
                        <p className="text-xs text-slate-500 truncate">{row.contract}</p>
                        <div className="mt-1 flex flex-wrap gap-1">{row.tags?.slice(0, 2).map((tag) => (<span key={tag} className="rounded border bg-slate-50 px-1 text-[9px]">{tag}</span>))}</div>
                      </div>
                    </div>

                    {weekDays.map((day) => {
                      const daySlots = row.slots[day.key] || { day: { status: 'planned', shiftType: 'day', id: '' }, night: { status: 'planned', shiftType: 'night', id: '' } };
                      return (
                        <div key={`${row.id}-${day.key}`} className={cn('border-r border-slate-100 p-1 space-y-1', day.isWeekend && 'bg-slate-50/70')}>
                          {renderSlotCard(daySlots.day, day, row.patientName, row.patientId, handleSlotClick)}
                          {renderSlotCard(daySlots.night, day, row.patientName, row.patientId, handleSlotClick)}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <ShiftMonitorSheet open={isMonitorOpen} onOpenChange={setIsMonitorOpen} data={monitorData} />

      <Dialog open={Boolean(vacancyContext)} onOpenChange={(open: boolean) => !open && setVacancyContext(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Vaga</DialogTitle>
            <DialogDescription>Em breve: Alocação para {vacancyContext?.patientName}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
