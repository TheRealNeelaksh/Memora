import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    // Optionally trigger clear search here if desired,
    // but usually user expects explicit action or we just clear the input.
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your memories (e.g., 'cat on the sofa', 'documents from 2023')..."
          className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={clsx(
            "absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full text-sm font-medium text-white transition-colors",
             isLoading || !query.trim()
               ? "bg-gray-300 cursor-not-allowed"
               : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isLoading ? '...' : 'Search'}
        </button>
      </div>
    </form>
  );
};
