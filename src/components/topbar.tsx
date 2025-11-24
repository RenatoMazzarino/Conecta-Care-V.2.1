'use client';

import { usePathname } from "next/navigation";
import { DotsNine, Bell, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const moduleNames: { prefix: string; label: string }[] = [
  { prefix: "/dashboard", label: "Dashboard" },
  { prefix: "/patients", label: "Gestão de Pacientes" },
  { prefix: "/team", label: "Equipe" },
  { prefix: "/schedule", label: "Escala" },
  { prefix: "/financial", label: "Financeiro" },
  { prefix: "/inventory", label: "Gestão de Estoque" },
  { prefix: "/admin", label: "Administração" },
];

export function Topbar() {
  const pathname = usePathname();
  const currentModule = moduleNames.find((m) => pathname.startsWith(m.prefix))?.label || "Portal";

  return (
    <header className="sticky top-0 z-50 h-12 bg-[#0B2F53] text-white shadow-md flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <DotsNine size={18} weight="bold" className="opacity-90" />
        <span className="font-semibold text-lg tracking-tight">Conecta Care</span>
        <span className="h-5 w-px bg-white/30 mx-1" />
        <span className="text-sm font-medium text-white/90">{currentModule}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-4 w-4" />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-1 focus:ring-white/50"
          />
        </div>
        <button className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10 transition" aria-label="Notificações">
          <Bell weight="bold" />
        </button>
        <div className={cn("w-9 h-9 rounded-full bg-[#D46F5D] flex items-center justify-center text-xs font-bold border-2 border-white/40")}>
          RM
        </div>
      </div>
    </header>
  );
}
