'use client';

import { useEffect, useState, useCallback } from 'react';
import * as ROSLIB from 'roslib';

interface UseRosOptions {
  url?: string;
}

export function useRos(options: UseRosOptions = {}) {
  const [ros, setRos] = useState<ROSLIB.Ros | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { url = 'ws://localhost:9090' } = options;

  const connect = useCallback(() => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    const rosInstance = new ROSLIB.Ros({
      url: url
    });

    rosInstance.on('connection', () => {
      console.log('Connected to websocket server.');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    rosInstance.on('error', (error: any) => {
      console.log('Error connecting to websocket server: ', error);
      setError(`Connection error: ${error.message || 'Unknown error'}`);
      setIsConnecting(false);
      setIsConnected(false);
    });

    rosInstance.on('close', () => {
      console.log('Connection to websocket server closed.');
      setIsConnected(false);
      setIsConnecting(false);
    });

    setRos(rosInstance);
  }, [url, isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    if (ros) {
      ros.close();
      setRos(null);
    }
  }, [ros]);

  const publishMessage = useCallback((topicName: string, messageType: string, message: any) => {
    if (!ros || !isConnected) {
      console.warn('ROS not connected. Cannot publish message.');
      return false;
    }

    try {
      const topic = new ROSLIB.Topic({
        ros: ros,
        name: topicName,
        messageType: messageType
      });

      topic.publish(message);
      return true;
    } catch (error) {
      console.error('Error publishing ROS message:', error);
      return false;
    }
  }, [ros, isConnected]);

  useEffect(() => {
    return () => {
      if (ros) {
        ros.close();
      }
    };
  }, [ros]);

  return {
    ros,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    publishMessage
  };
}