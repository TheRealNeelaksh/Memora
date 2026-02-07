import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Image as ImageIcon, ExternalLink, Copy, Check, Loader2, EyeOff } from 'lucide-react';
import { type MemoryDetail as MemoryDetailType, memoryApi } from '../api/memoryApi';
import { format } from 'date-fns';

interface MemoryDetailProps {
  memoryId: string | null;
  thumbnailB64?: string; // Fallback if full image fails or while loading
  onClose: () => void;
}

export const MemoryDetail: React.FC<MemoryDetailProps> = ({ memoryId, thumbnailB64, onClose }) => {
  const [data, setData] = useState<MemoryDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'info' | 'vision'>('info');

  useEffect(() => {
    if (!memoryId) return;

    setLoading(true);
    setError(null);
    setTab('info');

    memoryApi.getMemory(memoryId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [memoryId]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!memoryId) return null;

  const handleCopyPath = () => {
    if (data?.path) {
      navigator.clipboard.writeText(data.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openFile = async () => {
  if (!data?.path) return;

  try {
    await fetch("http://localhost:8000/open-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: data.path }),
    });
  } catch (err) {
    console.error("Failed to open file:", err);
  }
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image Preview - Takes remaining space */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative group overflow-hidden">
          {data ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {data.file_id ? (
                <img
                  src={`/api/images/${data.file_id}`}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to thumbnail if high-res fails
                    if (thumbnailB64) e.currentTarget.src = thumbnailB64;
                    else e.currentTarget.style.display = 'none';
                  }}
                />
              ) : thumbnailB64 ? (
                <img
                  src={thumbnailB64}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p>No preview available</p>
                </div>
              )}


              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Browser cannot display local files directly. Use 'Open Original'.
              </div>
            </div>
          ) : (
            <div className="animate-pulse w-full h-full bg-gray-800" />
          )}
        </div>

        {/* Right: Details - Fixed width */}
        <div className="w-[400px] flex-shrink-0 flex flex-col border-l border-gray-200 bg-gray-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-start bg-white">
            <h3 className="font-semibold text-gray-800 text-lg line-clamp-1" title={data?.path}>
              {data ? data.path.split('/').pop() : 'Loading...'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setTab('info')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Info
            </button>
            <button
              onClick={() => setTab('vision')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'vision' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Vision Inspection
            </button>
          </div>

          {loading && !data && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {error && (
            <div className="p-6 text-red-600">
              Error loading details: {error}
            </div>
          )}

          {data && tab === 'info' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Summary */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </h4>
                <div className="max-h-60 overflow-y-auto pr-2">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {data.memory_summary || "No summary available for this memory."}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Date</p>
                    <p className="text-sm font-medium">
                      {data.exif_date ? format(new Date(data.exif_date), 'PPP p') : 'Unknown Date'}
                    </p>
                  </div>
                </div>
              </div>

              {/* OCR Text */}
              {data.ocr_text && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Extracted Text (OCR)
                  </h4>
                  <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {data.ocr_text}
                  </p>
                </div>
              )}

              {/* File Actions */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <button
                  onClick={openFile}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Original
                </button>

                <div className="relative">
                  <div className="bg-gray-200 p-2 rounded text-xs font-mono text-gray-600 break-all pr-10 border border-gray-300">
                    {data.path}
                  </div>
                  <button
                    onClick={handleCopyPath}
                    className="absolute right-1 top-1 p-1 hover:bg-gray-300 rounded text-gray-500 hover:text-gray-700"
                    title="Copy full path"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-center text-gray-400">
                  If "Open Original" fails, copy the path and open in your file explorer.
                  <br />
                  Your browser blocked direct file access. Use 'Copy Path' to open the image manually.
                </p>
              </div>

            </div>
          )}

          {data && tab === 'vision' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vision Status</h4>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${data.vision_status === 'success' ? 'bg-green-100 text-green-700' :
                  data.vision_status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                  {data.vision_status || 'Pending / None'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-xs overflow-x-auto">
                {data.vision_json ? (
                  <pre>{JSON.stringify(JSON.parse(data.vision_json), null, 2)}</pre>
                ) : (
                  <div className="text-gray-400 italic flex flex-col items-center py-8">
                    <EyeOff className="w-8 h-8 mb-2" />
                    <p>No vision data available.</p>
                    <p className="text-[10px] mt-1">Check "Vision Configuration" and Rescan.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
