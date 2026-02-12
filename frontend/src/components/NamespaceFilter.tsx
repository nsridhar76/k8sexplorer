import { useNamespaces } from '../hooks/useNamespaces';

interface NamespaceFilterProps {
  value: string;
  onChange: (namespace: string) => void;
}

export function NamespaceFilter({ value, onChange }: NamespaceFilterProps) {
  const { namespaces, loading } = useNamespaces();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="namespace" className="text-sm font-medium text-gray-700">
        Namespace:
      </label>
      <select
        id="namespace"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5 px-3 border bg-white"
      >
        <option value="all">All namespaces</option>
        {namespaces.map((ns) => (
          <option key={ns.name} value={ns.name}>
            {ns.name}
          </option>
        ))}
      </select>
    </div>
  );
}
