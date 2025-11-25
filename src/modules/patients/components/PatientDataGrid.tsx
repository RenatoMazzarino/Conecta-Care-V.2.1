"use client";

import { useState } from "react";
import Link from "next/link";
import { PatientGridItem } from "../patient.data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DotsThree,
  MapPin,
  WarningOctagon,
  Stethoscope,
  CheckCircle,
  WarningCircle,
  Export,
  EnvelopeSimple,
  Trash,
  UserPlus,
  Prohibit
} from "@phosphor-icons/react";
import { bulkAssignTeamMemberAction, bulkDeletePatientsAction, bulkInactivatePatientsAction } from "../actions.bulk";
import { getProfessionalsAction } from "@/modules/professionals/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ProfessionalDTO } from "@/data/definitions/professional";
import { cn } from "@/lib/utils";

const complexityBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
  low: { label: 'Baixa', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  medium: { label: 'Média', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  high: { label: 'Alta', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  critical: { label: 'Crítica', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
};

type GridProps = {
  data: PatientGridItem[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageSize?: number;
  params?: Record<string, string | number | undefined>;
};

export function PatientDataGrid({ data, currentPage = 1, totalPages = 1, totalCount = data.length, pageSize = 20, params = {} }: GridProps) {
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [professionals, setProfessionals] = useState<Array<ProfessionalDTO & { user_id: string }>>([]);
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const loadProfessionals = async () => {
    if (professionals.length === 0) {
      const data = await getProfessionalsAction();
      setProfessionals((data || []) as Array<ProfessionalDTO & { user_id: string }>);
    }
  };

  const openAssign = () => {
    setAssignOpen(true);
    loadProfessionals();
  };

  const handleAssign = async () => {
    if (!selectedRole || !selectedProf) {
      toast.error("Selecione função e profissional.");
      return;
    }
    setLoadingAction(true);
    const res = await bulkAssignTeamMemberAction(selectedIds, selectedProf, selectedRole);
    setLoadingAction(false);
    if (res.success) {
      toast.success("Equipe atribuída.");
      setAssignOpen(false);
      setSelectedIds([]);
      setSelectedProf("");
      setSelectedRole("");
    } else {
      toast.error(res.error || "Erro ao atribuir.");
    }
  };

  const handleInactivate = async () => {
    if (selectedIds.length === 0) return;
    setLoadingAction(true);
    const res = await bulkInactivatePatientsAction(selectedIds);
    setLoadingAction(false);
    if (res.success) {
      toast.success("Pacientes inativados.");
      setSelectedIds([]);
    } else {
      toast.error(res.error || "Erro ao inativar.");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Excluir ${selectedIds.length} pacientes?`)) return;
    setLoadingAction(true);
    const res = await bulkDeletePatientsAction(selectedIds);
    setLoadingAction(false);
    if (res.success) {
      toast.success("Pacientes excluídos.");
      setSelectedIds([]);
    } else {
      toast.error(res.error || "Erro ao excluir.");
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const buildHref = (page: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.set(k, String(v));
    });
    sp.set('page', String(page));
    return `?${sp.toString()}`;
  };

  return (
    <>
      {/* Command bar */}
      <div className="bg-white border border-gray-200 px-4 py-2 flex items-center gap-2 shadow-sm rounded-md mt-2">
        <Button variant="ghost" size="sm" className="h-8 text-gray-700 hover:bg-gray-100 gap-2 text-xs font-semibold">
          <Export size={16} /> Exportar Excel
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-gray-700 hover:bg-gray-100 gap-2 text-xs font-semibold">
          <EnvelopeSimple size={16} /> Enviar E-mail
        </Button>
        <div className="h-4 w-px bg-gray-300 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          disabled={selectedIds.length === 0}
          onClick={openAssign}
          className="h-8 text-gray-700 hover:bg-gray-100 gap-2 text-xs font-semibold disabled:opacity-50"
        >
          <UserPlus size={16} /> Atribuir Equipe
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={selectedIds.length === 0}
          onClick={handleInactivate}
          className="h-8 text-amber-600 hover:bg-amber-50 gap-2 text-xs font-semibold disabled:opacity-50"
        >
          <Prohibit size={16} /> Inativar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={selectedIds.length === 0}
          onClick={handleDelete}
          className="h-8 text-gray-400 disabled:opacity-50 hover:text-rose-600 hover:bg-rose-50 gap-2 text-xs font-semibold"
        >
          <Trash size={16} /> Excluir ({selectedIds.length})
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-md shadow-fluent overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="h-10 border-b border-gray-200">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={allSelected || (someSelected ? "indeterminate" : false)}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-600 tracking-wider">Paciente / Local</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-600 tracking-wider">Quadro Clínico</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-600 tracking-wider">Contrato & Financeiro</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-600 tracking-wider">Equipe Resp.</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-600 tracking-wider">Status Escala</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-600 tracking-wider text-right pr-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400">Nenhum paciente encontrado.</TableCell></TableRow>
            ) : (
              data.map((row) => {
                const complexity = complexityBadges[row.complexity_level || 'low'];
                const isOpenSlot = row.next_shift ? row.next_shift.is_open : true;
                const coverageValue = isOpenSlot ? 60 : 98;
                return (
                  <TableRow key={row.id} className="group cursor-pointer transition-colors hover:bg-[#f3f2f1] border-b border-gray-100 last:border-0">
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={(checked) => handleSelectOne(row.id, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/patients/${row.id}`} className="flex gap-3">
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Avatar className="h-10 w-10 border border-gray-200">
                            <AvatarFallback className="text-xs font-bold text-[#201f1e] bg-[#e1dfdd]">
                              {getInitials(row.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                              row.status === 'active' ? "bg-green-700" : "bg-gray-400"
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F2B45] group-hover:text-blue-700">{row.full_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={12} /> {row.city || '—'} {row.age ? `• ${row.age} anos` : ''}
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        {row.complexity_level && (
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border", complexity.bg, complexity.text, complexity.border)}>
                            {row.complexity_level === 'critical' && <WarningOctagon weight="fill" className="mr-1" size={12} />}
                            {complexity.label} Complexidade
                          </span>
                        )}
                        <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Stethoscope size={14} className="text-gray-400" /> {row.diagnosis_main || 'Diagnóstico n/d'}
                        </div>
                        {row.clinical_tags && row.clinical_tags.length > 0 && (
                          <div className="flex gap-1">
                            {row.clinical_tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] rounded font-semibold border border-slate-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{row.contractor_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {row.billing_status === 'defaulting' ? (
                            <>
                              <WarningCircle weight="fill" className="text-rose-500 text-xs" />
                              <span className="text-[11px] font-semibold text-rose-600">Pendente</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle weight="fill" className="text-green-600 text-xs" />
                              <span className="text-[11px] font-semibold text-green-700">Em dia</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex -space-x-2">
                        {row.supervisor_name ? (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-[9px] font-bold text-purple-700" title={row.supervisor_name}>
                            {row.supervisor_name.substring(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600" title="Não definido">
                            ND
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", isOpenSlot ? "bg-amber-500" : "bg-green-600")} style={{ width: `${coverageValue}%` }} />
                        </div>
                        <span className={cn("text-[10px] font-bold", isOpenSlot ? "text-amber-600" : "text-green-700")}>
                          {coverageValue}%
                        </span>
                      </div>
                      <p className={cn("text-[10px] mt-0.5", isOpenSlot ? "text-amber-600 font-bold" : "text-gray-400")}>
                        {row.next_shift
                          ? isOpenSlot
                            ? "Vaga Aberta"
                            : `Próx: ${new Date(row.next_shift.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : "Sem escala futura"}
                      </p>
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="icon" className="p-1.5 text-gray-400 hover:text-[#0F2B45] hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <DotsThree size={18} weight="bold" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <p>
            Mostrando <strong>{data.length > 0 ? (pageSize * (currentPage - 1) + 1) : 0}</strong>-
            <strong>{pageSize * (currentPage - 1) + data.length}</strong> de <strong>{totalCount}</strong> registros
          </p>
          <div className="flex gap-2">
            <Link href={buildHref(Math.max(currentPage - 1, 1))}>
              <Button variant="outline" size="sm" disabled={currentPage <= 1} className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-400 disabled:cursor-not-allowed">
                Anterior
              </Button>
            </Link>
            <Link href={buildHref(Math.min(currentPage + 1, totalPages))}>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:border-brand disabled:cursor-not-allowed">
                Próximo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-white sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Atribuir profissional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Função</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supervisor Técnico">Supervisor Técnico</SelectItem>
                  <SelectItem value="Enfermeiro Responsável">Enfermeiro Responsável</SelectItem>
                  <SelectItem value="Escalista">Escalista</SelectItem>
                  <SelectItem value="Médico Visitador">Médico Visitador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Profissional</label>
              <Select value={selectedProf} onValueChange={setSelectedProf} onOpenChange={(o) => o && loadProfessionals()}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.full_name} ({p.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={loadingAction} className="bg-[#0F2B45] text-white">
              {loadingAction ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
