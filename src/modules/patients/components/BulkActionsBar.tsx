'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash, Prohibit, X, UserPlus } from "@phosphor-icons/react";
import { bulkDeletePatientsAction, bulkInactivatePatientsAction, bulkAssignTeamMemberAction } from "../actions.bulk";
import { getProfessionalsAction } from "@/modules/professionals/actions";
import { ProfessionalDTO } from "@/data/definitions/professional";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BulkActionsBar({ selectedIds, onClearSelection }: BulkActionsBarProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [professionals, setProfessionals] = useState<Array<ProfessionalDTO & { user_id: string }>>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedProf, setSelectedProf] = useState("");

  const handleOpenAssign = async () => {
    setIsAssignOpen(true);
    if (professionals.length === 0) {
      const data = await getProfessionalsAction();
      setProfessionals(data);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja EXCLUIR ${selectedIds.length} pacientes? Isso não pode ser desfeito.`)) return;
    const res = await bulkDeletePatientsAction(selectedIds);
    if (res.success) {
      toast.success(`${selectedIds.length} pacientes excluídos.`);
      onClearSelection();
    } else {
      toast.error("Erro ao excluir: " + res.error);
    }
  };

  const handleInactivate = async () => {
    const res = await bulkInactivatePatientsAction(selectedIds);
    if (res.success) {
      toast.success(`${selectedIds.length} pacientes inativados.`);
      onClearSelection();
    } else {
      toast.error("Erro ao inativar: " + res.error);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedRole || !selectedProf) return toast.error("Preencha todos os campos.");
    setLoading(true);
    const res = await bulkAssignTeamMemberAction(selectedIds, selectedProf, selectedRole);
    setLoading(false);
    if (res.success) {
      toast.success("Equipe atribuída com sucesso!");
      setIsAssignOpen(false);
      onClearSelection();
    } else {
      toast.error("Erro: " + res.error);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-2 bg-[#0F2B45] text-white rounded-lg shadow-2xl animate-in slide-in-from-bottom-4 fade-in border border-slate-700">
      <div className="flex items-center gap-3 px-3 border-r border-white/20">
        <span className="bg-white text-[#0F2B45] font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs">
          {selectedIds.length}
        </span>
        <span className="text-sm font-medium">Selecionados</span>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" className="hover:bg-white/10 text-white gap-2" onClick={handleOpenAssign}>
          <UserPlus size={18} /> Atribuir Equipe
        </Button>
        <Button size="sm" variant="ghost" className="hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 gap-2" onClick={handleInactivate}>
          <Prohibit size={18} /> Inativar
        </Button>
        <Button size="sm" variant="ghost" className="hover:bg-red-500/20 text-red-300 hover:text-red-200 gap-2" onClick={handleDelete}>
          <Trash size={18} /> Excluir
        </Button>
      </div>

      <Button size="icon" variant="ghost" className="ml-2 hover:bg-white/20 rounded-full h-8 w-8" onClick={onClearSelection}>
        <X />
      </Button>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-white sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Atribuir Profissional em Massa</DialogTitle>
            <DialogDescription>
              Isso adicionará o profissional selecionado à equipe fixa de <strong>{selectedIds.length} pacientes</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cargo / Função</Label>
              <Select onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supervisor Técnico">Supervisor Técnico</SelectItem>
                  <SelectItem value="Enfermeiro Responsável">Enfermeiro Responsável</SelectItem>
                  <SelectItem value="Escalista">Escalista</SelectItem>
                  <SelectItem value="Médico Visitador">Médico Visitador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select onValueChange={setSelectedProf}>
                <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name} ({p.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssignSubmit} disabled={loading} className="bg-[#0F2B45] text-white">
              {loading ? "Salvando..." : "Confirmar Atribuição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
