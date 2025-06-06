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
}

export function TouchscreenTest({
  onTestComplete,
  testDuration = 10000,
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Touchscreen Test</h1>
          <p className="text-gray-600 max-w-md">
            Test your device's touchscreen functionality. Tap anywhere on the
            screen using single and multiple fingers.
          </p>
        </div>

        <Button
          onClick={startTest}
          className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700"
        >
          Start Test ({testDuration / 1000}s)
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Test Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-900">
            Time: {Math.ceil(timeRemaining / 1000)}s
          </div>
          <div className="text-sm text-gray-600">
            Touches: {touchCountRef.current} | Max Simultaneous:{" "}
            {maxSimultaneous}
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

      {/* Test Area */}
      <div
        ref={testAreaRef}
        className="absolute inset-0 pt-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{ touchAction: "none" }}
      >
        {/* Instructions */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Tap anywhere on the screen</p>
            <p className="text-sm mt-1">Try single and multi-touch gestures</p>
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
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-gray-400 pointer-events-none"
            style={{
              left: touch.x,
              top: touch.y,
              opacity: Math.max(0.1, (index + 1) / 20),
            }}
          />
        ))}
      </div>
    </div>
  );
}
