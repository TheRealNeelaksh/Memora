import React from 'react';
import { type Memory } from '../api/memoryApi';
import { format, parseISO, getMonth } from 'date-fns';
import { MemoryCard } from './MemoryCard';

interface TimelineViewProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
  selectedIds: string[];
  selectionMode: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ memories, onMemoryClick, selectedIds, selectionMode }) => {
  // Group memories by Year -> Month
  const grouped = React.useMemo(() => {
    const groups: Record<string, Record<string, Memory[]>> = {};

    memories.forEach(mem => {
      const dateStr = mem.exif_date || mem.created_at;
      const date = dateStr ? parseISO(dateStr) : null;

      const year = date ? format(date, 'yyyy') : 'Unknown Date';
      const monthKey = date ? `${getMonth(date)}:${format(date, 'MMMM')}` : '99:Others';

      if (!groups[year]) groups[year] = {};
      if (!groups[year][monthKey]) groups[year][monthKey] = [];

      groups[year][monthKey].push(mem);
    });

    return groups;
  }, [memories]);

  // Sort years descending
  const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (memories.length === 0) {
    return <div className="text-center text-gray-400 py-10">No memories to display on timeline.</div>;
  }

  return (
    <div className="space-y-8 relative">
       {/* Vertical Line */}
       <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />

       {sortedYears.map(year => (
         <div key={year} className="relative">
           {/* Year Marker */}
           <div className="sticky top-20 z-10 mb-6 ml-0 md:ml-12">
             <span className="bg-blue-100 text-blue-800 text-lg font-bold px-4 py-1 rounded-full shadow-sm border border-blue-200 inline-block">
               {year}
             </span>
           </div>

           <div className="space-y-6 ml-0 md:ml-12">
             {/* Sort months by their numeric prefix (0:January, 1:February, etc) */}
             {Object.keys(grouped[year])
               .sort((a, b) => {
                 const numA = parseInt(a.split(':')[0]);
                 const numB = parseInt(b.split(':')[0]);
                 return numB - numA; // Descending order (Dec -> Jan)
               })
               .map(monthKey => {
                 const monthName = monthKey.split(':')[1];
                 return (
                   <div key={monthKey}>
                      <h3 className="text-gray-500 font-medium mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        {monthName}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {grouped[year][monthKey].map(mem => (
                          <MemoryCard
                            key={mem.file_id}
                            memory={mem}
                            onClick={onMemoryClick}
                            selected={selectedIds.includes(mem.file_id)}
                            selectionMode={selectionMode}
                          />
                        ))}
                      </div>
                   </div>
                 );
               })}
           </div>
         </div>
       ))}
    </div>
  );
};
