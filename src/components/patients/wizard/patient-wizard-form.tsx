'use client';

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WizardStepper } from "./wizard-stepper";
import { StepPersonal } from "./StepPersonal";
import { StepAddress } from "./StepAddress";
import { StepFinancial } from "./StepFinancial";
import { StepReview } from "./StepReview";

export function PatientWizardForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const stepParam = Number(searchParams.get("step") || "1");
  const [currentStep, setCurrentStep] = useState<number>(stepParam || 1);
  const patientIdParam = searchParams.get("patientId");
  const [patientId, setPatientId] = useState<string | null>(patientIdParam);

  useEffect(() => {
    setCurrentStep(stepParam || 1);
    setPatientId(patientIdParam);
  }, [stepParam, patientIdParam]);

  const goToStep = (step: number, pid?: string) => {
    const nextPid = pid || patientId || null;
    setCurrentStep(step);
    if (nextPid) setPatientId(nextPid);

    const qs = new URLSearchParams(searchParams.toString());
    qs.set("step", step.toString());
    if (nextPid) qs.set("patientId", nextPid);
    const nextUrl = `${pathname}?${qs.toString()}`;
    router.replace(nextUrl);
  };

  const stepComponent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <StepPersonal patientId={patientId} onComplete={(id) => goToStep(2, id)} />;
      case 2:
        return <StepAddress patientId={patientId} onComplete={() => goToStep(3)} onBack={() => goToStep(1)} />;
      case 3:
        return (
          <StepFinancial
            patientId={patientId}
            onComplete={() => goToStep(4)}
            onSkip={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        );
      default:
        return <StepReview patientId={patientId} onBack={() => goToStep(3)} />;
    }
  }, [currentStep, patientId]);

  return (
    <div className="space-y-6">
      <WizardStepper currentStep={currentStep} />
      {stepComponent}
    </div>
  );
}
