'use client';

import { useMemo, useState } from "react";
import useSWR from "swr";
import { format, subDays } from "date-fns";
import {
    ClockCounterClockwise,
    Funnel,
    IdentificationCard,
    WarningCircle,
} from "@phosphor-icons/react";
import type { FullPatientDetails } from "../../patient.data";
import type { PatientHistoryEvent } from "@/lib/audit/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((response) => {
    if (!response.ok) throw new Error("Erro ao carregar histórico");
    return response.json();
});

type HistoryResponse = {
    events: PatientHistoryEvent[];
    total: number;
};

type PeriodValue = "all" | "7d" | "30d" | "90d";

const PERIOD_OPTIONS: { label: string; value: PeriodValue; days?: number }[] = [
    { label: "Últimos 7 dias", value: "7d", days: 7 },
    { label: "Últimos 30 dias", value: "30d", days: 30 },
    { label: "Últimos 90 dias", value: "90d", days: 90 },
    { label: "Todos", value: "all" },
];

const MODULE_STYLES: Record<PatientHistoryEvent["module"], { badge: string; dot: string }> = {
    Paciente: { badge: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
    Administrativo: { badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
    Financeiro: { badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
    Clínico: { badge: "border-rose-200 bg-rose-50 text-rose-800", dot: "bg-rose-500" },
    Estoque: { badge: "border-purple-200 bg-purple-50 text-purple-800", dot: "bg-purple-500" },
    GED: { badge: "border-indigo-200 bg-indigo-50 text-indigo-800", dot: "bg-indigo-500" },
    Escala: { badge: "border-cyan-200 bg-cyan-50 text-cyan-800", dot: "bg-cyan-500" },
    Sistema: { badge: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-400" },
};

const MODULE_OPTIONS = (Object.keys(MODULE_STYLES) as PatientHistoryEvent["module"][]).map((module) => ({
    label: module,
    value: module,
}));

const getActionTone = (action: string) => {
    const normalized = action.toLowerCase();
    if (normalized.includes("delete")) return "border-rose-200 bg-rose-50 text-rose-700";
    if (normalized.includes("create") || normalized.includes("insert")) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (normalized.includes("update") || normalized.includes("edit")) {
        return "border-indigo-200 bg-indigo-50 text-indigo-700";
    }
    if (normalized.includes("view") || normalized.includes("read")) {
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
    if (normalized.startsWith("document.")) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-white text-slate-700";
};

const formatDateTime = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "dd/MM/yyyy HH:mm");
};

const hasDetails = (event: PatientHistoryEvent) => {
    if (!event.details) return false;
    return Object.keys(event.details || {}).length > 0;
};

const buildRange = (value: PeriodValue) => {
    if (value === "all") return { from: undefined as Date | undefined, to: undefined as Date | undefined };
    const option = PERIOD_OPTIONS.find((item) => item.value === value);
    if (!option?.days) return { from: undefined, to: undefined };
    const now = new Date();
    return {
        from: subDays(now, option.days),
        to: now,
    };
};

export function TabHistory({ patient }: { patient: FullPatientDetails }) {
    const [period, setPeriod] = useState<PeriodValue>("all");
    const [modules, setModules] = useState<PatientHistoryEvent["module"][]>([]);
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [detailEvent, setDetailEvent] = useState<PatientHistoryEvent | null>(null);

    const dateRange = useMemo(() => buildRange(period), [period]);

    const historyUrl = useMemo(() => {
        if (!patient.id) return null;
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from.toISOString());
        if (dateRange.to) params.set("to", dateRange.to.toISOString());
        if (modules.length) params.set("modules", modules.join(","));
        if (actionFilter !== "all") params.set("actions", actionFilter);
        const query = params.toString();
        return `/api/patients/${patient.id}/history${query ? `?${query}` : ""}`;
    }, [patient.id, dateRange.from, dateRange.to, modules, actionFilter]);

    const shouldFetch = Boolean(historyUrl);
    const { data, error, isValidating, mutate } = useSWR<HistoryResponse>(shouldFetch ? historyUrl : null, fetcher);

    const rawEvents = data?.events ?? [];
    const events = useMemo(
        () =>
            [...rawEvents].sort(
                (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
            ),
        [rawEvents],
    );
    const total = data?.total ?? rawEvents.length;
    const loading = !data && !error;

    const actionOptions = useMemo(() => {
        const unique = new Set(rawEvents.map((event) => event.action));
        return Array.from(unique).sort();
    }, [rawEvents]);

    const modulesLabel = modules.length === 0 ? "Todos os módulos" : modules.length === 1 ? modules[0] : `${modules.length} módulos`;
    const canResetFilters = period !== "all" || modules.length > 0 || actionFilter !== "all";

    const handleToggleModule = (module: PatientHistoryEvent["module"], checked: boolean | string) => {
        setModules((current) => {
            if (checked === true || checked === "indeterminate") {
                if (current.includes(module)) return current;
                return [...current, module];
            }
            return current.filter((item) => item !== module);
        });
    };

    const handleResetFilters = () => {
        setPeriod("all");
        setModules([]);
        setActionFilter("all");
    };

    return (
        <div className="space-y-6 pb-16">
            <Card className="border-slate-200 bg-white shadow-fluent">
                <CardHeader className="border-b border-slate-100">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl text-[#0F2B45]">
                                <ClockCounterClockwise className="h-5 w-5" /> Histórico & Auditoria
                            </CardTitle>
                            <CardDescription>Linha do tempo de eventos relacionados a este paciente.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="rounded-full text-sm font-semibold">
                            Total: {total} eventos
                        </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>Período</span>
                            <Select value={period} onValueChange={(value: PeriodValue) => setPeriod(value)}>
                                <SelectTrigger size="sm" className="w-48 bg-white">
                                    <SelectValue placeholder="Selecione o período" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIOD_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>Módulos</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-52 justify-between bg-white">
                                        <span className="truncate text-sm font-normal text-slate-700">{modulesLabel}</span>
                                        <Funnel className="h-4 w-4 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    {MODULE_OPTIONS.map((option) => (
                                        <DropdownMenuCheckboxItem
                                            key={option.value}
                                            checked={modules.includes(option.value)}
                                            onCheckedChange={(checked) => handleToggleModule(option.value, checked)}
                                        >
                                            {option.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>Ações</span>
                            <Select value={actionFilter} onValueChange={(value) => setActionFilter(value)}>
                                <SelectTrigger size="sm" className="w-48 bg-white">
                                    <SelectValue placeholder="Todas as ações" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as ações</SelectItem>
                                    {actionOptions.map((action) => (
                                        <SelectItem key={action} value={action}>
                                            {action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="ml-auto flex gap-2">
                            <Button variant="ghost" size="sm" disabled={!canResetFilters} onClick={handleResetFilters}>
                                Limpar filtros
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => mutate()}>
                                Atualizar
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="py-6">
                    {error && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                            <span>Não foi possível carregar o histórico. Tente novamente.</span>
                            <Button size="sm" variant="outline" onClick={() => mutate()}>
                                Tentar novamente
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-5">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="mt-2">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                    </div>
                                    <div className="flex-1 space-y-3 rounded-lg border border-slate-200 p-4">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-5 w-1/2" />
                                        <Skeleton className="h-4 w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
                            <WarningCircle className="h-10 w-10 text-slate-300" />
                            <div>
                                <p className="text-base font-semibold text-slate-600">Nenhum evento encontrado para os filtros atuais.</p>
                                <p className="text-sm">Ajuste os filtros ou limpe para visualizar mais resultados.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleResetFilters}>
                                Limpar filtros
                            </Button>
                        </div>
                    )}

                    {!loading && events.length > 0 && (
                        <div className="relative space-y-6 border-l border-slate-200 pl-8">
                            {events.map((event) => {
                                const moduleStyle = MODULE_STYLES[event.module] || MODULE_STYLES.Sistema;
                                const actionTone = getActionTone(event.action);
                                const actorLabel = event.actor?.name || event.actor?.userId || "Sistema";
                                const sourceLabel = [event.source?.entityTable, event.source?.entityId]
                                    .filter(Boolean)
                                    .join(" · ");

                                return (
                                    <div key={event.id} className="relative">
                                        <span
                                            className={cn(
                                                "absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow",
                                                moduleStyle.dot,
                                            )}
                                        >
                                            <IdentificationCard className="h-4 w-4 text-white" />
                                        </span>

                                        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline" className={cn("text-[11px] uppercase", moduleStyle.badge)}>
                                                        {event.module}
                                                    </Badge>
                                                    <Badge variant="outline" className={cn("text-[10px] uppercase", actionTone)}>
                                                        {event.action}
                                                    </Badge>
                                                    <span className="text-xs font-mono text-slate-500">{formatDateTime(event.occurredAt)}</span>
                                                </div>
                                                {isValidating && <span className="text-xs text-slate-400">Atualizando…</span>}
                                            </div>

                                            <p className="mt-2 text-sm font-semibold text-slate-900">{event.summary}</p>

                                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                                                {actorLabel && (
                                                    <span>
                                                        Por: <span className="font-semibold text-slate-700">{actorLabel}</span>
                                                    </span>
                                                )}
                                                {sourceLabel && (
                                                    <span>
                                                        Origem: <span className="font-semibold text-slate-700">{sourceLabel}</span>
                                                    </span>
                                                )}
                                                {event.source?.routePath && (
                                                    <span>
                                                        Rota: <span className="font-mono text-slate-700">{event.source.routePath}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {hasDetails(event) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => setDetailEvent(event)}
                                                >
                                                    Ver detalhes
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={Boolean(detailEvent)} onOpenChange={(open) => !open && setDetailEvent(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do evento</DialogTitle>
                    </DialogHeader>
                    {detailEvent && (
                        <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-900/90 p-4 text-xs text-slate-50">
                            {JSON.stringify(detailEvent.details, null, 2)}
                        </pre>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
