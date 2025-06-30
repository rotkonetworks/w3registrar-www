import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type UrlParamsArgs = Record<string, string | undefined>;
export type UrlParams = {
  [key: string]: string | undefined;
};

export function useUrlParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlParams = useMemo(() => {
    const params: UrlParams = {};
    if (searchParams) {
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    console.debug({ searchParams: params });
    return params;
  }, [searchParams]);

  const updateUrlParams = useCallback((params: UrlParamsArgs) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || "");
    
    // Update or remove parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    const queryString = newSearchParams.toString();
    const newUrl = `${pathname}${queryString ? "?" + queryString : ""}`;
    
    router.replace(newUrl, { scroll: false });
    console.debug({ queryString });
  }, [router, searchParams, pathname]);

  const setParam = useCallback((key: string, value: string | undefined) => {
    urlParams[key] = value;
    updateUrlParams({ [key]: value });
  }, [urlParams, updateUrlParams]);

  const removeParam = useCallback((key: string) => {
    delete urlParams[key];
    updateUrlParams({ [key]: undefined });
  }, [urlParams, updateUrlParams]);

  return { urlParams, updateUrlParams, setParam, removeParam };
}
