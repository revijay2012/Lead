import React, { useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { LeadStatus, AccountStatus } from '../types/firestore';

interface FilterPanelProps {
  className?: string;
}

const LEAD_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'customer', 'lost'
];

const ACCOUNT_STATUSES: AccountStatus[] = [
  'active', 'churned', 'suspended'
];

const COMMON_SOURCES = [
  'website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement'
];

const COMMON_TAGS = [
  'customer', 'facebook', 'google', 'linkedin', 'twitter', 'instagram', 'high_value', 'enterprise', 'startup'
];

export function FilterPanel({ className = "" }: FilterPanelProps) {
  const { filters, setFilters } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [customTag, setCustomTag] = useState('');

  const handleStatusChange = (status: LeadStatus | AccountStatus) => {
    setFilters({ status });
  };

  const handleSourceChange = (source: string) => {
    setFilters({ source });
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !filters.tags?.includes(tag)) {
      setFilters({ 
        tags: [...(filters.tags || []), tag] 
      });
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFilters({ 
      tags: filters.tags?.filter(tag => tag !== tagToRemove) || [] 
    });
  };

  const handleCustomSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSource.trim()) {
      handleSourceChange(customSource.trim());
      setCustomSource('');
    }
  };

  const handleCustomTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTag.trim()) {
      handleTagAdd(customTag.trim());
      setCustomTag('');
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {Object.keys(filters).length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    filters.status === status
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Account Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    filters.status === status
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {COMMON_SOURCES.map((source) => (
                  <button
                    key={source}
                    onClick={() => handleSourceChange(source)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.source === source
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
              <form onSubmit={handleCustomSourceSubmit} className="flex">
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Custom source..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              {/* Selected Tags */}
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Common Tags */}
              <div className="grid grid-cols-3 gap-2">
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagAdd(tag)}
                    disabled={filters.tags?.includes(tag)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.tags?.includes(tag)
                        ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* Custom Tag Input */}
              <form onSubmit={handleCustomTagSubmit} className="flex">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Custom tag..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      const start = new Date(e.target.value);
                      setFilters({
                        date_range: {
                          start: start as any, // This would need proper Timestamp conversion
                          end: filters.date_range?.end || new Date() as any
                        }
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      const end = new Date(e.target.value);
                      setFilters({
                        date_range: {
                          start: filters.date_range?.start || new Date(0) as any,
                          end: end as any
                        }
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
