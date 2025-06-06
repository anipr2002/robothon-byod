"use client";

import { useState, useCallback, useEffect } from "react";
import { Stepper, Step, StepStatus } from "@/components/ui/stepper";
import { TouchscreenTest } from "./touchscreen-test";
import { EnhancedTouchscreenTest } from "./enhanced-touchscreen-test";
import { DiagnosticReport } from "./diagnostic-report";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward } from "lucide-react";

interface TouchTestResult {
  multiTouchSupported: boolean;
  maxSimultaneousTouches: number;
  averageResponseTime: number;
  totalTouches: number;
  testDuration: number;
  touchPoints: Array<{
    id: number;
    x: number;
    y: number;
    timestamp: number;
  }>;
}

interface ShapeTracingResult {
  shape: "square" | "circle";
  accuracy: number;
  completionTime: number;
  tracePoints: Array<{ x: number; y: number; timestamp: number }>;
  totalDistance: number;
  deviationScore: number;
}

interface EnhancedTouchTestResult {
  basicTouch: TouchTestResult;
  squareTracing: ShapeTracingResult;
  circleTracing: ShapeTracingResult;
  overallScore: number;
}

interface TestSuiteResult {
  touchscreen?: EnhancedTouchTestResult;
  // Future tests can be added here
  // camera?: CameraTestResult;
  // sensors?: SensorTestResult;
}

interface TestSuiteProps {
  onComplete: (results: TestSuiteResult) => void;
  onPublishResult: (results: TestSuiteResult) => void;
  isPublishing: boolean;
  publishSuccess?: boolean;
  rosConnected: boolean;
}

const testSteps: Step[] = [
  {
    id: "touchscreen",
    title: "Touchscreen",
    description: "Test touch responsiveness and multi-touch capabilities",
  },
  {
    id: "camera",
    title: "Camera",
    description: "Test camera functionality (coming soon)",
  },
  {
    id: "sensors",
    title: "Sensors",
    description: "Test device sensors (coming soon)",
  },
  {
    id: "report",
    title: "Report",
    description: "Generate comprehensive diagnostic report",
  },
];

export function TestSuite({
  onComplete,
  onPublishResult,
  isPublishing,
  publishSuccess,
  rosConnected,
}: TestSuiteProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    {}
  );
  const [results, setResults] = useState<TestSuiteResult>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const currentStep = testSteps[currentStepIndex];

  const updateStepStatus = useCallback((stepId: string, status: StepStatus) => {
    setStepStatuses((prev) => ({ ...prev, [stepId]: status }));
  }, []);

  const handleTouchscreenComplete = useCallback(
    (result: EnhancedTouchTestResult) => {
      const newResults = { ...results, touchscreen: result };
      setResults(newResults);
      updateStepStatus("touchscreen", "completed");

      // Auto-advance to next step (skip camera and sensors for now)
      setTimeout(() => {
        setCurrentStepIndex(3); // Jump to report
      }, 1000);
    },
    [results, updateStepStatus]
  );

  const handleStartTest = useCallback(() => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    setStepStatuses({});
    setResults({});
    updateStepStatus("touchscreen", "active");
  }, [updateStepStatus]);

  const handlePauseResume = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleSkipStep = useCallback(() => {
    if (currentStepIndex < testSteps.length - 1) {
      updateStepStatus(currentStep.id, "completed");
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, currentStep, updateStepStatus]);

  const handleRetry = useCallback(() => {
    setCurrentStepIndex(0);
    setStepStatuses({});
    setResults({});
    setIsRunning(true);
    updateStepStatus("touchscreen", "active");
  }, [updateStepStatus]);

  const handlePublish = useCallback(() => {
    onPublishResult(results);
  }, [results, onPublishResult]);

  // Auto-complete when reaching report step
  useEffect(() => {
    if (currentStepIndex === 3 && results.touchscreen) {
      updateStepStatus("report", "completed");
      onComplete(results);
    }
  }, [currentStepIndex, results, updateStepStatus, onComplete]);

  // If not started yet, show start screen
  if (!isRunning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Diagnostic Test Suite
            </h1>
            <p className="text-gray-600">
              Run a comprehensive suite of diagnostic tests to evaluate your
              device's capabilities.
            </p>
          </div>

          {/* Test Preview */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Test Overview
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
              <Play className="w-5 h-5 mr-2" />
              Start Test Suite
            </Button>
            <p className="text-sm text-gray-500">Estimated time: 1-2 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // Show report if we've reached the final step
  if (currentStepIndex === 3 && results.touchscreen) {
    return (
      <DiagnosticReport
        results={results}
        onRetry={handleRetry}
        onPublishResult={handlePublish}
        isPublishing={isPublishing}
        publishSuccess={publishSuccess}
        rosConnected={rosConnected}
      />
    );
  }

  // Show current test
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Stepper */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              Diagnostic Test Suite
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handlePauseResume}
                variant="outline"
                size="sm"
                disabled={currentStepIndex >= 3}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={handleSkipStep}
                variant="outline"
                size="sm"
                disabled={
                  currentStepIndex >= 3 || currentStep.id === "touchscreen"
                }
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Stepper
            steps={testSteps}
            currentStep={currentStepIndex}
            stepStatuses={stepStatuses}
            orientation="horizontal"
          />
        </div>
      </div>

      {/* Current Test Content */}
      <div className="pt-4">
        {currentStep.id === "touchscreen" && !isPaused && (
          <EnhancedTouchscreenTest onTestComplete={handleTouchscreenComplete} />
        )}

        {currentStep.id === "camera" && (
          <div className="flex items-center justify-center min-h-96 p-4">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Camera Test</h2>
              <p className="text-gray-600">This test is coming soon!</p>
              <Button onClick={handleSkipStep}>Skip for Now</Button>
            </div>
          </div>
        )}

        {currentStep.id === "sensors" && (
          <div className="flex items-center justify-center min-h-96 p-4">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Sensor Test</h2>
              <p className="text-gray-600">This test is coming soon!</p>
              <Button onClick={handleSkipStep}>Skip for Now</Button>
            </div>
          </div>
        )}

        {isPaused && (
          <div className="flex items-center justify-center min-h-96 p-4">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Test Paused</h2>
              <p className="text-gray-600">Test suite is currently paused</p>
              <Button onClick={handlePauseResume}>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
