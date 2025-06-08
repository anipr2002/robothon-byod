"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle } from "lucide-react";

interface DisplayDefectResult {
  testCompleted: boolean;
  duration: number;
  timestamp: number;
}

interface DisplayDefectTestProps {
  onTestComplete: (result: DisplayDefectResult) => void;
  showFloatingControls?: boolean;
}

export function DisplayDefectTest({
  onTestComplete,
  showFloatingControls = false,
}: DisplayDefectTestProps) {
  const [testState, setTestState] = useState<"ready" | "running" | "completed">(
    "ready"
  );
  const [currentColor, setCurrentColor] = useState<"red" | "green" | null>(
    null
  );
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const handleStartTest = useCallback(() => {
    setTestState("running");
    setStartTime(Date.now());
    setCurrentColor("red");
  }, []);

  useEffect(() => {
    if (testState !== "running") return;

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timer);
  }, [testState, startTime]);

  useEffect(() => {
    if (testState !== "running") return;

    let colorTimer: NodeJS.Timeout;

    if (currentColor === "red") {
      // Show red for 3 seconds
      colorTimer = setTimeout(() => {
        setCurrentColor("green");
      }, 3000);
    } else if (currentColor === "green") {
      // Show green for 3 seconds, then complete
      colorTimer = setTimeout(() => {
        setTestState("completed");
        const duration = Date.now() - startTime;

        const result: DisplayDefectResult = {
          testCompleted: true,
          duration,
          timestamp: Date.now(),
        };

        onTestComplete(result);
      }, 3000);
    }

    return () => {
      if (colorTimer) clearTimeout(colorTimer);
    };
  }, [currentColor, startTime, onTestComplete, testState]);

  const getBackgroundColor = () => {
    switch (currentColor) {
      case "red":
        return "rgb(255, 0, 0)";
      case "green":
        return "rgb(0, 255, 0)";
      default:
        return "rgb(50, 50, 50)";
    }
  };

  const getColorProgress = () => {
    if (testState !== "running") return 0;

    const timeInCurrentColor = elapsedTime % 3000;
    return (timeInCurrentColor / 3000) * 100;
  };

  if (testState === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">
            Display Defect Test Completed
          </h2>
          <p className="text-gray-600">
            Robot camera analysis completed successfully
          </p>
        </div>
      </div>
    );
  }

  if (testState === "running") {
    return (
      <div
        className="min-h-screen w-full relative flex items-center justify-center"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {/* Floating Status - Always visible at top */}
        {showFloatingControls && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full z-40">
            <div className="text-center">
              <div className="text-xs font-medium">
                {currentColor?.toUpperCase()} -{" "}
                {Math.ceil((3000 - (elapsedTime % 3000)) / 1000)}s
              </div>
              <div className="w-24 h-1 bg-white/30 rounded-full mt-1">
                <div
                  className="h-1 bg-white rounded-full transition-all duration-100"
                  style={{ width: `${getColorProgress()}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Center Text */}
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-2">
            {currentColor?.toUpperCase()}
          </h1>
          <p className="text-lg opacity-80">
            Robot camera analyzing display...
          </p>
        </div>
      </div>
    );
  }

  // Ready state
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Test Description */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Display Defect Analysis
            </h1>
            <p className="text-lg text-gray-600">
              This test displays RGB colors on the entire screen for robot
              camera verification.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Test Process
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Red Display</h3>
                  <p className="text-sm text-gray-600">
                    Screen will turn red for 3 seconds
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Green Display</h3>
                  <p className="text-sm text-gray-600">
                    Screen will turn green for 3 seconds
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Robot Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Robot camera verifies display quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Start Button */}
      {showFloatingControls ? (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={handleStartTest}
            className="bg-blue-600 hover:bg-blue-700 text-sm px-6 py-2 shadow-lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Test
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={handleStartTest}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Test
          </Button>
        </div>
      )}
    </div>
  );
}
