import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface FiltersPanelProps {
  onFilterChange: (dateFrom?: string, dateTo?: string) => void;
  onClear: () => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ onFilterChange, onClear }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const applyFilters = () => {
    onFilterChange(dateFrom || undefined, dateTo || undefined);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    onClear();
  };

  const hasFilters = !!dateFrom || !!dateTo;

  return (
    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm">
      <div className="flex items-center gap-2 text-gray-500 font-medium">
        <Calendar className="w-4 h-4" />
        Filters:
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
          placeholder="From"
        />
        <span className="text-gray-400">-</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
          placeholder="To"
        />
      </div>

      <button
        onClick={applyFilters}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors font-medium"
      >
        Apply
      </button>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
};
