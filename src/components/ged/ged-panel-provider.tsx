'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GedPanel, GedPanelFilters, GedPanelPatientInfo } from "./GedPanel";

export type GedPanelRequest = {
  title?: string;
  filters?: Partial<GedPanelFilters> | null;
};

type GedPanelContextValue = {
  openGedPanel: (request?: GedPanelRequest) => void;
  closeGedPanel: () => void;
};

const GedPanelContext = createContext<GedPanelContextValue | undefined>(undefined);

export function useGedPanel() {
  const ctx = useContext(GedPanelContext);
  if (!ctx) throw new Error("useGedPanel deve ser usado dentro de GedPanelProvider");
  return ctx;
}

export function GedPanelProvider({ patientId, patientInfo, children }: { patientId: string; patientInfo?: GedPanelPatientInfo | null; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<GedPanelRequest | undefined>(undefined);

  const openGedPanel = useCallback((next?: GedPanelRequest) => {
    setRequest(next);
    setOpen(true);
  }, []);

  const closeGedPanel = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openGedPanel, closeGedPanel }), [openGedPanel, closeGedPanel]);

  return (
    <GedPanelContext.Provider value={value}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-6xl p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>{request?.title || "GED do Paciente"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <GedPanel patientId={patientId} initialFilters={request?.filters || null} patientInfo={patientInfo} />
          </div>
        </SheetContent>
      </Sheet>
    </GedPanelContext.Provider>
  );
}
