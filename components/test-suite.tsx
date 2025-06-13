"use client";

import { useState, useCallback, useEffect } from "react";
import { Stepper, Step, StepStatus } from "@/components/ui/stepper";
import { EnhancedTouchscreenTest } from "./enhanced-touchscreen-test";
import { DisplayDefectTest } from "./display-defect-test";
import { ProximitySensorTest } from "./proximity-sensor-test";
import { DiagnosticReport } from "./diagnostic-report";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Clock, CheckCircle } from "lucide-react";
import { useRos } from "@/lib/use-ros";

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
  shape: "square" | "diamond";
  accuracy: number;
  completionTime: number;
  tracePoints: Array<{ x: number; y: number; timestamp: number }>;
  totalDistance: number;
  deviationScore: number;
}

interface EnhancedTouchTestResult {
  basicTouch: TouchTestResult;
  squareTracing: ShapeTracingResult;
  diamondTracing: ShapeTracingResult;
  overallScore: number;
}

interface DisplayDefectResult {
  testCompleted: boolean;
  duration: number;
  timestamp: number;
}

interface ProximitySensorResult {
  sensorActivated: boolean;
  activationTime: number;
  testDuration: number;
  success: boolean;
}

interface TestSuiteResult {
  touchscreen?: EnhancedTouchTestResult;
  displayDefect?: DisplayDefectResult;
  proximitySensor?: ProximitySensorResult;
}

interface TestSuiteProps {
  onComplete: (results: TestSuiteResult) => void;
  onPublishResult: (results: TestSuiteResult) => void;
  isPublishing: boolean;
  publishSuccess?: boolean;
  rosConnected: boolean;
  rosUrl?: string;
}

const testSteps: Step[] = [
  {
    id: "touchscreen",
    title: "Touch Screen",
    description: "Test touch responsiveness without scrolling",
  },
  {
    id: "display",
    title: "Display Defect",
    description: "RGB color analysis by robot camera",
  },
  {
    id: "proximity",
    title: "Proximity Sensor",
    description: "Test proximity sensor activation",
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
  rosUrl = "ws://localhost:9090",
}: TestSuiteProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    {}
  );
  const [results, setResults] = useState<TestSuiteResult>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForRobot, setIsWaitingForRobot] = useState(false);
  const [waitingForTest, setWaitingForTest] = useState<string>("");

  const currentStep = testSteps[currentStepIndex];

  const updateStepStatus = useCallback((stepId: string, status: StepStatus) => {
    setStepStatuses((prev) => ({ ...prev, [stepId]: status }));
  }, []);

  // ROS connection
  const { ros } = useRos({ url: rosUrl });

  const publishTestMessage = useCallback(
    (testName: string, result: any) => {
      if (!rosConnected) return;

      const diagnosticMessage = {
        header: {
          stamp: {
            sec: Math.floor(Date.now() / 1000),
            nanosec: (Date.now() % 1000) * 1000000,
          },
          frame_id: `${testName}_diagnostic`,
        },
        name: testName,
        message: `${testName} test completed`,
        hardware_id: "mobile_test_suite",
        values: Object.entries(result).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      };

      onPublishResult({ [testName]: result });
    },
    [rosConnected, onPublishResult]
  );

  // Manual continue function
  const handleManualContinue = useCallback(() => {
    setIsWaitingForRobot(false);

    if (waitingForTest === "displayDefect") {
      setCurrentStepIndex(2);
      updateStepStatus("proximity", "active");
    } else if (waitingForTest === "proximitySensor") {
      setCurrentStepIndex(3);
      updateStepStatus("report", "completed");
    }

    setWaitingForTest("");
  }, [waitingForTest, updateStepStatus]);

  // Listen for robot confirmation messages
  useEffect(() => {
    if (rosConnected && ros && isWaitingForRobot) {
      try {
        // @ts-ignore - ROS library typing issues
        const topic = new ros.Topic({
          name: "/robot_test_confirmation",
          messageType: "std_msgs/String",
        });

        const handleMessage = (message: any) => {
          if (message.data === `${waitingForTest}_confirmed`) {
            handleManualContinue();
          }
        };

        topic.subscribe(handleMessage);

        return () => {
          topic.unsubscribe();
        };
      } catch (error) {
        console.error("Error subscribing to robot confirmation topic:", error);
      }
    }
  }, [
    rosConnected,
    ros,
    isWaitingForRobot,
    waitingForTest,
    handleManualContinue,
  ]);

  const handleTouchscreenComplete = useCallback(
    (result: EnhancedTouchTestResult) => {
      const newResults = { ...results, touchscreen: result };
      setResults(newResults);
      updateStepStatus("touchscreen", "completed");
      publishTestMessage("touchscreen", result);

      // Move to next test
      setTimeout(() => {
        setCurrentStepIndex(1);
        updateStepStatus("display", "active");
      }, 1000);
    },
    [results, updateStepStatus, publishTestMessage]
  );

  const handleDisplayDefectComplete = useCallback(
    (result: DisplayDefectResult) => {
      const newResults = { ...results, displayDefect: result };
      setResults(newResults);
      updateStepStatus("display", "completed");
      publishTestMessage("displayDefect", result);

      // Wait for robot confirmation
      setIsWaitingForRobot(true);
      setWaitingForTest("displayDefect");
    },
    [results, updateStepStatus, publishTestMessage]
  );

  const handleProximitySensorComplete = useCallback(
    (result: ProximitySensorResult) => {
      const newResults = { ...results, proximitySensor: result };
      setResults(newResults);
      updateStepStatus("proximity", "completed");
      publishTestMessage("proximitySensor", result);

      // Immediately update the step index and status
      setCurrentStepIndex(3);
      updateStepStatus("report", "active");
    },
    [results, updateStepStatus, publishTestMessage]
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
      if (currentStepIndex + 1 < testSteps.length - 1) {
        updateStepStatus(testSteps[currentStepIndex + 1].id, "active");
      }
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
    if (currentStepIndex === 3 && Object.keys(results).length > 0) {
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
              Run a comprehensive suite of diagnostic tests designed for robotic
              validation.
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
            <p className="text-sm text-gray-500">Estimated time: 2-3 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // Show waiting state if waiting for robot confirmation
  if (isWaitingForRobot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        {/* Floating header */}
        <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b shadow-sm z-50 pt-16">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                Step {currentStepIndex + 1}/4
              </div>
              <div className="text-lg font-semibold">
                {waitingForTest === "displayDefect"
                  ? "Display Test Complete"
                  : "Proximity Test Complete"}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStepIndex / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="pt-32 pb-24 flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Waiting for Robot
              </h2>
              <p className="text-gray-600">
                The robot is processing the test results. Please wait for
                confirmation or continue manually.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Listening for robot confirmation...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t p-4">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleManualContinue}
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Continue Anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show report if we've reached the final step
  if (currentStepIndex === 3 && Object.keys(results).length > 0) {
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
      {/* Compact Floating Progress - Always visible */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50 p-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              Step {currentStepIndex + 1}/4: {currentStep.title}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              onClick={handlePauseResume}
              variant="outline"
              size="sm"
              disabled={currentStepIndex >= 3}
              className="h-8 px-2"
            >
              {isPaused ? (
                <Play className="w-3 h-3" />
              ) : (
                <Pause className="w-3 h-3" />
              )}
            </Button>
            <Button
              onClick={handleSkipStep}
              variant="outline"
              size="sm"
              disabled={currentStepIndex >= 3}
              className="h-8 px-2"
            >
              <SkipForward className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Simple progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / testSteps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Content Area - with minimal top padding */}
      <div className="pt-16">
        {currentStep.id === "touchscreen" && !isPaused && (
          <EnhancedTouchscreenTest onTestComplete={handleTouchscreenComplete} />
        )}

        {currentStep.id === "display" && !isPaused && (
          <DisplayDefectTest
            onTestComplete={handleDisplayDefectComplete}
            showFloatingControls={true}
          />
        )}

        {currentStep.id === "proximity" && !isPaused && (
          <ProximitySensorTest
            onTestComplete={handleProximitySensorComplete}
            showFloatingControls={true}
          />
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
