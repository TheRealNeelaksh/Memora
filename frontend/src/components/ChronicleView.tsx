import React from 'react';
import { type Memory } from '../api/memoryApi';
import { ArrowRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface ChronicleViewProps {
  selectedMemories: Memory[];
  onClear: () => void;
}

export const ChronicleView: React.FC<ChronicleViewProps> = ({ selectedMemories, onClear }) => {
  // Sort by date
  const sorted = [...selectedMemories].sort((a, b) => {
    const da = a.exif_date || a.created_at || "0";
    const db = b.exif_date || b.created_at || "0";
    const dateComp = da.localeCompare(db);
    if (dateComp !== 0) return dateComp;
    return a.file_id.localeCompare(b.file_id); // Stable fallback
  });

  if (selectedMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
        <BookOpen className="w-8 h-8 mb-2" />
        <p>Select memories to create a chronicle.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          Chronicle
        </h2>
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Clear Selection
        </button>
      </div>

      <div className="space-y-6">
        {sorted.map((mem, i) => (
          <div key={mem.file_id} className="flex gap-4 relative">
            {/* Connector Line */}
            {i !== sorted.length - 1 && (
               <div className="absolute left-[2.25rem] top-12 bottom-[-1.5rem] w-0.5 bg-gray-200" />
            )}

            {/* Image */}
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative z-10">
               {mem.thumbnail_b64 ? (
                 <img src={mem.thumbnail_b64} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gray-200" />
               )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                  {mem.exif_date ? format(new Date(mem.exif_date), 'MMMM d, yyyy') : 'Unknown Date'}
                </span>
                <ArrowRight className="w-3 h-3 text-gray-300" />
              </div>
              <p className="text-gray-700 leading-relaxed font-serif">
                {mem.summary || "No summary available."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
