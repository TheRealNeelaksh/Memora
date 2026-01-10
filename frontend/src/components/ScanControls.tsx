import React, { useState } from 'react';
import { RefreshCw, Loader2, FileSearch } from 'lucide-react';
import { memoryApi } from '../api/memoryApi';
import clsx from 'clsx';

interface ScanControlsProps {
  mountedPath: string | null;
}

export const ScanControls: React.FC<ScanControlsProps> = ({ mountedPath }) => {
  const [loading, setLoading] = useState(false);
  const [rescan, setRescan] = useState(false);
  const [result, setResult] = useState<{ new: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!mountedPath) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await memoryApi.scanDrive(mountedPath, rescan);
      setResult({ new: res.new, skipped: res.skipped });
    } catch (err: any) {
      setError(err.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
        <FileSearch className="w-5 h-5" />
        Scan Control
      </h2>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleScan}
            disabled={loading || !mountedPath}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors",
              !mountedPath
                ? "bg-gray-300 cursor-not-allowed"
                : loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "Scanning & Indexing..." : "Scan Drive"}
          </button>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={rescan}
              onChange={(e) => setRescan(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Force Rescan
          </label>
        </div>
      </div>

      {!mountedPath && (
        <p className="mt-3 text-sm text-gray-500 italic">
          Mount a drive to enable scanning.
        </p>
      )}

      {error && (
         <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-700 border border-gray-100">
          <p>Scan complete:</p>
          <ul className="list-disc list-inside mt-1 ml-1 text-gray-600">
            <li><strong>{result.new}</strong> new files indexed</li>
            <li><strong>{result.skipped}</strong> files skipped</li>
          </ul>
        </div>
      )}
    </div>
  );
};
