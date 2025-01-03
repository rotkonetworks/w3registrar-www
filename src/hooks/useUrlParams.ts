import { useMemo, useCallback } from "react";

export function useUrlParams() {
  const urlParams = useMemo<{
    chain: string;
    address: string;
  }>(() => {
    const _urlParams = new URLSearchParams(window.location.search).entries()
      .map(([key, value]) => ({ key, value }))
      .reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
    if (import.meta.env.DEV) console.log({ _urlParams })
    return _urlParams
  }, [window.location.search])

  const updateUrlParams = useCallback((params) => {
    const newParams = params
      ? "?" + Object.entries(params)
        .filter(([ , value ]) => value)
        .map(([ key, value ]) => `${key}=${value}`)
        .join("&")
      : ""
    window.history.replaceState(null, null, `${window.location.pathname}${newParams}`)
    if (import.meta.env.DEV) console.log({ newParams })
  }, [window.history.replaceState])

  return { urlParams, updateUrlParams };
}
