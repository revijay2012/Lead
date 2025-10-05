import React, { useCallback } from 'react';
import { SearchResult } from '../types/firestore';
import { useSearch } from '../contexts/SearchContext';
import { simpleSearchService } from '../services/simpleSearchService';
import { SearchResultItem } from './SearchResultItem';
import { Loader2, AlertCircle, Search as SearchIcon } from 'lucide-react';

interface SearchResultsProps {
  onSelect?: (result: SearchResult) => void;
  className?: string;
}

export function SearchResults({ onSelect, className = "" }: SearchResultsProps) {
  const {
    results,
    loading,
    error,
    hasMore,
    lastDoc,
    mode,
    term,
    filters,
    setLoading,
    setError,
    setResults,
    setHasMore,
    setLastDoc,
  } = useSearch();

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;

    setLoading(true);
    try {
      const response = await simpleSearchService.loadMore(mode, term, lastDoc, { filters });
      setResults([...results, ...response.results], true);
      setHasMore(response.hasMore);
      setLastDoc(response.lastDoc);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load more results');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, lastDoc, mode, term, filters, results, setLoading, setError, setResults, setHasMore, setLastDoc]);

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    onSelect?.(result);
  }, [onSelect]);

  // Loading state
  if (loading && results.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Search failed</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && results.length === 0 && term) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <SearchIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No results found</p>
          <p className="text-gray-500 text-sm">
            No {mode === 'global' ? 'items' : mode} found for "{term}"
          </p>
        </div>
      </div>
    );
  }

  // No search term
  if (!term) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <SearchIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Start typing to search</p>
          <p className="text-gray-500 text-sm">
            Search across {mode === 'global' ? 'all' : mode} to find what you're looking for
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results List */}
      <div className="space-y-1">
        {results.map((result, index) => (
          <SearchResultItem
            key={`${result.type}-${result.id}-${index}`}
            result={result}
            onSelect={handleSelect}
            searchTerm={term}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Results Count */}
      {results.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {results.length} result{results.length !== 1 ? 's' : ''} found
          {hasMore && ' (more available)'}
        </div>
      )}
    </div>
  );
}

