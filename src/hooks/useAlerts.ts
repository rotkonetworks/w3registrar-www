import { useCallback, useEffect } from 'react';
import { useProxy } from 'valtio/utils';
import { alertsStore, pushAlert, removeAlert, AlertProps, AlertPropsOptionalKey } from '~/store/AlertStore';

/**
 * Hook for centralized alert management
 * @param accountStore - The account store to track address changes for automatic cleanup
 * @returns Object containing alert state and management functions
 */
export function useAlerts() {
  const alerts = useProxy(alertsStore);

  // Add notification with optional parameters
  const add = useCallback((alert: AlertPropsOptionalKey) => {
    const key = (alert as AlertProps).key || new Date().toISOString();
    pushAlert({ 
      ...alert, 
      key, 
      closable: alert.closable ?? true,
      // Default duration of 5 seconds if not specified and type is success
      duration: alert.duration ?? (alert.type === 'success' ? 5000 : undefined)
    });
  }, []);

  // Remove a specific notification
  const remove = useCallback((key: string) => {
    removeAlert(key);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    alertsStore.forEach(alert => {
      removeAlert(alert.key);
    });
  }, []);

  return {
    alerts,
    add,
    remove,
    clearAll
  };
}
