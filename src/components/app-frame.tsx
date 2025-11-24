"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { Topbar } from "./topbar";
import { Breadcrumbs } from "./breadcrumbs";
import { ListBullets, CalendarCheck, ChartPieSlice, CurrencyCircleDollar, Package, UsersThree, UserGear, Buildings, GearSix } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartPieSlice },
  { href: "/patients", label: "Pacientes", icon: UsersThree },
  { href: "/team", label: "Equipe", icon: UserGear },
  { href: "/schedule", label: "Escala", icon: CalendarCheck },
  { href: "/financial", label: "Financeiro", icon: CurrencyCircleDollar },
  { href: "/inventory", label: "Estoque", icon: Package },
  { href: "/admin/contractors", label: "Operadoras", icon: Buildings },
  { href: "/admin", label: "Admin", icon: GearSix },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Topbar />
      <div className="flex min-h-[calc(100vh-3rem)]">
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r bg-white/90 backdrop-blur transition-all duration-200",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex items-center justify-between px-3 py-3">
            <span className={cn("text-xs uppercase tracking-[0.2em] text-slate-400", collapsed && "sr-only")}>
              Navegação
            </span>
            <button
              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-[#0F2B45] hover:text-[#0F2B45]"
              onClick={() => setCollapsed((p) => !p)}
              title="Recolher/expandir"
            >
              <ListBullets weight="bold" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#0F2B45]",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-5 w-5" weight="duotone" />
                <span className={cn(collapsed && "sr-only")}>{label}</span>
              </Link>
            ))}
          </nav>
          <div className={cn("border-t px-3 py-4 text-xs text-slate-500", collapsed && "text-center")}>
            <span className={cn(collapsed && "sr-only")}>Layout protegido</span>
          </div>
        </aside>

        <div className="flex-1 min-h-screen relative">
          <div className="bg-[#0B2F53] text-white px-6 py-3">
            <Breadcrumbs />
          </div>
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </div>
  );
}
