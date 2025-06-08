"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

interface TouchscreenTestProps {
  onTestComplete: (result: TouchTestResult) => void;
  testDuration?: number;
  showFloatingControls?: boolean;
}

export function TouchscreenTest({
  onTestComplete,
  testDuration = 10000,
  showFloatingControls = false,
}: TouchscreenTestProps) {
  const [isTestActive, setIsTestActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [touches, setTouches] = useState<TouchPoint[]>([]);
  const [currentTouches, setCurrentTouches] = useState<Map<number, TouchPoint>>(
    new Map()
  );
  const [maxSimultaneous, setMaxSimultaneous] = useState(0);

  const testAreaRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchCountRef = useRef(0);
  const responseTimes = useRef<number[]>([]);

  const startTest = useCallback(() => {
    setIsTestActive(true);
    setTimeRemaining(testDuration);
    setTouches([]);
    setCurrentTouches(new Map());
    setMaxSimultaneous(0);
    touchCountRef.current = 0;
    responseTimes.current = [];
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          setIsTestActive(false);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  }, [testDuration]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isTestActive) return;

      e.preventDefault();
      const touchStartTime = Date.now();
      const newTouches = new Map(currentTouches);

      Array.from(e.changedTouches).forEach((touch) => {
        const rect = testAreaRef.current?.getBoundingClientRect();
        if (!rect) return;

        const touchPoint: TouchPoint = {
          id: touch.identifier,
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          timestamp: touchStartTime,
        };

        newTouches.set(touch.identifier, touchPoint);
        touchCountRef.current++;

        // Measure response time (simplified - time since touch start)
        responseTimes.current.push(Date.now() - touchStartTime);
      });

      setCurrentTouches(newTouches);
      setMaxSimultaneous((prev) => Math.max(prev, newTouches.size));
      setTouches((prev) => [...prev, ...Array.from(newTouches.values())]);
    },
    [isTestActive, currentTouches]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isTestActive) return;

      e.preventDefault();
      const newTouches = new Map(currentTouches);

      Array.from(e.changedTouches).forEach((touch) => {
        newTouches.delete(touch.identifier);
      });

      setCurrentTouches(newTouches);
    },
    [isTestActive, currentTouches]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isTestActive) return;
      e.preventDefault();
    },
    [isTestActive]
  );

  useEffect(() => {
    if (!isTestActive && timeRemaining === 0 && touches.length > 0) {
      const testResult: TouchTestResult = {
        multiTouchSupported: maxSimultaneous > 1,
        maxSimultaneousTouches: maxSimultaneous,
        averageResponseTime:
          responseTimes.current.length > 0
            ? responseTimes.current.reduce((a, b) => a + b, 0) /
              responseTimes.current.length
            : 0,
        totalTouches: touchCountRef.current,
        testDuration: testDuration,
        touchPoints: touches,
      };

      onTestComplete(testResult);
    }
  }, [
    isTestActive,
    timeRemaining,
    touches,
    maxSimultaneous,
    testDuration,
    onTestComplete,
  ]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!isTestActive && timeRemaining === 0 && touches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        {/* Test Region - Top section without scrolling */}
        <div className="h-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-blue-600">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-300 rounded-full flex items-center justify-center">
                <span className="text-2xl">👆</span>
              </div>
              <h2 className="text-2xl font-bold">Test Region</h2>
              <p className="text-sm mt-2">
                Touch testing area will appear here
              </p>
            </div>
          </div>
        </div>

        {/* Description - Bottom section */}
        <div className="h-1/2 p-6 flex flex-col justify-center">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Touch Screen Test
              </h1>
              <p className="text-lg text-gray-600">
                Test your device's touchscreen functionality. The robot will
                perform tasks without needing to scroll down.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Instructions
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Test region will appear in the top half of the screen
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Use single and multi-touch gestures in the test area
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Test will automatically complete after{" "}
                      {testDuration / 1000} seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Start Button */}
        {showFloatingControls ? (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={startTest}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 shadow-lg"
            >
              Start Test ({testDuration / 1000}s)
            </Button>
          </div>
        ) : (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
            <Button
              onClick={startTest}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 shadow-lg"
            >
              Start Test ({testDuration / 1000}s)
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Test Area - Top half of screen */}
      <div className="h-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative">
        {/* Floating Status */}
        {showFloatingControls && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-50">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {Math.ceil(timeRemaining / 1000)}s | Touches:{" "}
                {touchCountRef.current} | Max: {maxSimultaneous}
              </div>
              <div className="w-48 h-1 bg-gray-200 rounded-full mt-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      ((testDuration - timeRemaining) / testDuration) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!showFloatingControls && (
          <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 z-10">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-900">
                Time: {Math.ceil(timeRemaining / 1000)}s
              </div>
              <div className="text-sm text-gray-600">
                Touches: {touchCountRef.current} | Max: {maxSimultaneous}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    ((testDuration - timeRemaining) / testDuration) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Touch Area */}
        <div
          ref={testAreaRef}
          className="absolute inset-0 pt-16"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          style={{ touchAction: "none" }}
        >
          {/* Instructions */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-blue-600">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-300 rounded-full flex items-center justify-center">
                <span className="text-2xl">👆</span>
              </div>
              <p className="text-lg font-medium">Tap anywhere in this area</p>
              <p className="text-sm mt-1">
                Try single and multi-touch gestures
              </p>
            </div>
          </div>

          {/* Active Touch Points */}
          {Array.from(currentTouches.values()).map((touch) => (
            <div
              key={touch.id}
              className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-blue-500 bg-opacity-50 border-2 border-blue-600 pointer-events-none"
              style={{
                left: touch.x,
                top: touch.y,
              }}
            />
          ))}

          {/* Touch History (fade out) */}
          {touches.slice(-20).map((touch, index) => (
            <div
              key={`${touch.id}-${touch.timestamp}`}
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-blue-400 pointer-events-none"
              style={{
                left: touch.x,
                top: touch.y,
                opacity: Math.max(0.1, (index + 1) / 20),
              }}
            />
          ))}
        </div>
      </div>

      {/* Description Section - Bottom half */}
      <div className="h-1/2 p-6 flex flex-col justify-center bg-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Touch Screen Test Active
            </h1>
            <p className="text-lg text-gray-600">
              The robot can perform touch tasks in the top region without
              scrolling.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Test Progress
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {touchCountRef.current}
                </div>
                <div className="text-gray-600">Total Touches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {maxSimultaneous}
                </div>
                <div className="text-gray-600">Max Simultaneous</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
