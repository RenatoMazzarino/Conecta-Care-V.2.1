"use client";

import { createContext, useContext } from "react";

export type PatientEditModeContextValue = {
  isEditing: boolean;
  enableEdit: () => void;
  disableEdit: () => void;
  toggleEdit: () => void;
};

const PatientEditModeContext = createContext<PatientEditModeContextValue | null>(null);

export const PatientEditModeProvider = PatientEditModeContext.Provider;

export function usePatientEditMode() {
  const context = useContext(PatientEditModeContext);
  if (!context) {
    throw new Error("usePatientEditMode must be used within a PatientEditModeProvider");
  }
  return context;
}
