import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Filter, Clock, Loader2 } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { SearchMode } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import { simpleSearchService } from '../services/simpleSearchService';

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

const SEARCH_MODES: { value: SearchMode; label: string; icon: React.ReactNode }[] = [
  { value: 'global', label: 'All', icon: <Search className="w-4 h-4" /> },
  { value: 'leads', label: 'Leads', icon: <Search className="w-4 h-4" /> },
  { value: 'activities', label: 'Activities', icon: <Search className="w-4 h-4" /> },
  { value: 'proposals', label: 'Proposals', icon: <Search className="w-4 h-4" /> },
  { value: 'contracts', label: 'Contracts', icon: <Search className="w-4 h-4" /> },
];

export function SearchBar({ 
  onFocus, 
  onBlur, 
  placeholder = "Search leads, activities, proposals...",
  className = ""
}: SearchBarProps) {
  const {
    mode,
    term,
    loading,
    recentSearches,
    setMode,
    setTerm,
    setLoading,
    setError,
    setResults,
    setHasMore,
    setLastDoc,
    clearResults,
    addRecentSearch,
    getCachedResults,
    setCachedResults,
    searchKey,
  } = useSearch();

  const [isFocused, setIsFocused] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  const debouncedTerm = useDebounce(term, 300);

  // Handle search
  const performSearch = useCallback(async (searchTerm: string, searchMode: SearchMode, append = false) => {
    if (!searchTerm.trim()) {
      clearResults();
      return;
    }

    // Check cache first
    const cacheKey = `${searchMode}-${searchTerm}`;
    const cachedResults = getCachedResults(cacheKey);
    
    if (cachedResults && !append) {
      setResults(cachedResults);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await simpleSearchService.search(searchMode, searchTerm, {
        lastDoc: append ? searchKey : undefined
      });

      if (append) {
        setResults([...getCachedResults(searchKey) || [], ...response.results]);
      } else {
        setResults(response.results);
        setCachedResults(cacheKey, response.results);
      }

      setHasMore(response.hasMore);
      setLastDoc(response.lastDoc);
      addRecentSearch(searchTerm);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [
    mode,
    setLoading,
    setError,
    setResults,
    setHasMore,
    setLastDoc,
    clearResults,
    addRecentSearch,
    getCachedResults,
    setCachedResults,
    searchKey
  ]);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedTerm) {
      performSearch(debouncedTerm, mode);
    } else {
      clearResults();
    }
  }, [debouncedTerm, mode, performSearch, clearResults]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  // Handle mode change
  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode);
    setShowModeDropdown(false);
    if (term.trim()) {
      performSearch(term, newMode);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (recentTerm: string) => {
    setTerm(recentTerm);
    setShowRecentSearches(false);
    performSearch(recentTerm, mode);
  };

  // Handle clear
  const handleClear = () => {
    setTerm('');
    clearResults();
    inputRef.current?.focus();
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowRecentSearches(true);
    onFocus?.();
  };

  // Handle blur
  const handleBlur = () => {
    // Delay to allow clicking on dropdown items
    setTimeout(() => {
      setIsFocused(false);
      setShowRecentSearches(false);
      setShowModeDropdown(false);
      onBlur?.();
    }, 150);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMode = SEARCH_MODES.find(m => m.value === mode);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={term}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        
        {/* Mode Selector */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            type="button"
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            {currentMode?.icon}
            <span className="ml-1">{currentMode?.label}</span>
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Clear Button */}
          {term && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <div className="p-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Mode Dropdown */}
      {showModeDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {SEARCH_MODES.map((modeOption) => (
            <button
              key={modeOption.value}
              onClick={() => handleModeChange(modeOption.value)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                mode === modeOption.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
              }`}
            >
              {modeOption.icon}
              <span className="ml-2">{modeOption.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches Dropdown */}
      {showRecentSearches && recentSearches.length > 0 && !term && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent Searches
          </div>
          {recentSearches.map((recentTerm, index) => (
            <button
              key={index}
              onClick={() => handleRecentSearchClick(recentTerm)}
              className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center"
            >
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              {recentTerm}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      {!isFocused && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <kbd className="inline-flex items-center px-2 py-1 border border-gray-200 rounded text-xs font-mono text-gray-500">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
}

