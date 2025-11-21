import Link from "next/link";
import { ReactNode } from "react";
import { CalendarCheck, ChartPieSlice, CurrencyCircleDollar, Package, UsersThree } from "@phosphor-icons/react/dist/ssr";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartPieSlice },
  { href: "/patients", label: "Pacientes", icon: UsersThree },
  { href: "/schedule", label: "Escala", icon: CalendarCheck },
  { href: "/financial", label: "Financeiro", icon: CurrencyCircleDollar },
  { href: "/inventory", label: "Estoque", icon: Package },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col border-r bg-white/90 backdrop-blur">
          <div className="px-6 py-5 text-xl font-bold tracking-tight text-[#0F2B45]">
            Conecta Care
          </div>
          <div className="px-6 pb-4 text-xs uppercase tracking-[0.2em] text-slate-400">
            Navegação
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#0F2B45]"
              >
                <Icon className="h-5 w-5" weight="duotone" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t px-6 py-4 text-xs text-slate-500">
            Layout protegido
          </div>
        </aside>

        <div className="flex-1 min-h-screen">
          <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur">
            <div className="text-base font-semibold text-[#0F2B45]">Conecta Care</div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              {navItems.slice(0, 3).map(({ href, label }) => (
                <Link key={href} href={href} className="rounded-full border px-3 py-1 hover:border-[#0F2B45]">
                  {label}
                </Link>
              ))}
            </div>
          </header>
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </div>
  );
}
