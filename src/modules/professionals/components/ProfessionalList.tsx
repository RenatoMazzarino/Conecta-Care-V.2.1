'use client'

import { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MagnifyingGlass, IdentificationBadge, 
  PencilSimple
} from "@phosphor-icons/react";
import { ProfessionalFormDialog } from "./ProfessionalFormDialog";

// Helper para cores de cargo
const roleColors: Record<string, string> = {
  nurse: "bg-blue-50 text-blue-700 border-blue-200",
  technician: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medic: "bg-violet-50 text-violet-700 border-violet-200",
  caregiver: "bg-amber-50 text-amber-700 border-amber-200",
  coordinator: "bg-slate-100 text-slate-700 border-slate-200",
};

export function ProfessionalList({ data }: { data: any[] }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Filtragem Local (Rápida para listas < 1000 itens)
  const filtered = data.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.cpf?.includes(search);
    const matchesRole = filterRole === 'all' || p.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* BARRA DE FERRAMENTAS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Buscar por nome ou CPF..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="h-10 rounded-md border border-slate-200 text-sm px-3 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F2B45]"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          >
            <option value="all">Todos os Cargos</option>
            <option value="nurse">Enfermeiros</option>
            <option value="technician">Técnicos</option>
            <option value="caregiver">Cuidadores</option>
            <option value="medic">Médicos</option>
          </select>
          
          {/* O Botão de Novo Cadastro fica aqui */}
          <ProfessionalFormDialog />
        </div>
      </div>

      {/* TABELA */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Cargo / Registro</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                  Nenhum profissional encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((pro) => (
                <TableRow key={pro.user_id || pro.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Avatar className="h-9 w-9 bg-slate-100 border border-slate-200">
                      <AvatarFallback className="text-[#0F2B45] font-bold text-xs">
                        {pro.full_name.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-[#0F2B45]">{pro.full_name}</div>
                    <div className="text-xs text-slate-500">{pro.cpf || "CPF não inf."}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className={`${roleColors[pro.role] || roleColors.coordinator} uppercase text-[10px]`}>
                        {pro.role}
                      </Badge>
                      {pro.professional_license && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <IdentificationBadge/> {pro.professional_license}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700">{pro.contact_phone || pro.phone || "—"}</div>
                    <div className="text-xs text-slate-400">{pro.email || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pro.is_active ? "default" : "secondary"} className={pro.is_active ? "bg-emerald-600" : "bg-slate-400"}>
                      {pro.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ProfessionalFormDialog professional={pro} trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0F2B45]">
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                      }/>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
