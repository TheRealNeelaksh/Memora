import React from 'react';
import { type Memory } from '../api/memoryApi';
import { MemoryCard } from './MemoryCard';
import { Loader2 } from 'lucide-react';

interface MemoryGridProps {
  memories: Memory[];
  loading: boolean;
  onMemoryClick: (memory: Memory) => void;
  selectedIds: string[];
  selectionMode: boolean;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({ memories, loading, onMemoryClick, selectedIds, selectionMode }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Searching memories...</p>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>No memories found. Try scanning a drive or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {memories.map((mem) => (
        <MemoryCard
          key={mem.file_id}
          memory={mem}
          onClick={onMemoryClick}
          selected={selectedIds.includes(mem.file_id)}
          selectionMode={selectionMode}
        />
      ))}
    </div>
  );
};
