import { useMemo, useCallback } from "react";

export type UrlParamsArgs = Record<string, string | undefined>;
export type UrlParams = {
  [key: string]: string | undefined;
};

export function useUrlParams() {
  const urlParams = useMemo(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(window.location.search));
    console.debug({ searchParams });
    return searchParams;
  }, [window.location.search]);


  const updateUrlParams = useCallback((params: UrlParamsArgs) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value)
    ).toString();
    window.history.replaceState(null, "", `${window.location.pathname}${queryString ? "?" + queryString : ""}`);
    console.debug({ queryString });
  }, []);

  return { urlParams, updateUrlParams };
}
