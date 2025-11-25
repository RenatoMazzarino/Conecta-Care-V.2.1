'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Pacientes",
  team: "Equipe",
  schedule: "Escala",
  financial: "Financeiro",
  inventory: "Estoque",
  admin: "Administração",
  contractors: "Operadoras",
  services: "Serviços",
  integrations: "Integrações",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const items = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    return {
      href,
      label: labels[seg] || seg.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      isLast: idx === segments.length - 1,
    };
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-white/80">
      <Link href="/dashboard" className="font-semibold text-white hover:underline">
        Conecta Care
      </Link>
      {items.map((item) => (
        <div key={item.href} className="flex items-center gap-2">
          <CaretRight size={12} weight="bold" className="text-white/70" />
          {item.isLast ? (
            <span className="font-semibold text-white">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
