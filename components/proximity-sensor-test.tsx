"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle, Timer, Smartphone } from "lucide-react";

interface ProximitySensorResult {
  sensorActivated: boolean;
  activationTime: number;
  testDuration: number;
  success: boolean;
}

interface ProximitySensorTestProps {
  onTestComplete: (result: ProximitySensorResult) => void;
  showFloatingControls?: boolean;
}

export function ProximitySensorTest({
  onTestComplete,
  showFloatingControls = false,
}: ProximitySensorTestProps) {
  const [testState, setTestState] = useState<
    "ready" | "countdown" | "testing" | "completed"
  >("ready");
  const [countdown, setCountdown] = useState<number>(10);
  const [startTime, setStartTime] = useState<number>(0);
  const [sensorActivated, setSensorActivated] = useState<boolean>(false);
  const [activationTime, setActivationTime] = useState<number>(0);

  const handleStartTest = useCallback(() => {
    setTestState("countdown");
    setCountdown(10);
    setSensorActivated(false);
    setActivationTime(0);
  }, []);

  // Proximity sensor event handler
  const handleProximityChange = useCallback(
    (event: any) => {
      if (testState !== "testing") return;

      // Check if sensor is activated (device is near)
      const isNear =
        event.near || (event.distance !== undefined && event.distance < 5);

      if (isNear && !sensorActivated) {
        setSensorActivated(true);
        setActivationTime(Date.now() - startTime);
      }
    },
    [testState, sensorActivated, startTime]
  );

  // Generic sensor change handler for modern browsers
  const handleSensorChange = useCallback(() => {
    if (testState !== "testing") return;

    // Simulate sensor activation - in a real app, you'd check actual sensor values
    if (!sensorActivated) {
      setSensorActivated(true);
      setActivationTime(Date.now() - startTime);
    }
  }, [testState, sensorActivated, startTime]);

  useEffect(() => {
    if (testState === "countdown") {
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setTestState("testing");
            setStartTime(Date.now());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownTimer);
    }
  }, [testState]);

  useEffect(() => {
    if (testState === "testing") {
      // Try to listen for proximity sensor events
      const hasProximitySensor = "ondeviceproximity" in window;

      if (hasProximitySensor) {
        window.addEventListener("deviceproximity", handleProximityChange);
      }

      // 10-second test timer
      const testTimer = setTimeout(() => {
        const duration = Date.now() - startTime;
        const result: ProximitySensorResult = {
          sensorActivated,
          activationTime: sensorActivated ? activationTime : 0,
          testDuration: duration,
          success: sensorActivated,
        };

        setTestState("completed");
        onTestComplete(result);
      }, 10000);

      return () => {
        if (hasProximitySensor) {
          window.removeEventListener("deviceproximity", handleProximityChange);
        }
        clearTimeout(testTimer);
      };
    }
  }, [
    testState,
    startTime,
    sensorActivated,
    activationTime,
    handleProximityChange,
    onTestComplete,
  ]);

  const getTimeRemaining = () => {
    if (testState === "testing") {
      const elapsed = Date.now() - startTime;
      return Math.max(0, Math.ceil((10000 - elapsed) / 1000));
    }
    return 0;
  };

  if (testState === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          {sensorActivated ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-900">
                Proximity Sensor Test Passed
              </h2>
              <p className="text-gray-600">
                Sensor activated in {(activationTime / 1000).toFixed(1)} seconds
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
              <h2 className="text-2xl font-bold text-red-900">
                Proximity Sensor Test Failed
              </h2>
              <p className="text-gray-600">
                Sensor was not activated within 10 seconds
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (testState === "testing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {/* Floating Status */}
        {showFloatingControls && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg z-40">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-900">
                {sensorActivated
                  ? "Sensor Activated!"
                  : `${getTimeRemaining()}s remaining`}
              </div>
            </div>
          </div>
        )}

        <div className="text-center space-y-8 max-w-md">
          <div className="relative">
            <div
              className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${
                sensorActivated
                  ? "bg-green-500 text-white shadow-lg scale-110"
                  : "bg-white text-gray-600 shadow-md animate-pulse"
              }`}
            >
              <Smartphone className="w-16 h-16" />
            </div>

            {!sensorActivated && (
              <div className="absolute -inset-4 border-4 border-blue-200 rounded-full animate-ping" />
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {sensorActivated ? "Sensor Activated!" : "Cover the Sensor"}
            </h1>
            <p className="text-lg text-gray-600">
              {sensorActivated
                ? "Proximity sensor is working correctly"
                : "Robot should cover the proximity sensor now"}
            </p>

            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Timer className="w-5 h-5" />
              <span className="text-xl font-mono">{getTimeRemaining()}s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testState === "countdown") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <div className="w-32 h-32 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto text-6xl font-bold animate-pulse">
            {countdown}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Get Ready</h1>
            <p className="text-lg text-gray-600">
              Test will start in {countdown} seconds
            </p>
            <p className="text-sm text-gray-500">
              Robot should prepare to cover the proximity sensor
            </p>
          </div>
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
              Proximity Sensor Check
            </h1>
            <p className="text-lg text-gray-600">
              This test checks if the proximity sensor can detect nearby
              objects.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Test Instructions
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Test Preparation</h3>
                  <p className="text-sm text-gray-600">
                    Robot will have 10 seconds to cover the proximity sensor
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Sensor Activation</h3>
                  <p className="text-sm text-gray-600">
                    Robot must bring an object close to the device's proximity
                    sensor
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Result</h3>
                  <p className="text-sm text-gray-600">
                    Test passes if sensor activates within the time limit
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-yellow-800">Note</h3>
                <p className="text-sm text-yellow-700">
                  The proximity sensor is usually located near the front camera
                  or earpiece. Some devices may not support proximity sensor
                  detection through web browsers.
                </p>
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

      {/* Manual sensor activation for testing - only show during ready state for debugging */}
      {testState === "ready" && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={handleSensorChange}
            className="bg-green-600 hover:bg-green-700 text-sm px-4 py-2"
            variant="outline"
          >
            Simulate Sensor (Debug)
          </Button>
        </div>
      )}
    </div>
  );
}
