"use client";

import { useState, useCallback, useEffect } from "react";
import { useRos } from "@/lib/use-ros";
import { TouchscreenTest } from "./touchscreen-test";
import { EnhancedTouchscreenTest } from "./enhanced-touchscreen-test";
import { DiagnosticResults } from "./diagnostic-results";
import { DiagnosticReport } from "./diagnostic-report";
import { TestSuite } from "./test-suite";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Settings, TestTube } from "lucide-react";

interface TouchTestResult {
  multiTouchSupported: boolean;
  maxSimultaneousTouches: number;
  averageResponseTime: number;
  totalTouches: number;
  testDuration: number;
  touchPoints: any[];
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
}

type AppState =
  | "setup"
  | "testing"
  | "enhanced-touch"
  | "test-suite"
  | "results";

export function DiagnosticApp() {
  const [appState, setAppState] = useState<AppState>("setup");
  const [testResult, setTestResult] = useState<TouchTestResult | null>(null);
  const [enhancedTestResult, setEnhancedTestResult] = useState<any | null>(
    null
  );
  const [suiteResults, setSuiteResults] = useState<TestSuiteResult | null>(
    null
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean | undefined>();
  const [rosUrl, setRosUrl] = useState("ws://localhost:9090");
  const [showSettings, setShowSettings] = useState(false);

  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    publishMessage,
  } = useRos({ url: rosUrl });

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const handleTestComplete = useCallback((result: TouchTestResult) => {
    setTestResult(result);
    setAppState("results");
    setPublishSuccess(undefined);
  }, []);

  const handleRetry = useCallback(() => {
    setTestResult(null);
    setAppState("testing");
    setPublishSuccess(undefined);
  }, []);

  const handleStartTest = useCallback(() => {
    setAppState("testing");
  }, []);

  const handleEnhancedTestComplete = useCallback((result: any) => {
    setEnhancedTestResult(result);
    setAppState("results");
    setPublishSuccess(undefined);
  }, []);

  const handleEnhancedRetry = useCallback(() => {
    setEnhancedTestResult(null);
    setAppState("enhanced-touch");
    setPublishSuccess(undefined);
  }, []);

  const handleStartTestSuite = useCallback(() => {
    setAppState("test-suite");
  }, []);

  const handleSuiteComplete = useCallback((results: TestSuiteResult) => {
    setSuiteResults(results);
    setAppState("results");
    setPublishSuccess(undefined);
  }, []);

  const handleSuitePublish = useCallback(
    (results: TestSuiteResult) => {
      if (!isConnected || !results.touchscreen) return;

      setIsPublishing(true);

      const touchscreen = results.touchscreen;
      // Prepare diagnostic message
      const diagnosticMessage = {
        header: {
          stamp: {
            sec: Math.floor(Date.now() / 1000),
            nanosec: (Date.now() % 1000) * 1000000,
          },
          frame_id: "test_suite_diagnostic",
        },
        name: "test_suite",
        message: `Test suite completed. Touchscreen: Multi-touch: ${
          touchscreen.basicTouch.multiTouchSupported
        }, Max touches: ${
          touchscreen.basicTouch.maxSimultaneousTouches
        }, Response time: ${touchscreen.basicTouch.averageResponseTime.toFixed(
          2
        )}ms, Overall score: ${touchscreen.overallScore}%`,
        hardware_id: "mobile_test_suite",
        values: [
          {
            key: "suite_multi_touch_supported",
            value: touchscreen.basicTouch.multiTouchSupported.toString(),
          },
          {
            key: "suite_max_simultaneous_touches",
            value: touchscreen.basicTouch.maxSimultaneousTouches.toString(),
          },
          {
            key: "suite_average_response_time_ms",
            value: touchscreen.basicTouch.averageResponseTime.toFixed(2),
          },
          {
            key: "suite_total_touches",
            value: touchscreen.basicTouch.totalTouches.toString(),
          },
          {
            key: "suite_overall_score",
            value: touchscreen.overallScore.toString(),
          },
          {
            key: "suite_square_accuracy",
            value: touchscreen.squareTracing.accuracy.toString(),
          },
          {
            key: "suite_circle_accuracy",
            value: touchscreen.circleTracing.accuracy.toString(),
          },
        ],
      };

      // Publish to ROS topic
      const success = publishMessage(
        "/diagnostics",
        "diagnostic_msgs/DiagnosticArray",
        {
          header: diagnosticMessage.header,
          status: [diagnosticMessage],
        }
      );

      setPublishSuccess(success);
      setIsPublishing(false);
    },
    [isConnected, publishMessage]
  );

  const handlePublishResult = useCallback(() => {
    if (!testResult || !isConnected) return;

    setIsPublishing(true);

    // Prepare diagnostic message
    const diagnosticMessage = {
      header: {
        stamp: {
          sec: Math.floor(Date.now() / 1000),
          nanosec: (Date.now() % 1000) * 1000000,
        },
        frame_id: "touchscreen_diagnostic",
      },
      name: "touchscreen_test",
      message: `Touchscreen diagnostic completed. Multi-touch: ${
        testResult.multiTouchSupported
      }, Max touches: ${
        testResult.maxSimultaneousTouches
      }, Response time: ${testResult.averageResponseTime.toFixed(2)}ms`,
      hardware_id: "mobile_touchscreen",
      values: [
        {
          key: "multi_touch_supported",
          value: testResult.multiTouchSupported.toString(),
        },
        {
          key: "max_simultaneous_touches",
          value: testResult.maxSimultaneousTouches.toString(),
        },
        {
          key: "average_response_time_ms",
          value: testResult.averageResponseTime.toFixed(2),
        },
        {
          key: "total_touches",
          value: testResult.totalTouches.toString(),
        },
        {
          key: "test_duration_ms",
          value: testResult.testDuration.toString(),
        },
      ],
    };

    // Publish to ROS topic
    const success = publishMessage(
      "/diagnostics",
      "diagnostic_msgs/DiagnosticArray",
      {
        header: diagnosticMessage.header,
        status: [diagnosticMessage],
      }
    );

    setPublishSuccess(success);
    setIsPublishing(false);
  }, [testResult, isConnected, publishMessage]);

  const handleReconnect = useCallback(() => {
    if (isConnected) {
      disconnect();
    }
    setTimeout(() => connect(), 500);
  }, [isConnected, disconnect, connect]);

  if (appState === "testing") {
    return <TouchscreenTest onTestComplete={handleTestComplete} />;
  }

  if (appState === "enhanced-touch") {
    return (
      <EnhancedTouchscreenTest onTestComplete={handleEnhancedTestComplete} />
    );
  }

  if (appState === "test-suite") {
    return (
      <TestSuite
        onComplete={handleSuiteComplete}
        onPublishResult={handleSuitePublish}
        isPublishing={isPublishing}
        publishSuccess={publishSuccess}
        rosConnected={isConnected}
      />
    );
  }

  if (appState === "results") {
    // Show single test results
    if (testResult) {
      return (
        <DiagnosticResults
          result={testResult}
          onRetry={handleRetry}
          onPublishResult={handlePublishResult}
          isPublishing={isPublishing}
          publishSuccess={publishSuccess}
          rosConnected={isConnected}
        />
      );
    }
    // Show enhanced test results
    if (enhancedTestResult) {
      const enhancedSuiteResult: TestSuiteResult = {
        touchscreen: enhancedTestResult,
      };
      return (
        <DiagnosticReport
          results={enhancedSuiteResult}
          onRetry={handleEnhancedRetry}
          onPublishResult={() => handleSuitePublish(enhancedSuiteResult)}
          isPublishing={isPublishing}
          publishSuccess={publishSuccess}
          rosConnected={isConnected}
        />
      );
    }
    // Show test suite results
    if (suiteResults) {
      return (
        <DiagnosticReport
          results={suiteResults}
          onRetry={() => setAppState("setup")}
          onPublishResult={() => handleSuitePublish(suiteResults)}
          isPublishing={isPublishing}
          publishSuccess={publishSuccess}
          rosConnected={isConnected}
        />
      );
    }
  }

  // Setup/Home screen
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Robothon Diagnostics
          </h1>
          <p className="text-gray-600">
            Mobile diagnostic tools for robotic systems
          </p>
        </div>

        {/* ROS Connection Status */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">ROS Connection</h3>
                <p
                  className={`text-sm ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isConnecting
                    ? "Connecting..."
                    : isConnected
                    ? "Connected"
                    : "Disconnected"}
                </p>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ROS Bridge URL
                </label>
                <input
                  type="text"
                  value={rosUrl}
                  onChange={(e) => setRosUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ws://localhost:9090"
                />
              </div>
              <Button
                onClick={handleReconnect}
                disabled={isConnecting}
                className="w-full"
                variant="outline"
              >
                {isConnecting ? "Connecting..." : "Reconnect"}
              </Button>
            </div>
          )}
        </div>

        {/* Available Tests */}
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Tests
          </h2>

          <div className="space-y-3">
            {/* Test Suite */}
            <div className="flex items-center justify-between p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <TestTube className="w-4 h-4 mr-2" />
                  Complete Test Suite
                </h3>
                <p className="text-sm text-gray-600">
                  Run all available diagnostic tests with detailed reporting
                </p>
              </div>
              <Button
                onClick={handleStartTestSuite}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Suite
              </Button>
            </div>

            {/* Individual Tests */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Individual Tests
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Enhanced Touchscreen Test
                    </h3>
                    <p className="text-sm text-gray-600">
                      Multi-touch, square tracing, and circle tracing with
                      scoring
                    </p>
                  </div>
                  <Button
                    onClick={() => setAppState("enhanced-touch")}
                    variant="outline"
                  >
                    Start
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Basic Touchscreen Test
                    </h3>
                    <p className="text-sm text-gray-600">
                      Simple multi-touch functionality and response time test
                    </p>
                  </div>
                  <Button onClick={handleStartTest} variant="outline">
                    Start
                  </Button>
                </div>
              </div>
            </div>

            {/* Placeholder for future tests */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg opacity-50">
              <div>
                <h3 className="font-medium text-gray-900">Camera Test</h3>
                <p className="text-sm text-gray-600">
                  Coming soon - Test camera functionality
                </p>
              </div>
              <Button disabled variant="outline">
                Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg opacity-50">
              <div>
                <h3 className="font-medium text-gray-900">Sensor Test</h3>
                <p className="text-sm text-gray-600">
                  Coming soon - Test device sensors
                </p>
              </div>
              <Button disabled variant="outline">
                Soon
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Robothon 2025 • Bharath chomu</p>
        </div>
      </div>
    </div>
  );
}
