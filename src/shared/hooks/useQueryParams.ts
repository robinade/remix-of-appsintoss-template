import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export function useQueryParams<T extends Record<string, string>>(): Partial<T> {
  const { search } = useLocation();

  const params = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const result: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      result[key] = value;
    });

    return result as Partial<T>;
  }, [search]);

  return params;
}

export function useQueryParam(key: string): string | null {
  const { search } = useLocation();

  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return searchParams.get(key);
  }, [search, key]);
}
