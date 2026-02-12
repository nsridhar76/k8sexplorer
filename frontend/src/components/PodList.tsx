import { useState, useEffect } from 'react';
import type { PodInfo } from '../types/pod';
import { StatusBadge } from './StatusBadge';
import { ResourceUsage } from './ResourceUsage';
import { PodDetailModal } from './PodDetailModal';
import { usePods } from '../hooks/usePods';
import { ArrowPathIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PodListProps {
  namespace: string;
}

export function PodList({ namespace }: PodListProps) {
  const { pods, loading, error, lastRefresh, refresh } = usePods(namespace);
  const [selectedPod, setSelectedPod] = useState<PodInfo | null>(null);
  const [collapsedNamespaces, setCollapsedNamespaces] = useState<Set<string>>(new Set());

  // Fetch on mount and when namespace changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Group pods by namespace
  const groupedPods = pods.reduce((acc, pod) => {
    if (!acc[pod.namespace]) {
      acc[pod.namespace] = [];
    }
    acc[pod.namespace].push(pod);
    return acc;
  }, {} as Record<string, PodInfo[]>);

  // Sort namespaces alphabetically
  const sortedNamespaces = Object.keys(groupedPods).sort();

  const toggleNamespace = (ns: string) => {
    setCollapsedNamespaces((prev) => {
      const next = new Set(prev);
      if (next.has(ns)) {
        next.delete(ns);
      } else {
        next.add(ns);
      }
      return next;
    });
  };

  const getNamespaceStats = (nsPods: PodInfo[]) => {
    const running = nsPods.filter((p) => p.status.toLowerCase() === 'running').length;
    const failed = nsPods.filter((p) =>
      ['failed', 'error', 'crashloopbackoff', 'imagepullbackoff'].includes(p.status.toLowerCase())
    ).length;
    return { total: nsPods.length, running, failed };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {pods.length} pod{pods.length !== 1 ? 's' : ''} in {sortedNamespaces.length} namespace{sortedNamespaces.length !== 1 ? 's' : ''}
          </span>
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Grouped pod lists */}
      {sortedNamespaces.length === 0 ? (
        <div className="bg-white rounded-lg shadow px-4 py-8 text-center text-gray-500">
          {loading ? 'Loading pods...' : 'No pods found'}
        </div>
      ) : (
        sortedNamespaces.map((ns) => {
          const nsPods = groupedPods[ns];
          const isCollapsed = collapsedNamespaces.has(ns);
          const stats = getNamespaceStats(nsPods);

          return (
            <div key={ns} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Namespace header */}
              <button
                onClick={() => toggleNamespace(ns)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-800">{ns}</span>
                  <span className="text-sm text-gray-500">({stats.total} pods)</span>
                </div>
                <div className="flex items-center gap-3">
                  {stats.running > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      {stats.running} running
                    </span>
                  )}
                  {stats.failed > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      {stats.failed} failed
                    </span>
                  )}
                </div>
              </button>

              {/* Pod table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ready
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Restarts
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CPU
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Memory
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {nsPods
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((pod) => (
                          <tr
                            key={pod.name}
                            onClick={() => setSelectedPod(pod)}
                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {pod.name}
                            </td>
                            <td className="px-4 py-2">
                              <StatusBadge status={pod.status} />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                              {pod.ready}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              <span className={pod.restarts > 0 ? 'text-orange-600 font-medium' : ''}>
                                {pod.restarts}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <ResourceUsage
                                request={pod.cpuRequest}
                                limit={pod.cpuLimit}
                                type="cpu"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <ResourceUsage
                                request={pod.memRequest}
                                limit={pod.memLimit}
                                type="memory"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {pod.age}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      <PodDetailModal pod={selectedPod} onClose={() => setSelectedPod(null)} />
    </div>
  );
}
