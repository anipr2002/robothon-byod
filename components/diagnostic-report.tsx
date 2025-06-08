"use client";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Share2,
  Wifi,
} from "lucide-react";

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

interface DiagnosticReportProps {
  results: TestSuiteResult;
  onRetry: () => void;
  onPublishResult: () => void;
  isPublishing: boolean;
  publishSuccess?: boolean;
  rosConnected: boolean;
}

const chartConfig = {
  responseTime: {
    label: "Response Time",
    color: "#2563eb",
  },
  touches: {
    label: "Touches",
    color: "#16a34a",
  },
  passed: {
    label: "Passed",
    color: "#16a34a",
  },
  failed: {
    label: "Failed",
    color: "#dc2626",
  },
};

export function DiagnosticReport({
  results,
  onRetry,
  onPublishResult,
  isPublishing,
  publishSuccess,
  rosConnected,
}: DiagnosticReportProps) {
  const { touchscreen, displayDefect, proximitySensor } = results;

  if (!touchscreen && !displayDefect && !proximitySensor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Test Results
          </h1>
          <p className="text-gray-600 mb-6">
            No test results available to display.
          </p>
          <Button onClick={onRetry}>Run Tests</Button>
        </div>
      </div>
    );
  }

  // Calculate overall score based on all completed tests
  const calculateOverallScore = () => {
    let totalScore = 0;
    let testCount = 0;

    if (touchscreen) {
      let touchScore = 0;
      if (touchscreen.basicTouch.multiTouchSupported) touchScore += 20;
      if (touchscreen.basicTouch.averageResponseTime < 100) touchScore += 20;
      if (touchscreen.basicTouch.maxSimultaneousTouches >= 2) touchScore += 20;
      if (touchscreen.squareTracing.accuracy >= 70) touchScore += 20;
      if (touchscreen.circleTracing.accuracy >= 70) touchScore += 20;
      totalScore += touchScore;
      testCount++;
    }

    if (displayDefect) {
      const displayScore = displayDefect.testCompleted ? 100 : 0;
      totalScore += displayScore;
      testCount++;
    }

    if (proximitySensor) {
      const sensorScore = proximitySensor.success ? 100 : 0;
      totalScore += sensorScore;
      testCount++;
    }

    return testCount > 0 ? Math.round(totalScore / testCount) : 0;
  };

  const overallScore = calculateOverallScore();

  // Prepare chart data using the new test structure
  const performanceData = [];

  if (touchscreen) {
    performanceData.push({
      metric: "Response Time",
      value: touchscreen.basicTouch.averageResponseTime,
      threshold: 100,
      status:
        touchscreen.basicTouch.averageResponseTime < 100 ? "Good" : "Poor",
    });
    performanceData.push({
      metric: "Square Accuracy",
      value: touchscreen.squareTracing.accuracy,
      threshold: 70,
      status: touchscreen.squareTracing.accuracy >= 70 ? "Good" : "Poor",
    });
    performanceData.push({
      metric: "Circle Accuracy",
      value: touchscreen.circleTracing.accuracy,
      threshold: 70,
      status: touchscreen.circleTracing.accuracy >= 70 ? "Good" : "Poor",
    });
  }

  if (displayDefect) {
    performanceData.push({
      metric: "Display Test",
      value: displayDefect.testCompleted ? 100 : 0,
      threshold: 100,
      status: displayDefect.testCompleted ? "Good" : "Poor",
    });
  }

  if (proximitySensor) {
    performanceData.push({
      metric: "Proximity Sensor",
      value: proximitySensor.success ? 100 : 0,
      threshold: 100,
      status: proximitySensor.success ? "Good" : "Poor",
    });
  }

  const testResults: Array<{ name: string; passed: boolean }> = [];

  if (touchscreen) {
    testResults.push(
      {
        name: "Multi-touch",
        passed: touchscreen.basicTouch.multiTouchSupported,
      },
      {
        name: "Response Time",
        passed: touchscreen.basicTouch.averageResponseTime < 100,
      },
      {
        name: "Square Tracing",
        passed: touchscreen.squareTracing.accuracy >= 70,
      },
      {
        name: "Circle Tracing",
        passed: touchscreen.circleTracing.accuracy >= 70,
      }
    );
  }

  if (displayDefect) {
    testResults.push({
      name: "Display Defect",
      passed: displayDefect.testCompleted,
    });
  }

  if (proximitySensor) {
    testResults.push({
      name: "Proximity Sensor",
      passed: proximitySensor.success,
    });
  }

  const passFailData = [
    {
      name: "Passed",
      value: testResults.filter((t) => t.passed).length,
      fill: "#16a34a",
    },
    {
      name: "Failed",
      value: testResults.filter((t) => !t.passed).length,
      fill: "#dc2626",
    },
  ];

  // Touch distribution over time (simplified)
  const touchDistribution =
    touchscreen?.basicTouch.touchPoints
      .reduce(
        (acc: { time: number; count: number }[], touch: any, index: number) => {
          const timeSlot = Math.floor(
            (touch.timestamp -
              (touchscreen?.basicTouch.touchPoints[0]?.timestamp || 0)) /
              1000
          );
          const existing = acc.find((item: any) => item.time === timeSlot);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ time: timeSlot, count: 1 });
          }
          return acc;
        },
        [] as { time: number; count: number }[]
      )
      .slice(0, 10) || []; // Limit to first 10 seconds

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore,
      results,
      summary: {
        totalTests: testResults.length,
        passed: testResults.filter((t) => t.passed).length,
        failed: testResults.filter((t) => !t.passed).length,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostic-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Diagnostic Report
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`text-4xl font-bold ${
                overallScore >= 80
                  ? "text-green-600"
                  : overallScore >= 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {overallScore}%
            </div>
            <div className="text-left">
              <p className="text-gray-600">Overall Score</p>
              <p
                className={`text-sm font-medium ${
                  overallScore >= 80
                    ? "text-green-600"
                    : overallScore >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {overallScore >= 80
                  ? "Excellent"
                  : overallScore >= 60
                  ? "Good"
                  : "Needs Attention"}
              </p>
            </div>
          </div>
          <p className="text-gray-600">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* ROS Connection Status */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <Wifi
              className={`w-5 h-5 ${
                rosConnected ? "text-green-600" : "text-red-600"
              }`}
            />
            <div>
              <h3 className="font-medium text-gray-900">ROS Connection</h3>
              <p
                className={`text-sm ${
                  rosConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {rosConnected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pass/Fail Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Results Overview
            </h3>
            <ChartContainer config={chartConfig} className="h-64">
              <PieChart>
                <Pie
                  data={passFailData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h3>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Touch Distribution Over Time */}
        {touchDistribution.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Touch Activity Over Time
            </h3>
            <ChartContainer config={chartConfig} className="h-64">
              <LineChart data={touchDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{
                    value: "Time (seconds)",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Touch Count",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Detailed Results */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Results
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Test Results</h4>

              {testResults.map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="text-gray-700">{test.name}</span>
                  <div className="flex items-center space-x-2">
                    {test.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        test.passed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {test.passed ? "Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Raw Metrics</h4>
              <div className="space-y-3 text-sm">
                {touchscreen && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Multi-touch Support:
                      </span>
                      <span className="font-medium">
                        {touchscreen.basicTouch.multiTouchSupported
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Max Simultaneous Touches:
                      </span>
                      <span className="font-medium">
                        {touchscreen.basicTouch.maxSimultaneousTouches}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Average Response Time:
                      </span>
                      <span className="font-medium">
                        {touchscreen.basicTouch.averageResponseTime.toFixed(2)}
                        ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Touches:</span>
                      <span className="font-medium">
                        {touchscreen.basicTouch.totalTouches}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Test Duration:</span>
                      <span className="font-medium">
                        {touchscreen.basicTouch.testDuration / 1000}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Square Accuracy:</span>
                      <span className="font-medium">
                        {touchscreen.squareTracing.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Circle Accuracy:</span>
                      <span className="font-medium">
                        {touchscreen.circleTracing.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overall Score:</span>
                      <span className="font-medium">
                        {touchscreen.overallScore}%
                      </span>
                    </div>
                  </>
                )}

                {displayDefect && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Display Test:</span>
                      <span className="font-medium">
                        {displayDefect.testCompleted ? "Completed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {(displayDefect.duration / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </>
                )}

                {proximitySensor && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proximity Sensor:</span>
                      <span className="font-medium">
                        {proximitySensor.success ? "Activated" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activation Time:</span>
                      <span className="font-medium">
                        {proximitySensor.sensorActivated
                          ? `${(proximitySensor.activationTime / 1000).toFixed(
                              1
                            )}s`
                          : "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Publish Status */}
        {publishSuccess !== undefined && (
          <div
            className={`rounded-lg p-4 ${
              publishSuccess
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm ${
                publishSuccess ? "text-green-700" : "text-red-700"
              }`}
            >
              {publishSuccess
                ? "Results successfully published to ROS topic"
                : "Failed to publish results to ROS topic"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-4 gap-3">
          <Button
            onClick={onPublishResult}
            disabled={!rosConnected || isPublishing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {isPublishing ? "Publishing..." : "Publish to ROS"}
          </Button>

          <Button
            onClick={handleExportReport}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>

          <Button onClick={() => window.print()} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Print Report
          </Button>

          <Button onClick={onRetry} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Run Again
          </Button>
        </div>
      </div>
    </div>
  );
}
