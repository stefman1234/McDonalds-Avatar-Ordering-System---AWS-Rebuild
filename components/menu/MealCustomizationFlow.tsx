"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { MenuItemDTO } from "@/lib/types";

interface CustomizationStep {
  type: "side" | "drink" | "size";
  label: string;
  question: string;
  options: { id: number; name: string; price: number }[];
  defaultId: number | null;
}

interface MealCustomizationFlowProps {
  open: boolean;
  onClose: () => void;
  mealName: string;
  steps: CustomizationStep[];
  onComplete: (selections: Record<string, { id: number; name: string; price: number }>) => void;
}

export default function MealCustomizationFlow({
  open,
  onClose,
  mealName,
  steps,
  onComplete,
}: MealCustomizationFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, { id: number; name: string; price: number }>>({});

  const step = steps[currentStep];
  if (!step) return null;

  const selectedId = selections[step.type]?.id ?? step.defaultId;

  function handleSelect(option: { id: number; name: string; price: number }) {
    setSelections((prev) => ({ ...prev, [step.type]: option }));
  }

  function handleNext() {
    // Auto-select default if nothing picked
    if (!selections[step.type] && step.defaultId) {
      const defaultOption = step.options.find((o) => o.id === step.defaultId);
      if (defaultOption) {
        setSelections((prev) => ({ ...prev, [step.type]: defaultOption }));
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete(selections);
      setCurrentStep(0);
      setSelections({});
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mealName} size="md">
      <div className="py-2">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <div key={s.type} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-mcdonalds-red" : "bg-gray-200"
                }`}
              />
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-1">
          Step {currentStep + 1} of {steps.length} - {step.label}
        </p>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{step.question}</h3>

        {/* Options */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {step.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                selectedId === option.id
                  ? "border-mcdonalds-yellow bg-mcdonalds-yellow/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="font-medium text-gray-900">{option.name}</span>
              {option.price > 0 && (
                <span className="text-sm text-gray-500">${option.price.toFixed(2)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <button onClick={handleBack} className="flex-1 btn-outline py-3">
              Back
            </button>
          )}
          <button onClick={handleNext} className="flex-1 btn-primary py-3">
            {currentStep < steps.length - 1 ? "Next" : "Add to Order"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
