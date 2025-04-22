import { useMemo, useCallback } from "react";

export function useUrlParams() {
  const urlParams = useMemo(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(window.location.search));
    console.debug({ searchParams });
    return searchParams;
  }, [window.location.search]);

  const updateUrlParams = useCallback((params: Record<string, string | undefined>) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value)
    ).toString();
    window.history.replaceState(null, "", `${window.location.pathname}${queryString ? "?" + queryString : ""}`);
    console.debug({ queryString });
  }, []);

  return { urlParams, updateUrlParams };
}
