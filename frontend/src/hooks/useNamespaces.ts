import { useState, useEffect } from 'react';
import type { NamespaceInfo } from '../types/pod';

export function useNamespaces() {
  const [namespaces, setNamespaces] = useState<NamespaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNamespaces = async () => {
      try {
        const response = await fetch('/api/namespaces');
        if (!response.ok) {
          throw new Error('Failed to fetch namespaces');
        }
        const data = await response.json();
        setNamespaces(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchNamespaces();
  }, []);

  return { namespaces, loading, error };
}
