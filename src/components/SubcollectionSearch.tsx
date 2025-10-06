import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Activity, 
  FileCheck,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { 
  subcollectionSearchService, 
  SubcollectionSearchResult, 
  SubcollectionSearchFilters 
} from '../services/subcollectionSearchService';

interface SubcollectionSearchProps {
  onResultClick?: (result: SubcollectionSearchResult) => void;
  className?: string;
}

export function SubcollectionSearch({ onResultClick, className = "" }: SubcollectionSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SubcollectionSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [filters, setFilters] = useState<SubcollectionSearchFilters>({
    type: 'all'
  });
  
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(undefined);
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (term: string, currentFilters: SubcollectionSearchFilters) => {
      if (!term.trim()) {
        setResults([]);
        setHasMore(false);
        return;
      }
      
      setLoading(true);
      try {
        const searchResults = await subcollectionSearchService.searchSubcollections(
          term,
          currentFilters,
          { limit: 20 }
        );
        
        setResults(searchResults.results);
        setLastDoc(searchResults.lastDoc);
        setHasMore(searchResults.results.length === 20);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );
  
  // Search suggestions
  const debouncedSuggestions = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSuggestions([]);
        return;
      }
      
      try {
        const suggestionList = await subcollectionSearchService.getSearchSuggestions(term, 8);
        setSuggestions(suggestionList);
      } catch (error) {
        console.error('Suggestions error:', error);
        setSuggestions([]);
      }
    }, 200),
    []
  );
  
  // Effect for search
  useEffect(() => {
    debouncedSearch(searchTerm, filters);
  }, [searchTerm, filters, debouncedSearch]);
  
  // Effect for suggestions
  useEffect(() => {
    debouncedSuggestions(searchTerm);
  }, [searchTerm, debouncedSuggestions]);
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length >= 2);
  };
  
  const handleFilterChange = (key: keyof SubcollectionSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      type: 'all'
    });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'activity': return <Activity className="h-4 w-4" />;
      case 'proposal': return <FileText className="h-4 w-4" />;
      case 'contract': return <FileCheck className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'activity': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const handleResultClick = (result: SubcollectionSearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Search Subcollections</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              showFilters 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.values(filters).some(v => v && v !== 'all') && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.values(filters).filter(v => v && v !== 'all').length}
              </span>
            )}
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(searchTerm.length >= 2)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search activities, proposals, contracts..."
          />
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  handleSearchChange(suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-sm text-gray-700">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="activity">Activities</option>
                <option value="proposal">Proposals</option>
                <option value="contract">Contracts</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Search Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {searchTerm && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Search Results
                {results.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({results.length} found)
                  </span>
                )}
              </h3>
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200">
          {results.length === 0 && searchTerm && !loading && (
            <div className="px-6 py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
          
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-3 ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                      <span className="ml-1 capitalize">{result.type}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {result.leadName} • {result.leadEmail}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {result.type === 'activity' && result.data.subject}
                    {result.type === 'proposal' && result.data.title}
                    {result.type === 'contract' && (result.data.title || 'Untitled Contract')}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {result.type === 'activity' && result.data.notes}
                    {result.type === 'proposal' && result.data.description}
                    {result.type === 'contract' && result.data.terms}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(result.timestamp)}
                    </span>
                    {result.data.status && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {result.data.status}
                      </span>
                    )}
                    {result.data.created_by && (
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {result.data.created_by}
                      </span>
                    )}
                  </div>
                </div>
                
                {result.searchScore && result.searchScore > 0 && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {Math.round(result.searchScore * 10)}% match
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
