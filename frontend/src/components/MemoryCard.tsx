import React from 'react';
import { type Memory } from '../api/memoryApi';
import { ImageIcon, CheckCircle, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface MemoryCardProps {
  memory: Memory;
  onClick: (memory: Memory) => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onClick, selected, selectionMode }) => {


  // Parse tags if string, else use as is
  const tagsList = memory.tags
    ? memory.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3)
    : [];

  const isVisionFailed = memory.vision_status === 'failed';

  return (
    <div
      onClick={() => onClick(memory)}
      className={clsx(
        "group flex flex-col bg-white rounded-lg overflow-hidden cursor-pointer transition-all border shadow-sm h-full",
        selected
          ? "border-blue-600 ring-2 ring-blue-200"
          : "border-gray-200 hover:shadow-md"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {memory.thumbnail_b64 ? (
          <img
            src={memory.thumbnail_b64}
            alt={memory.summary || "Memory"}
            className={clsx(
              "w-full h-full object-cover transition-transform duration-300",
              !selected && "group-hover:scale-105"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}


        {/* Failed Indicator */}
        {isVisionFailed && (
          <div className="absolute top-2 left-2 bg-red-100/90 text-red-600 p-1 rounded text-xs font-bold shadow-sm" title="Vision analysis failed">
            <EyeOff className="w-4 h-4" />
          </div>
        )}

        {/* Selection Indicator */}
        {selectionMode && (
          <div className={clsx(
            "absolute top-2 right-2 rounded-full p-1 transition-all z-10",
            selected ? "bg-blue-600 text-white" : "bg-black/30 text-white/50 hover:bg-black/50"
          )}>
            <CheckCircle className="w-5 h-5" fill={selected ? "currentColor" : "none"} />
          </div>
        )}

        {/* Score Indicator */}
        {memory.score !== undefined && memory.score > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded border border-white/20 font-mono shadow-sm z-10" title="Similarity Score">
            {(memory.score).toFixed(2)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-grow">
        <p className="text-gray-900 text-sm font-medium line-clamp-2 leading-tight" title={memory.summary}>
          {memory.summary || "No description available"}
        </p>

        <div className="flex flex-wrap gap-1 mt-auto">
          {tagsList.length > 0 ? (
            tagsList.map((t, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200">
                {t}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 italic">No tags</span>
          )}
        </div>

        {memory.exif_date && (
          <p className="text-gray-400 text-[10px] mt-1 border-t pt-2">
            {format(new Date(memory.exif_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
};
