import { useState, useCallback } from "react";

export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  action: T
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
      if (isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await action(...args);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [action, isLoading]
  );

  return { execute, isLoading, error };
}
