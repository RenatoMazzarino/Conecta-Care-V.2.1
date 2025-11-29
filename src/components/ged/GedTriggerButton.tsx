'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FolderSimple } from "@phosphor-icons/react";
import { useGedPanel, type GedPanelRequest } from "./ged-panel-provider";

type ButtonProps = React.ComponentProps<typeof Button>;

export type GedTriggerButtonProps = ButtonProps & GedPanelRequest & {
  icon?: React.ReactNode;
  label?: React.ReactNode;
};

export function GedTriggerButton({ icon, label, title, filters, children, onClick, ...buttonProps }: GedTriggerButtonProps) {
  const { openGedPanel } = useGedPanel();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    openGedPanel({ title, filters });
  };

  return (
    <Button onClick={handleClick} {...buttonProps}>
      {children || (
        <>
          {icon ?? <FolderSimple size={16} />}
          {label ?? "Documentos (GED)"}
        </>
      )}
    </Button>
  );
}
