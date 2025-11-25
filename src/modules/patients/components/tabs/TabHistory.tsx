'use client'

import { useEffect, useState, ComponentType } from "react";
import { getPatientHistoryAction, PatientHistoryItem } from "../../actions.history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    ClockCounterClockwise, PencilSimple, PlusCircle, Trash, CheckCircle, User, CaretDown, CaretUp
} from "@phosphor-icons/react";
import { format } from "date-fns";

const actionStyles: Record<string, { icon: ComponentType<{ className?: string; weight?: string }>; color: string; bg: string }> = {
    CREATE: { icon: PlusCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
    UPDATE: { icon: PencilSimple, color: "text-blue-600", bg: "bg-blue-100" },
    DELETE: { icon: Trash, color: "text-rose-600", bg: "bg-rose-100" },
    VALIDATE: { icon: CheckCircle, color: "text-violet-600", bg: "bg-violet-100" },
};

export function TabHistory({ patient }: { patient: { id: string } }) {
    const [logs, setLogs] = useState<PatientHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        getPatientHistoryAction(patient.id).then(data => {
            setLogs(data);
            setLoading(false);
        });
    }, [patient.id]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white border border-slate-200 rounded-md shadow-fluent">
                <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                        <ClockCounterClockwise size={18} /> Linha do Tempo (Auditoria)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-slate-50/40 min-h-[400px]">
                    {loading ? (
                        <div className="text-center text-slate-400 py-10">Carregando timeline...</div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-lg bg-white">
                            <ClockCounterClockwise size={48} className="mb-2 opacity-20" />
                            <p>Nenhuma alteração registrada.</p>
                        </div>
                    ) : (
                        <div className="relative space-y-0 pl-4 before:absolute before:top-0 before:bottom-0 before:left-6 before:w-0.5 before:bg-slate-200">
                            {logs.map((log) => {
                                const style = actionStyles[log.action] || actionStyles.UPDATE;
                                const Icon = style.icon;
                                const isExpanded = expandedId === log.id;
                                
                                return (
                                    <div key={log.id} className="relative flex gap-6 pb-8 last:pb-0 group">
                                        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-slate-50 bg-white shadow-sm">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${style.bg}`}>
                                                <Icon className={`h-4 w-4 ${style.color}`} weight="bold" />
                                            </div>
                                        </div>

                                        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide">
                                                            {log.entity}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800">{log.description}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                        <User size={12} />
                                                        <span>Por: <strong className="text-slate-700">{log.actor_name}</strong></span>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{log.time_ago}</span>
                                                    </div>
                                                </div>
                                                
                                                {log.changes && (
                                                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(log.id)} className="text-slate-400 hover:text-[#0F2B45]">
                                                        {isExpanded ? <CaretUp /> : <CaretDown />}
                                                    </Button>
                                                )}
                                            </div>

                                            {isExpanded && log.changes && (
                                                <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-xs font-mono overflow-x-auto">
                                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Detalhes da Alteração</p>
                                                    <pre className="text-slate-600 whitespace-pre-wrap break-words">{JSON.stringify(log.changes, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
