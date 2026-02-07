import { useState, useEffect } from 'react';
import { Brain, LayoutGrid, Clock, BookOpen, ListChecks, Settings, X, Search } from 'lucide-react';
import { DriveSelector } from './components/DriveSelector';
import { ScanControls } from './components/ScanControls';
import { SearchBar } from './components/SearchBar';
import { MemoryGrid } from './components/MemoryGrid';
import { MemoryDetail } from './components/MemoryDetail';
import { TimelineView } from './components/TimelineView';
import { FiltersPanel } from './components/FiltersPanel';
import { ChronicleView } from './components/ChronicleView';
import { VisionConfig } from './components/VisionConfig';
import { memoryApi, type Memory } from './api/memoryApi';
import clsx from 'clsx';

type ViewMode = 'grid' | 'timeline' | 'chronicle';

function App() {
  const [mountedPath, setMountedPath] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]); // Main grid memories
  const [searchResults, setSearchResults] = useState<Memory[]>([]); // Search results
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showConfig, setShowConfig] = useState(false);

  // Selection Logic
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedForChronicle, setSelectedForChronicle] = useState<Memory[]>([]);

  // Filters
  const [dateFilters, setDateFilters] = useState<{ from?: string, to?: string }>({});
  const [lastQuery, setLastQuery] = useState('');

  // Initial Health Check
  useEffect(() => {
    memoryApi.health().then(res => {
      if (res.mounted_path) setMountedPath(res.mounted_path);
    }).catch(console.error);
  }, []);

  // Clear state when mounted path changes
  const handleMount = (path: string) => {
    setMountedPath(path);
    setMemories([]);
    setSearchResults([]);
    setIsSearchActive(false);
    setSelectedForChronicle([]);
    setViewMode('grid');
    setLastQuery('');
    setSelectionMode(false);
    loadRecent(); // Load initial data
  };

  const loadRecent = async () => {
    setLoading(true);
    try {
      const res = await memoryApi.getRecentMemories(50);
      setMemories(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, from?: string, to?: string) => {
    if (!query && !from && !to) {
      // Clear search
      setIsSearchActive(false);
      setSearchResults([]);
      setLastQuery('');
      return;
    }

    setLoading(true);
    setLastQuery(query);
    try {
      const res = await memoryApi.searchMemories(query, 50, from, to);
      setSearchResults(res.results);
      setIsSearchActive(true);
    } catch (err) {
      console.error(err);
      alert('Search failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchResults([]);
    setLastQuery('');
  };

  const handleFilterChange = (from?: string, to?: string) => {
    setDateFilters({ from, to });
    if (lastQuery) {
      handleSearch(lastQuery, from, to);
    } else {
      if (from || to) {
        handleSearch("", from, to);
      } else {
        closeSearch();
      }
    }
  };

  const onMemoryClick = (mem: Memory) => {
    if (selectionMode) {
      // Toggle selection
      if (selectedForChronicle.find(m => m.file_id === mem.file_id)) {
        setSelectedForChronicle(prev => prev.filter(m => m.file_id !== mem.file_id));
      } else {
        setSelectedForChronicle(prev => [...prev, mem]);
      }
    } else {
      // Open detail
      if (viewMode === 'chronicle') return;
      setSelectedMemoryId(mem.file_id);
    }
  };

  const toggleSelectionMode = () => {
    const newMode = !selectionMode;
    setSelectionMode(newMode);
    if (!newMode) {
      setSelectedForChronicle([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans relative">

      {/* Main App Content - Blurred when search is active */}
      <div className={clsx("transition-all duration-300", isSearchActive && "blur-sm opacity-50")}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">RecallBox <span className="text-xs font-normal text-gray-500 ml-1">Phase 1.5</span></h1>
            </div>

            <div className="flex items-center gap-4">
              {mountedPath && (
                <div className="text-sm text-gray-500 font-mono hidden sm:block bg-gray-100 px-2 py-1 rounded">
                  {mountedPath}
                </div>
              )}

              {mountedPath && (
                <button
                  onClick={() => setShowConfig(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Configure Vision"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Top Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {!mountedPath ? (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  <Brain className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-700">Welcome to RecallBox</p>
                  <p className="text-sm">Please mount a local photo directory to begin.</p>
                </div>
              ) : (
                <>
                  {/* Search Bar is always visible */}
                  <SearchBar onSearch={(q) => handleSearch(q, dateFilters.from, dateFilters.to)} isLoading={loading} />

                  {/* View Toggles & Filters */}
                  {memories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={clsx("p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium", viewMode === 'grid' ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900")}
                        >
                          <LayoutGrid className="w-4 h-4" /> Grid
                        </button>
                        <button
                          onClick={() => setViewMode('timeline')}
                          className={clsx("p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium", viewMode === 'timeline' ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900")}
                        >
                          <Clock className="w-4 h-4" /> Timeline
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('chronicle');
                            setSelectionMode(false); // Auto-exit selection mode when viewing chronicle
                          }}
                          className={clsx("p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium relative", viewMode === 'chronicle' ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900")}
                        >
                          <BookOpen className="w-4 h-4" /> Chronicle
                          {selectedForChronicle.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                              {selectedForChronicle.length}
                            </span>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={toggleSelectionMode}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          selectionMode ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <ListChecks className="w-4 h-4" />
                        {selectionMode ? 'Done Selecting' : 'Select Memories'}
                      </button>

                      <FiltersPanel onFilterChange={handleFilterChange} onClear={() => handleFilterChange()} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-6">
              <DriveSelector onMount={handleMount} />
              {mountedPath && <ScanControls mountedPath={mountedPath} />}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="min-h-[400px]">
            {viewMode === 'grid' && (
              <MemoryGrid
                memories={memories} // Show all/recent memories here
                loading={loading && !isSearchActive} // Only show loader here if NOT searching (searching has its own overlay)
                onMemoryClick={onMemoryClick}
                selectedIds={selectedForChronicle.map(m => m.file_id)}
                selectionMode={selectionMode}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineView
                memories={memories}
                onMemoryClick={onMemoryClick}
                selectedIds={selectedForChronicle.map(m => m.file_id)}
                selectionMode={selectionMode}
              />
            )}

            {viewMode === 'chronicle' && (
              <ChronicleView
                selectedMemories={selectedForChronicle.length > 0 ? selectedForChronicle : memories}
                onClear={() => setSelectedForChronicle([])}
              />
            )}
          </div>
        </main>
      </div>

      {/* Search Overlay */}
      {isSearchActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={closeSearch} />

          {/* Modal Content */}
          <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-full">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
                  <p className="text-sm text-gray-500">Found {searchResults.length} matches for "{lastQuery}"</p>
                </div>
              </div>
              <button onClick={closeSearch} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {searchResults.length > 0 ? (
                <MemoryGrid
                  memories={searchResults}
                  loading={false}
                  onMemoryClick={(m) => {
                    setSelectedMemoryId(m.file_id);
                    // Optional: Do we close search? Maybe not, keep it open to browse results.
                  }}
                  selectedIds={selectedForChronicle.map(m => m.file_id)}
                  selectionMode={selectionMode}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Search className="w-16 h-16 mb-4 opacity-20" />
                  <p>No results found matching your query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfig && <VisionConfig onClose={() => setShowConfig(false)} />}

      {/* Detail Modal (Higher Z-Index than Search Overlay to open "on top" of it) */}
      {selectedMemoryId && (
        <MemoryDetail
          memoryId={selectedMemoryId}
          thumbnailB64={
            // Try to find thumb in search results OR main memories
            searchResults.find(m => m.file_id === selectedMemoryId)?.thumbnail_b64 ||
            memories.find(m => m.file_id === selectedMemoryId)?.thumbnail_b64
          }
          onClose={() => setSelectedMemoryId(null)}
        />
      )}

    </div>
  );
}

export default App;
