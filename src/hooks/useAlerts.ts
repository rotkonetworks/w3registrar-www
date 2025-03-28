import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AlertProps, AlertPropsOptionalKey } from '~/store/AlertStore';

/**
 * Hook for centralized alert management using React state
 * @returns Object containing alert state and management functions
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Map<string, AlertProps>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Add notification with optional parameters
  const add = useCallback((alertData: AlertPropsOptionalKey) => {
    const key = alertData.key || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const alert: AlertProps = { 
      ...alertData, 
      key, 
      closable: alertData.closable ?? true,
    };
    
    setAlerts(prev => {
      const newAlerts = new Map(prev);
      newAlerts.set(key, alert);
      return newAlerts;
    });
    
    // Set up automatic removal for alerts with duration
    if (alert.duration) {
      // Clear any existing timeout for this key
      if (timeoutsRef.current.has(key)) {
        clearTimeout(timeoutsRef.current.get(key)!);
      }
      
      // Set new timeout
      const timeoutId = setTimeout(() => {
        remove(key);
        timeoutsRef.current.delete(key);
      }, alert.duration);
      
      timeoutsRef.current.set(key, timeoutId);
    }
    
    return key;
  }, []);

  // Remove a specific notification
  const remove = useCallback((key: string) => {
    setAlerts(prev => {
      const newAlerts = new Map(prev);
      newAlerts.delete(key);
      return newAlerts;
    });
    
    // Clear any timeout for this alert
    if (timeoutsRef.current.has(key)) {
      clearTimeout(timeoutsRef.current.get(key)!);
      timeoutsRef.current.delete(key);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setAlerts(new Map());
    
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  return {
    alerts: useMemo(() => Array.from(alerts.entries()), [alerts]),
    add,
    remove,
    clearAll,
    size: alerts.size
  };
}
