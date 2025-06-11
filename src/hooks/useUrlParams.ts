import { useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";

export type UrlParamsArgs = Record<string, string | undefined>;
export type UrlParams = {
  [key: string]: string | undefined;
};

export function useUrlParams() {
  const location = useLocation();

  const urlParams = useMemo(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(location.search));
    console.debug({ searchParams });
    return searchParams;
  }, [location.search]);

  const updateUrlParams = useCallback((params: UrlParamsArgs) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value)
    ).toString();
    window.history.replaceState(null, "", `${location.pathname}${queryString ? "?" + queryString : ""}`);
    console.debug({ queryString });
  }, []);

  return { urlParams, updateUrlParams };
}
