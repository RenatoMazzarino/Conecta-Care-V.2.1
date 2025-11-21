"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BatteryMedium,
  BluetoothConnected,
  CalendarBlank as Calendar,
  CellSignalFull as Signal,
  ChatCenteredText as MessageSquare,
  ChatCircle as MessageCircle,
  FileText,
  MapPin,
  NotePencil as NotebookPen,
  Phone,
  ShieldCheck,
  Warning as Activity,
  IconProps,
} from "@phosphor-icons/react";

// Importando a tipagem do schema para garantir a consistência
import { ShiftMonitorDataDTO } from "@/data/definitions/schedule";

// Tipagem local para os estilos de Timeline (refatorado do V1)
const toneStyles: Record<
  NonNullable<ShiftMonitorDataDTO["timeline"][number]["tone"]>,
  string
> = {
  default: "bg-white border border-slate-200 text-slate-700",
  success: "bg-green-50 border border-green-100 text-green-800",
  warning: "bg-amber-50 border border-amber-100 text-amber-800",
};

// =================================================================
// Funções Auxiliares (Refatoradas do V1)
// =================================================================

function MonitorActionButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<IconProps>;
  label: string;
}) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/20"
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function AuditRow({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ComponentType<IconProps>;
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-600">
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </span>
      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
        {status}
      </span>
    </div>
  );
}

// Lógica de cálculo de tempo restante (Mantida do V1)
function calculateRemainingTime(data?: ShiftMonitorDataDTO) {
  if (!data?.progress) return "--";
  const remaining = Math.max(0, 100 - data.progress);
  // Assumindo um turno de 12 horas para fins de mock (ajustar na implementação real)
  const totalHours = (remaining / 100) * 12;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours.toString().padStart(2, "0")}h ${minutes
    .toString()
    .padStart(2, "0")}m`;
}

// Mapeamento dos nomes de ícones (String) para os componentes (React)
const iconMap: Record<string, React.ComponentType<IconProps>> = {
  ShieldCheck,
  BluetoothConnected,
  Activity,
  MapPin,
  BatteryMedium,
  // Adicionar outros ícones usados na timeline
};

// =================================================================
// Componente Principal
// =================================================================

interface ShiftMonitorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: ShiftMonitorDataDTO;
  // TODO: Implementar a função de nota real
  onCreateInternalNote?: (note: string) => void;
}

export function ShiftMonitorSheet({
  open,
  onOpenChange,
  data,
  onCreateInternalNote,
}: ShiftMonitorSheetProps) {
  const [activeTab, setActiveTab] = React.useState<"timeline" | "notes">(
    "timeline"
  );
  const [noteValue, setNoteValue] = React.useState("");
  // Simula a adição de notas em tempo real no frontend
  const [localNotes, setLocalNotes] = React.useState<ShiftMonitorDataDTO["notes"]>([]);

  React.useEffect(() => {
    if (open) {
      setActiveTab("timeline");
      setNoteValue("");
      setLocalNotes(data?.notes ?? []);
    }
  }, [open, data]);

  const hasData = Boolean(data);
  const timeline = data?.timeline ?? [];
  const notes = localNotes.length ? localNotes : data?.notes ?? [];

  function handleSubmitNote() {
    if (!noteValue.trim() || !data) return;
    const newNote: ShiftMonitorDataDTO["notes"][number] = {
      id: `local-${Date.now()}`,
      author: "Você",
      timestamp: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: noteValue.trim(),
      variant: "default",
    };
    setLocalNotes((prev) => [newNote, ...prev]);
    onCreateInternalNote?.(noteValue.trim());
    setNoteValue("");
  }

  // NOTE: A lógica de Polling foi removida daqui, será encapsulada num hook
  // (ex: useShiftTelemetry) no futuro, mantendo este componente limpo.

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // NOVO TAMANHO: w-[90vw] (90% da largura) e max-w-[1400px]
        className="w-[90vw] max-w-[1400px] gap-0 border-none bg-[#F8FAFC] p-0 shadow-[ -4px_0_24px_rgba(15,43,69,0.15)]"
      >
        {!hasData ? (
          // Se o Sheet estiver aberto mas os dados ainda são undefined,
          // mostramos um indicador de loading otimista (fetch em andamento).
          open && data === undefined ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
                <svg className="h-6 w-6 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
              <div className="text-sm font-medium text-slate-600">Carregando dados do plantão...</div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
              Selecione um plantão em execução para abrir o monitor.
            </div>
          )
        ) : (
          <div className="flex h-full flex-col overflow-hidden">
            
            {/* Header (Muitos estilos herdados do V1 HTML) */}
            <header className="flex flex-col gap-4 border-b border-white/20 bg-[#0F2B45] px-6 pb-16 pt-4 text-white">
              <div className="flex items-start justify-between">
                {/* Status do Plantão */}
                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Em andamento
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-[10px] text-white/70">
                    Iniciado às {data?.shiftWindow.startedAt ?? data?.shiftWindow.start}
                  </span>
                </div>
                {/* Botões de Ação */}
                <div className="flex gap-1 rounded-lg border border-white/20 bg-white/10 p-1">
                  <MonitorActionButton icon={MessageSquare} label="Chat interno" />
                  <MonitorActionButton icon={MessageCircle} label="WhatsApp" />
                  <MonitorActionButton icon={Phone} label="Ligar" />
                  <div className="mx-1 w-px bg-white/30" />
                  <MonitorActionButton icon={NotebookPen} label="Tarefa" />
                  <MonitorActionButton icon={FileText} label="Prontuário" />
                </div>
              </div>

              {/* Info Profissional / Paciente */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-emerald-400 shadow-sm">
                    <AvatarImage src={data?.professional.avatarUrl} />
                    <AvatarFallback>{data?.professional.initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    <BluetoothConnected className="h-3 w-3" /> BLE
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">
                    {data?.professional.role}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    {data?.professional.name}
                  </h2>
                  <p className="text-sm text-white/70">
                    Paciente:{' '}
                    <span className="font-semibold text-white">
                      {data?.patientName}
                    </span>
                  </p>
                </div>
                <div className="ml-auto text-right text-xs text-white/70">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="h-3.5 w-3.5 text-white/60" />
                    <span>
                      {data?.shiftWindow.start} • {data?.shiftWindow.end}
                    </span>
                  </div>
                  {data?.status && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                      <Signal className="h-3 w-3" /> {data.status}
                    </span>
                  )}
                </div>
              </div>
            </header>

            {/* Progresso e Auditoria (Cartão Flutuante) */}
            <div className="px-6 -mt-10 relative z-10">
              <div className="rounded-lg border border-slate-200 bg-white shadow-fluent">
                <div className="space-y-3 p-4">
                  {/* Progresso do Turno */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 uppercase">
                      Progresso do turno
                    </span>
                    <span className="text-base font-semibold text-[#0F2B45]">
                      {Math.round(data?.progress ?? 0)}%
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(data?.progress ?? 0, 100)}%` }}
                    />
                    {/* Tooltip de Tempo Restante */}
                    <div
                      className="absolute -top-8 left-0 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow-sm transition-all duration-150"
                      style={{
                        left: `${Math.min(data?.progress ?? 0, 100)}%`,
                      }}
                    >
                      Faltam {calculateRemainingTime(data)}
                      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>{data?.shiftWindow.start}</span>
                    <span>{data?.shiftWindow.end}</span>
                  </div>
                </div>

                {/* Detalhes da Auditoria (Collapsible) */}
                <div className="border-t border-slate-200">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-1 text-[#0F2B45] shadow-sm">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        Auditoria de segurança
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase text-emerald-700">
                          Check-in validado
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 transition group-open:rotate-180">
                        ▼
                      </span>
                    </summary>
                    <div className="grid gap-6 border-t border-slate-100 bg-white px-4 py-4 text-xs text-slate-600 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Entrada
                        </p>
                        <AuditRow icon={Activity} label="Facial" status="OK" />
                        <AuditRow icon={MapPin} label="GPS" status="OK" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Permanência
                        </p>
                        <AuditRow icon={BluetoothConnected} label="Beacon" status="Conectado" />
                        <AuditRow
                          icon={BatteryMedium}
                          label="Bateria"
                          status={`${data?.professional.battery ?? 82}%`}
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Abas (Linha do Tempo e Notas) */}
            <div className="mt-6 flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={(val: string) => setActiveTab(val as "timeline" | "notes")}
                className="w-full"
              >
                {/* Tabs List */}
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-[#F8FAFC] px-6">
                  <TabsList className="bg-transparent p-0">
                    <TabsTrigger
                      value="timeline"
                      className={cn(
                        'rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-semibold text-slate-500',
                        activeTab === 'timeline'
                          ? 'border-[#D46F5D] text-[#0F2B45]' // Cor Accent
                          : 'hover:border-slate-200 hover:text-slate-700'
                      )}
                    >
                      Linha do tempo
                    </TabsTrigger>
                    <TabsTrigger
                      value="notes"
                      className={cn(
                        'rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-semibold text-slate-500',
                        activeTab === 'notes'
                          ? 'border-[#D46F5D] text-[#0F2B45]' // Cor Accent
                          : 'hover:border-slate-200 hover:text-slate-700'
                      )}
                    >
                      Anotações internas
                      <Badge
                        variant="outline"
                        className="ml-2 border-amber-200 bg-amber-50 text-[10px] font-semibold uppercase text-amber-700"
                      >
                        {notes.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tabs Content */}
                <TabsContent value="timeline" className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                  <div className="relative space-y-6 pl-6">
                    {/* Linha Vertical da Timeline */}
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200" />
                    
                    {timeline.map((event) => {
                      const IconComponent = iconMap[event.iconName ?? 'Activity']; // Fallback
                      return (
                      <div key={event.id} className="relative pl-8">
                        {/* Círculo do Ícone */}
                        <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F2B45] shadow-sm">
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                        </div>
                        {/* Conteúdo do Evento */}
                        <div
                          className={cn(
                            'rounded-lg border bg-white p-4 shadow-sm',
                            toneStyles[event.tone ?? 'default']
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#0F2B45]">
                              {event.title}
                            </span>
                            <span className="text-slate-400">{event.time}</span>
                          </div>
                          <p className="text-sm">{event.description}</p>
                          {event.meta && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {event.meta.map((meta) => (
                                <Badge
                                  key={meta}
                                  variant="outline"
                                  className="border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-600"
                                >
                                  {meta}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                </TabsContent>

                {/* Conteúdo Anotações */}
                <TabsContent value="notes" className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                  <div className="space-y-4">
                    {/* Campo para Nova Nota */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-amber-700">
                        <NotebookPen className="h-4 w-4" />
                        Nova observação
                      </p>
                      <Textarea
                        placeholder="Digite uma orientação para a equipe de escala..."
                        value={noteValue}
                        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNoteValue(event.target.value)}
                        className="min-h-[100px] border-amber-200 bg-white text-sm text-slate-700"
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          className="bg-amber-600 text-white hover:bg-amber-700"
                          onClick={handleSubmitNote}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de Notas */}
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className={cn(
                            'rounded-lg border p-4 shadow-sm',
                            note.variant === 'muted'
                              ? 'border-slate-100 bg-slate-50 text-slate-500'
                              : 'border-slate-200 bg-white text-slate-700'
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold uppercase text-slate-600">
                              {note.author}
                            </span>
                            <span>{note.timestamp}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{note.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
