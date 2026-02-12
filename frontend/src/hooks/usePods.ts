import { useState, useCallback } from 'react';
import type { PodInfo } from '../types/pod';

export function usePods(namespace: string) {
  const [pods, setPods] = useState<PodInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = namespace && namespace !== 'all'
        ? `/api/pods?namespace=${namespace}`
        : '/api/pods';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch pods');
      }

      const data = await response.json();
      setPods(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  return {
    pods,
    loading,
    error,
    lastRefresh,
    refresh,
  };
}
