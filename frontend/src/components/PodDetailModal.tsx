import { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { PodInfo } from '../types/pod';

SyntaxHighlighter.registerLanguage('yaml', yaml);

interface PodDetailModalProps {
  pod: PodInfo | null;
  onClose: () => void;
}

export function PodDetailModal({ pod, onClose }: PodDetailModalProps) {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pod) return;

    const fetchYaml = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/pods/${pod.namespace}/${pod.name}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pod YAML');
        }
        const text = await response.text();
        setYamlContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchYaml();
  }, [pod]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pod) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{pod.name}</h2>
            <p className="text-sm text-gray-500">Namespace: {pod.namespace}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !!error}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardIcon className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-center py-8">
              Error: {error}
            </div>
          )}
          {!loading && !error && yamlContent && (
            <SyntaxHighlighter
              language="yaml"
              style={atomOneDark}
              customStyle={{
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: '0.875rem',
              }}
            >
              {yamlContent}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </div>
  );
}
