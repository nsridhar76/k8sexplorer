interface ResourceUsageProps {
  request: string;
  limit: string;
  type: 'cpu' | 'memory';
}

function parseResource(value: string, type: 'cpu' | 'memory'): number {
  if (!value) return 0;

  if (type === 'cpu') {
    if (value.endsWith('m')) {
      return parseInt(value.slice(0, -1), 10);
    }
    return parseFloat(value) * 1000;
  }

  // Memory
  const units: Record<string, number> = {
    'Ki': 1024,
    'Mi': 1024 * 1024,
    'Gi': 1024 * 1024 * 1024,
    'K': 1000,
    'M': 1000 * 1000,
    'G': 1000 * 1000 * 1000,
  };

  for (const [unit, multiplier] of Object.entries(units)) {
    if (value.endsWith(unit)) {
      return parseInt(value.slice(0, -unit.length), 10) * multiplier;
    }
  }

  return parseInt(value, 10);
}

export function ResourceUsage({ request, limit, type }: ResourceUsageProps) {
  const requestVal = parseResource(request, type);
  const limitVal = parseResource(limit, type);

  const percentage = limitVal > 0 ? Math.min((requestVal / limitVal) * 100, 100) : 0;
  const hasValues = request || limit;

  const barColor = type === 'cpu' ? 'bg-blue-500' : 'bg-purple-500';
  const barBg = type === 'cpu' ? 'bg-blue-100' : 'bg-purple-100';

  if (!hasValues) {
    return (
      <div className="text-xs text-gray-400 italic">
        Not set
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-mono">{request || '-'}</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 font-mono">{limit || '-'}</span>
      </div>
      {limitVal > 0 && (
        <div className={`h-1.5 rounded-full ${barBg} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
