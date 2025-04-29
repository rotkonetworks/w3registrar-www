import { useState, useEffect } from "react";

// Custom event type for localStorage changes
type StorageEvent = {
  key: string;
  newValue: any;
};

export const useLocalStorage = <T>(key: string, initialValue?: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (initialValue === undefined) {
        return initialValue;
      }
      let item: T = window.localStorage.getItem(key) as T;
      if (item === null && initialValue !== undefined) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        item = initialValue;
      }
      const parsedValue = item ? JSON.parse(item as string) : initialValue;
      console.log("item for", `${key}: `, parsedValue);
      return parsedValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Event name for our custom localStorage events
  const localStorageEventName = "localStorageChange";

  useEffect(() => {
    // Handler for our custom events (same tab)
    const handleStorageChange = (e: CustomEvent<StorageEvent>) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue);
      }
    };

    // Handler for storage events (different tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    // Add event listeners
    window.addEventListener(localStorageEventName, handleStorageChange as EventListener);
    window.addEventListener("storage", handleStorageEvent);

    // Clean up event listeners
    return () => {
      window.removeEventListener(localStorageEventName, handleStorageChange as EventListener);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      console.log("setValue for ", key, "to", value);
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent<StorageEvent>(localStorageEventName, {
          detail: {
            key,
            newValue: valueToStore,
          },
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}