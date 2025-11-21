// src/modules/schedule/utils.ts
import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar } from '@phosphor-icons/react'; // Ícones usados no payload

// =================================================================
// DEFINIÇÕES DE TIPAGEM (REPLICADAS DO ARQUIVO ANTIGO)
// =================================================================

export type ScheduleSlotStatus =
  | 'completed'
  | 'live'
  | 'planned'
  | 'warning'
  | 'open'
  | 'open-candidates'
  | 'critical'
  | 'backup';

export type WeekDay = {
  key: string;
  label: string;
  dateLabel: string;
  isToday: boolean;
  isWeekend: boolean;
  fullDate: Date;
};

export type ProfessionalRef = {
  name: string;
  role?: string;
  avatarUrl?: string;
  phone?: string;
};

export type ScheduleSlot = {
  id: string;
  shiftType: 'day' | 'night';
  status: ScheduleSlotStatus;
  professional?: ProfessionalRef;
  checkIn?: string;
  candidateCount?: number;
  caution?: string;
};

export type ScheduleRow = {
  id: string;
  patientId: string;
  patientName: string;
  contract: string;
  tags?: string[];
  badge: string;
  slots: Record<string, { day: ScheduleSlot; night: ScheduleSlot }>;
};

// =================================================================
// DADOS MOCKADOS E CONSTANTES
// =================================================================

const baseDayProfessional: ProfessionalRef = {
  name: 'Ana Silva',
  role: 'Téc. Enfermagem',
  phone: '+551199887766',
};

const baseNightProfessional: ProfessionalRef = {
  name: 'Carla Dias',
  role: 'Enfermeira',
  phone: '+551199881234',
};

// Mapeamento de estilos (usado pelo componente principal)
export const STATUS_CLASSES: Record<ScheduleSlotStatus, string> = {
  completed: 'border-l-slate-400 text-slate-600 bg-white/80',
  live: 'border-l-emerald-500 ring-1 ring-emerald-100 text-slate-900',
  planned: 'border-l-blue-500 text-slate-800',
  warning: 'border-l-amber-500 bg-amber-50/70 text-amber-800',
  open: 'border-l-slate-300 bg-slate-50/70 text-slate-600',
  'open-candidates': 'border-l-orange-500 bg-orange-50/70 text-orange-700',
  critical: 'border-l-rose-500 bg-rose-50/70 text-rose-800', // Adicionei cores para Critical
  backup: 'border-l-slate-300 bg-white/40 text-slate-500',
};


// =================================================================
// FUNÇÕES DE CÁLCULO
// =================================================================

/** Gera os 7 dias da semana a partir de uma data âncora */
export function buildWeekDays(anchor: Date): WeekDay[] {
  // Começa a semana na segunda-feira (weekStartsOn: 1)
  const start = startOfWeek(anchor, { weekStartsOn: 1 }); 
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3), // Seg, Ter...
      dateLabel: format(date, 'dd'),
      isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
      isWeekend: [0, 6].includes(date.getDay()), // 0 = Domingo, 6 = Sábado
      fullDate: date,
    };
  });
}

/** Cria os dados da grade de escala com base nos padrões do V1 */
export function createScheduleRows(days: WeekDay[]): ScheduleRow[] {
  const createSlots = (
    rowId: string,
    patterns: Array<Partial<{ day: Partial<ScheduleSlot>; night: Partial<ScheduleSlot> }>>,
  ): Record<string, { day: ScheduleSlot; night: ScheduleSlot }> => {
    return Object.fromEntries(
      days.map((day, index) => {
        const pattern = patterns[index] ?? {};
        // Lógica copiada do V1: Se o status for "open", remove o profissional (vaga aberta)
        const dayStatus = pattern.day?.status ?? 'planned';
        const isDayOpen = ['open', 'open-candidates', 'critical'].includes(dayStatus);
        
        const nightStatus = pattern.night?.status ?? 'planned';
        const isNightOpen = ['open', 'open-candidates', 'critical'].includes(nightStatus);

        const daySlot: ScheduleSlot = {
          id: `${rowId}-${day.key}-day`,
          shiftType: 'day',
          status: dayStatus,
          professional: isDayOpen ? undefined : (pattern.day?.professional ?? baseDayProfessional),
          checkIn: pattern.day?.checkIn,
          candidateCount: pattern.day?.candidateCount,
          caution: pattern.day?.caution,
        };

        const nightSlot: ScheduleSlot = {
          id: `${rowId}-${day.key}-night`,
          shiftType: 'night',
          status: nightStatus,
          professional: isNightOpen ? undefined : (pattern.night?.professional ?? baseNightProfessional),
          checkIn: pattern.night?.checkIn,
          candidateCount: pattern.night?.candidateCount,
          caution: pattern.night?.caution,
        };

        return [day.key, { day: daySlot, night: nightSlot }];
      }),
    );
  };

  // -----------------------------------------------------------------
  // DADOS REAIS MOCKADOS DO V1
  // -----------------------------------------------------------------
  return [
    {
      id: 'row-maria',
      patientId: 'patient-maria',
      patientName: 'Maria de Lourdes',
      contract: 'Unimed • Campinas',
      tags: ['TQT', 'GTT'],
      badge: 'bg-[#0F2B45]/10 text-[#0F2B45]',
      slots: createSlots('maria', [
        {
          day: { status: 'completed', professional: baseDayProfessional },
          night: { status: 'completed' },
        },
        {
          day: { status: 'live', checkIn: '07:05' },
          night: { status: 'warning', caution: 'Atraso confirmado' },
        },
        {
          day: { status: 'planned' },
          night: { status: 'open-candidates', candidateCount: 3 },
        },
        {
          day: { status: 'planned' },
          night: { status: 'critical' },
        },
        {
          day: { status: 'planned' },
          night: { status: 'planned' },
        },
        {
          day: {
            status: 'backup',
            professional: { name: 'Folguista A', role: 'Backup' },
          },
          night: { status: 'backup', professional: { name: 'Folguista B', role: 'Backup' } },
        },
        {
          day: { status: 'backup', professional: { name: 'Folguista A' } },
          night: { status: 'backup', professional: { name: 'Folguista B' } },
        },
      ]),
    },
    {
      id: 'row-joao',
      patientId: 'patient-joao',
      patientName: 'João da Silva',
      contract: 'Particular • Cuidador',
      tags: ['Home Care'],
      badge: 'bg-blue-100 text-blue-700',
      slots: createSlots('joao', [
        {
          day: { status: 'completed', professional: { name: 'Roberto', role: 'Cuidador' } },
          night: { status: 'completed', professional: { name: 'Família', role: 'Suporte' } },
        },
        {
          day: { status: 'live', professional: { name: 'Roberto', role: 'Cuidador' } },
          night: { status: 'planned', professional: { name: 'Família', role: 'Suporte' } },
        },
        {
          day: { status: 'planned', professional: { name: 'Roberto', role: 'Cuidador' } },
          night: { status: 'planned', professional: { name: 'Família' } },
        },
        {
          day: { status: 'planned', professional: { name: 'Roberto' } },
          night: { status: 'planned', professional: { name: 'Família' } },
        },
        {
          day: { status: 'planned', professional: { name: 'Roberto' } },
          night: { status: 'planned', professional: { name: 'Família' } },
        },
        {
          day: { status: 'backup', professional: { name: 'Folguista', role: 'Técnico' } },
          night: { status: 'backup', professional: { name: 'Família' } },
        },
        {
          day: { status: 'backup', professional: { name: 'Folguista', role: 'Técnico' } },
          night: { status: 'backup', professional: { name: 'Família' } },
        },
      ]),
    },
    {
      id: 'row-lucas',
      patientId: 'patient-lucas',
      patientName: 'Lucas Menezes',
      contract: 'Amil • São Paulo',
      tags: ['Alta complexidade'],
      badge: 'bg-emerald-100 text-emerald-700',
      slots: createSlots('lucas', [
        {
          day: { status: 'completed' },
          night: { status: 'completed' },
        },
        {
          day: { status: 'planned' },
          night: { status: 'planned' },
        },
        {
          day: { status: 'planned' },
          night: { status: 'warning', caution: 'Sem check-in' },
        },
        {
          day: { status: 'open' },
          night: { status: 'open-candidates', candidateCount: 2 },
        },
        {
          day: { status: 'live', checkIn: '07:02' },
          night: { status: 'planned' },
        },
        {
          day: { status: 'planned' },
          night: { status: 'planned' },
        },
        {
          day: { status: 'planned' },
          night: { status: 'planned' },
        },
      ]),
    },
  ];
}

/** Calcula o total de plantões e a cobertura da semana */
export function calculateTotals(rows: ScheduleRow[], days: WeekDay[]) {
  const total = rows.length * days.length * 2; // Total de slots (3 pacientes * 7 dias * 2 turnos)
  let filled = 0;
  let critical = 0;

  rows.forEach((row) => {
    Object.values(row.slots).forEach(({ day, night }) => {
      [day, night].forEach((slot) => {
        // Conta como preenchido se não for uma vaga aberta/crítica
        if (!['open', 'open-candidates', 'critical'].includes(slot.status)) {
          filled += 1;
        }
        if (slot.status === 'critical') {
          critical += 1;
        }
      });
    });
  });

  const coverage = Math.round((filled / total) * 100);
  return { total, coverage, critical };
}

/** Gera as iniciais do paciente para o Badge */
export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join('');
}