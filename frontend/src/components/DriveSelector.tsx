import React, { useState } from 'react';
import { HardDrive, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { memoryApi } from '../api/memoryApi';
import clsx from 'clsx';

interface DriveSelectorProps {
  onMount: (path: string, count: number) => void;
}

export const DriveSelector: React.FC<DriveSelectorProps> = ({ onMount }) => {
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await memoryApi.mountDrive(path);
      setSuccess(`Mounted successfully. ${res.count} memories found.`);
      onMount(path, res.count);
    } catch (err: any) {
      setError(err.message || 'Failed to mount drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
        <HardDrive className="w-5 h-5" />
        Mount Drive
      </h2>

      <form onSubmit={handleMount} className="space-y-4">
        <div>
          <label htmlFor="path" className="block text-sm font-medium text-gray-700 mb-1">
            Filesystem Path
          </label>
          <div className="flex gap-2">
            <input
              id="path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/your/photos"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading || !path.trim()}
              className={clsx(
                "px-4 py-2 rounded-md font-medium text-white transition-colors",
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Mount"}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md text-sm">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}
      </form>
    </div>
  );
};
