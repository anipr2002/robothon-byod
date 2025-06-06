"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TracePoint {
  x: number;
  y: number;
  timestamp: number;
}

interface ShapeTracingResult {
  shape: "square" | "circle";
  accuracy: number; // 0-100 percentage
  completionTime: number;
  tracePoints: TracePoint[];
  totalDistance: number;
  deviationScore: number;
}

interface ShapeTracingTestProps {
  shape: "square" | "circle";
  onComplete: (result: ShapeTracingResult) => void;
  testDuration?: number;
}

export function ShapeTracingTest({
  shape,
  onComplete,
  testDuration = 15000,
}: ShapeTracingTestProps) {
  const [isTracing, setIsTracing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [tracePoints, setTracePoints] = useState<TracePoint[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(testDuration);
  const [startTime, setStartTime] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPath = useRef<TracePoint[]>([]);

  const shapeSize = 200;
  const centerX = 200;
  const centerY = 200;

  // Generate ideal shape points for comparison
  const generateIdealShapePoints = useCallback(
    (shape: "square" | "circle"): TracePoint[] => {
      const points: TracePoint[] = [];
      const numPoints = 100; // Number of points to generate for comparison

      if (shape === "square") {
        const halfSize = shapeSize / 2;
        // Top edge
        for (let i = 0; i < numPoints / 4; i++) {
          points.push({
            x: centerX - halfSize + (i / (numPoints / 4)) * shapeSize,
            y: centerY - halfSize,
            timestamp: 0,
          });
        }
        // Right edge
        for (let i = 0; i < numPoints / 4; i++) {
          points.push({
            x: centerX + halfSize,
            y: centerY - halfSize + (i / (numPoints / 4)) * shapeSize,
            timestamp: 0,
          });
        }
        // Bottom edge
        for (let i = 0; i < numPoints / 4; i++) {
          points.push({
            x: centerX + halfSize - (i / (numPoints / 4)) * shapeSize,
            y: centerY + halfSize,
            timestamp: 0,
          });
        }
        // Left edge
        for (let i = 0; i < numPoints / 4; i++) {
          points.push({
            x: centerX - halfSize,
            y: centerY + halfSize - (i / (numPoints / 4)) * shapeSize,
            timestamp: 0,
          });
        }
      } else if (shape === "circle") {
        const radius = shapeSize / 2;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            timestamp: 0,
          });
        }
      }

      return points;
    },
    [shape, shapeSize, centerX, centerY]
  );

  const calculateAccuracy = useCallback(
    (userPoints: TracePoint[], idealPoints: TracePoint[]): number => {
      if (userPoints.length === 0) return 0;

      let totalDeviation = 0;
      let validPoints = 0;

      userPoints.forEach((userPoint) => {
        // Find the closest ideal point
        let minDistance = Infinity;
        idealPoints.forEach((idealPoint) => {
          const distance = Math.sqrt(
            Math.pow(userPoint.x - idealPoint.x, 2) +
              Math.pow(userPoint.y - idealPoint.y, 2)
          );
          minDistance = Math.min(minDistance, distance);
        });

        if (minDistance < 50) {
          // Only count points within reasonable distance
          totalDeviation += minDistance;
          validPoints++;
        }
      });

      if (validPoints === 0) return 0;

      const averageDeviation = totalDeviation / validPoints;
      const maxAcceptableDeviation = 30; // pixels
      const accuracy = Math.max(
        0,
        100 - (averageDeviation / maxAcceptableDeviation) * 100
      );

      return Math.round(accuracy);
    },
    []
  );

  const calculateTotalDistance = useCallback((points: TracePoint[]): number => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
  }, []);

  const drawShape = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw shape outline
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();

    if (shape === "square") {
      const halfSize = shapeSize / 2;
      ctx.rect(centerX - halfSize, centerY - halfSize, shapeSize, shapeSize);
    } else if (shape === "circle") {
      ctx.arc(centerX, centerY, shapeSize / 2, 0, 2 * Math.PI);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw start point indicator
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    const startX =
      shape === "square" ? centerX - shapeSize / 2 : centerX + shapeSize / 2;
    const startY = shape === "square" ? centerY - shapeSize / 2 : centerY;
    ctx.arc(startX, startY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw "START" text
    ctx.fillStyle = "#10b981";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("START", startX, startY - 15);

    // Draw user's trace
    if (currentPath.current.length > 1) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(currentPath.current[0].x, currentPath.current[0].y);
      for (let i = 1; i < currentPath.current.length; i++) {
        ctx.lineTo(currentPath.current[i].x, currentPath.current[i].y);
      }
      ctx.stroke();
    }
  }, [shape, shapeSize, centerX, centerY]);

  const startTest = useCallback(() => {
    setHasStarted(true);
    setStartTime(Date.now());
    setTimeRemaining(testDuration);
    setTracePoints([]);
    currentPath.current = [];

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          finishTest();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  }, [testDuration]);

  // Auto-start the test when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startTest();
    }, 1000); // 1 second delay to show the instructions briefly

    return () => clearTimeout(timer);
  }, [startTest]);

  // Redraw shape periodically to ensure visibility
  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current && !isTracing) {
        drawShape();
      }
    }, 500); // Redraw every 500ms when not tracing

    return () => clearInterval(interval);
  }, [drawShape, isTracing]);

  const finishTest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const completionTime = Date.now() - startTime;
    const idealPoints = generateIdealShapePoints(shape);
    const accuracy = calculateAccuracy(currentPath.current, idealPoints);
    const totalDistance = calculateTotalDistance(currentPath.current);
    const deviationScore = accuracy;

    const result: ShapeTracingResult = {
      shape,
      accuracy,
      completionTime,
      tracePoints: [...currentPath.current],
      totalDistance,
      deviationScore,
    };

    onComplete(result);
  }, [
    startTime,
    shape,
    generateIdealShapePoints,
    calculateAccuracy,
    calculateTotalDistance,
    onComplete,
  ]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!hasStarted) return;

      e.preventDefault();
      setIsTracing(true);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = "touches" in e ? e.touches[0] : e;
      const point: TracePoint = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now(),
      };

      currentPath.current = [point];
      setTracePoints([point]);
    },
    [hasStarted]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isTracing || !hasStarted) return;

      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = "touches" in e ? e.touches[0] : e;
      const point: TracePoint = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now(),
      };

      currentPath.current.push(point);
      setTracePoints([...currentPath.current]);

      // Always redraw to show both template and user trace
      requestAnimationFrame(() => {
        drawShape();
      });
    },
    [isTracing, hasStarted, drawShape]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isTracing) return;
      e.preventDefault();
      setIsTracing(false);
    },
    [isTracing]
  );

  useEffect(() => {
    drawShape();
  }, [drawShape]);

  // Ensure shape is drawn when canvas ref is available
  useEffect(() => {
    if (canvasRef.current) {
      // Small delay to ensure canvas is fully rendered
      setTimeout(() => {
        drawShape();
      }, 100);
    }
  }, [drawShape]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6 bg-gray-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Trace the {shape === "square" ? "Square" : "Circle"}
          </h2>
          <p className="text-gray-600 max-w-md">
            Starting from the green dot, trace the shape with your finger as
            accurately as possible.
          </p>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border border-gray-200 rounded"
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">
              Starting automatically...
            </p>
            <p className="text-sm text-gray-500">
              Test duration: {testDuration / 1000} seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Test Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-900">
            Trace the {shape === "square" ? "Square" : "Circle"}
          </div>
          <div className="text-sm text-gray-600">
            Time: {Math.ceil(timeRemaining / 1000)}s
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

      {/* Canvas Area */}
      <div className="absolute inset-0 pt-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border border-gray-200 rounded cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            style={{ touchAction: "none" }}
          />
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Points traced: {tracePoints.length}
            </p>
            <Button onClick={finishTest} variant="outline" className="mt-2">
              Finish Early
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
