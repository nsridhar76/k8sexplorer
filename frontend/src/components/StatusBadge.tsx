interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'running') {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        dot: 'bg-green-500',
        pulse: true,
      };
    }
    if (normalizedStatus === 'pending' || normalizedStatus === 'containercreating') {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        dot: 'bg-yellow-500',
        pulse: true,
      };
    }
    if (normalizedStatus === 'succeeded' || normalizedStatus === 'completed') {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        dot: 'bg-blue-500',
        pulse: false,
      };
    }
    if (
      normalizedStatus === 'failed' ||
      normalizedStatus === 'error' ||
      normalizedStatus === 'crashloopbackoff' ||
      normalizedStatus === 'imagepullbackoff' ||
      normalizedStatus === 'errimagepull'
    ) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        dot: 'bg-red-500',
        pulse: false,
      };
    }
    if (normalizedStatus === 'terminating') {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        dot: 'bg-orange-500',
        pulse: true,
      };
    }

    return {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
      dot: 'bg-gray-400',
      pulse: false,
    };
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      {status}
    </span>
  );
}
