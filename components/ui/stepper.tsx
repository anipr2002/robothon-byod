"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export type StepStatus = "pending" | "active" | "completed" | "error";

interface StepperProps {
  steps: Step[];
  currentStep: number;
  stepStatuses?: Record<string, StepStatus>;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  stepStatuses = {},
  orientation = "horizontal",
  className,
}: StepperProps) {
  const getStepStatus = (index: number, stepId: string): StepStatus => {
    if (stepStatuses[stepId]) {
      return stepStatuses[stepId];
    }
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  if (orientation === "vertical") {
    return (
      <div className={cn("flex flex-col space-y-4", className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(index, step.id);
          return (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    {
                      "bg-blue-600 text-white": status === "active",
                      "bg-green-600 text-white": status === "completed",
                      "bg-red-600 text-white": status === "error",
                      "bg-gray-200 text-gray-600": status === "pending",
                    }
                  )}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : status === "error" ? (
                    "!"
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 mt-2 transition-colors",
                      status === "completed" ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={cn("font-medium transition-colors", {
                    "text-blue-600": status === "active",
                    "text-green-600": status === "completed",
                    "text-red-600": status === "error",
                    "text-gray-900": status === "pending",
                  })}
                >
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(index, step.id);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center space-x-4">
            <div className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  {
                    "bg-blue-600 text-white": status === "active",
                    "bg-green-600 text-white": status === "completed",
                    "bg-red-600 text-white": status === "error",
                    "bg-gray-200 text-gray-600": status === "pending",
                  }
                )}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : status === "error" ? (
                  "!"
                ) : (
                  index + 1
                )}
              </div>
              <div className="text-center min-w-0">
                <h3
                  className={cn("text-xs font-medium transition-colors", {
                    "text-blue-600": status === "active",
                    "text-green-600": status === "completed",
                    "text-red-600": status === "error",
                    "text-gray-900": status === "pending",
                  })}
                >
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5 transition-colors",
                  status === "completed" ? "bg-green-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
