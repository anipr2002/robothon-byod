"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RotateCcw, Wifi } from "lucide-react";

interface TouchTestResult {
  multiTouchSupported: boolean;
  maxSimultaneousTouches: number;
  averageResponseTime: number;
  totalTouches: number;
  testDuration: number;
  touchPoints: any[];
}

interface DiagnosticResultsProps {
  result: TouchTestResult;
  onRetry: () => void;
  onPublishResult: () => void;
  isPublishing: boolean;
  publishSuccess?: boolean;
  rosConnected: boolean;
}

export function DiagnosticResults({
  result,
  onRetry,
  onPublishResult,
  isPublishing,
  publishSuccess,
  rosConnected,
}: DiagnosticResultsProps) {
  const getOverallStatus = () => {
    const hasMinimumTouches = result.totalTouches >= 5;
    const hasReasonableResponseTime = result.averageResponseTime < 100;
    const supportsBasicTouch = result.maxSimultaneousTouches >= 1;

    return hasMinimumTouches && hasReasonableResponseTime && supportsBasicTouch;
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            {overallStatus ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          </div>
          <p className="text-gray-600">
            {overallStatus
              ? "Touchscreen is functioning well"
              : "Touchscreen may have issues"}
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

        {/* Test Results */}
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Touchscreen Analysis
          </h2>

          {/* Multi-touch Support */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Multi-touch Support</span>
            <div className="flex items-center space-x-2">
              {result.multiTouchSupported ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {result.multiTouchSupported ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Max Simultaneous Touches */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Max Simultaneous Touches</span>
            <span className="text-sm font-medium">
              {result.maxSimultaneousTouches}
            </span>
          </div>

          {/* Total Touches */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Total Touches</span>
            <span className="text-sm font-medium">{result.totalTouches}</span>
          </div>

          {/* Average Response Time */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Avg Response Time</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {result.averageResponseTime.toFixed(1)}ms
              </span>
              {result.averageResponseTime < 100 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>

          {/* Test Duration */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Test Duration</span>
            <span className="text-sm font-medium">
              {result.testDuration / 1000}s
            </span>
          </div>
        </div>

        {/* Overall Assessment */}
        <div
          className={`rounded-lg p-4 ${
            overallStatus
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h3
            className={`font-medium ${
              overallStatus ? "text-green-800" : "text-red-800"
            }`}
          >
            Overall Assessment
          </h3>
          <p
            className={`text-sm mt-1 ${
              overallStatus ? "text-green-700" : "text-red-700"
            }`}
          >
            {overallStatus
              ? "The touchscreen is responding well and supports the expected functionality."
              : "The touchscreen may have responsiveness issues or limited touch support."}
          </p>
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
        <div className="space-y-3">
          <Button
            onClick={onPublishResult}
            disabled={!rosConnected || isPublishing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {isPublishing ? "Publishing..." : "Publish Results to ROS"}
          </Button>

          <Button onClick={onRetry} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Run Test Again
          </Button>
        </div>
      </div>
    </div>
  );
}
