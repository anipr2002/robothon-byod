"use client";

import { useState, useCallback } from "react";
import { TouchscreenTest } from "./touchscreen-test";
import { ShapeTracingTest } from "./shape-tracing-test";
import { Stepper, Step, StepStatus } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface TouchTestResult {
  multiTouchSupported: boolean;
  maxSimultaneousTouches: number;
  averageResponseTime: number;
  totalTouches: number;
  testDuration: number;
  touchPoints: TouchPoint[];
}

interface ShapeTracingResult {
  shape: "square" | "diamond";
  accuracy: number;
  completionTime: number;
  tracePoints: Array<{ x: number; y: number; timestamp: number }>;
  totalDistance: number;
  deviationScore: number;
}

interface EnhancedTouchTestResult {
  basicTouch: TouchTestResult; // Keep for compatibility but create dummy data
  squareTracing: ShapeTracingResult;
  diamondTracing: ShapeTracingResult;
  overallScore: number;
}

interface EnhancedTouchscreenTestProps {
  onTestComplete: (result: EnhancedTouchTestResult) => void;
}

const testSteps: Step[] = [
  {
    id: "square-tracing",
    title: "Square Tracing",
    description: "Trace a square shape accurately",
  },
  {
    id: "diamond-tracing",
    title: "Diamond Tracing",
    description: "Trace a diamond shape accurately",
  },
  {
    id: "results",
    title: "Results",
    description: "View combined test results",
  },
];

export function EnhancedTouchscreenTest({
  onTestComplete,
}: EnhancedTouchscreenTestProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    {}
  );
  const [squareTracingResult, setSquareTracingResult] =
    useState<ShapeTracingResult | null>(null);
  const [diamondTracingResult, setDiamondTracingResult] =
    useState<ShapeTracingResult | null>(null);

  const currentStep = testSteps[currentStepIndex];

  const updateStepStatus = useCallback((stepId: string, status: StepStatus) => {
    setStepStatuses((prev) => ({ ...prev, [stepId]: status }));
  }, []);

  const calculateOverallScore = useCallback(
    (square: ShapeTracingResult, diamond: ShapeTracingResult): number => {
      // Shape tracing scoring (50% each)
      const squareScore = square.accuracy;
      const diamondScore = diamond.accuracy;

      // Average of both shape scores
      const overall = (squareScore + diamondScore) / 2;
      return Math.round(overall);
    },
    []
  );

  const handleSquareTracingComplete = useCallback(
    (result: ShapeTracingResult) => {
      setSquareTracingResult(result);
      updateStepStatus("square-tracing", "completed");
      updateStepStatus("diamond-tracing", "active");
      setCurrentStepIndex(1);
    },
    [updateStepStatus]
  );

  const handleDiamondTracingComplete = useCallback(
    (result: ShapeTracingResult) => {
      setDiamondTracingResult(result);
      updateStepStatus("diamond-tracing", "completed");
      updateStepStatus("results", "completed");
      setCurrentStepIndex(2);

      // Calculate final results
      if (squareTracingResult) {
        const overallScore = calculateOverallScore(squareTracingResult, result);

        // Create dummy basic touch data for compatibility
        const dummyBasicTouch: TouchTestResult = {
          multiTouchSupported: true,
          maxSimultaneousTouches: 2,
          averageResponseTime: 50,
          totalTouches: 20,
          testDuration: 10000,
          touchPoints: [],
        };

        const finalResult: EnhancedTouchTestResult = {
          basicTouch: dummyBasicTouch,
          squareTracing: squareTracingResult,
          diamondTracing: result,
          overallScore,
        };

        onTestComplete(finalResult);
      }
    },
    [
      squareTracingResult,
      calculateOverallScore,
      onTestComplete,
      updateStepStatus,
    ]
  );

  const handleStartTest = useCallback(() => {
    updateStepStatus("square-tracing", "active");
  }, [updateStepStatus]);

  // Initial start screen
  if (currentStepIndex === 0 && !stepStatuses["square-tracing"]) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Enhanced Touchscreen Test
            </h1>
            <p className="text-gray-600">
              This comprehensive test evaluates your touchscreen's capabilities
              through multiple subtests.
            </p>
          </div>

          {/* Test Preview */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Test Components
            </h2>
            <Stepper
              steps={testSteps}
              currentStep={-1}
              stepStatuses={stepStatuses}
              orientation="vertical"
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleStartTest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
            >
              Start Enhanced Test
            </Button>
            <p className="text-sm text-gray-500">Estimated time: 2-3 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Progress Indicator */}
      <div className="bg-white/90 backdrop-blur-sm p-3 border-b">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900">
              {currentStep.title} ({currentStepIndex + 1}/{testSteps.length})
            </span>
            <div className="flex space-x-1">
              {testSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStepIndex
                      ? "bg-blue-600"
                      : stepStatuses[step.id] === "completed"
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Test Content - No extra padding */}
      <div>
        {currentStep.id === "square-tracing" && (
          <ShapeTracingTest
            shape="square"
            onComplete={handleSquareTracingComplete}
            testDuration={15000}
          />
        )}

        {currentStep.id === "diamond-tracing" && (
          <ShapeTracingTest
            shape="diamond"
            onComplete={handleDiamondTracingComplete}
            testDuration={15000}
          />
        )}

        {currentStep.id === "results" &&
          squareTracingResult &&
          diamondTracingResult && (
            <div className="flex items-center justify-center min-h-96 p-4">
              <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-sm space-y-6">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Test Complete!
                  </h2>
                  <div className="text-6xl font-bold text-blue-600">
                    {calculateOverallScore(
                      squareTracingResult,
                      diamondTracingResult
                    )}
                    %
                  </div>
                  <p className="text-gray-600">Overall Touchscreen Score</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Square Tracing
                    </h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {squareTracingResult.accuracy}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {(squareTracingResult.completionTime / 1000).toFixed(1)}s
                      • {squareTracingResult.tracePoints.length} points
                    </p>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Diamond Tracing
                    </h3>
                    <div className="text-2xl font-bold text-purple-600">
                      {diamondTracingResult.accuracy}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {(diamondTracingResult.completionTime / 1000).toFixed(1)}s
                      • {diamondTracingResult.tracePoints.length} points
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600">
                    Results will be processed automatically...
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
