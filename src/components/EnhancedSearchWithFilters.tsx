import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  RefreshCw, 
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import { Lead } from '../types/firestore';
import { AdvancedFilterPanel, FilterGroup } from './AdvancedFilterPanel';
import { AdvancedFilterService } from '../services/advancedFilterService';

interface EnhancedSearchWithFiltersProps {
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

const ITEMS_PER_PAGE = 12;

export function EnhancedSearchWithFilters({ onViewLead, onEditLead }: EnhancedSearchWithFiltersProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterGroup[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || hasActiveFilters) {
        performSearch();
      } else {
        loadAllLeads();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeFilters, currentPage]);

  const loadAllLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await AdvancedFilterService.filterLeads([], ITEMS_PER_PAGE);
      setLeads(result.leads);
      setTotalLeads(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / ITEMS_PER_PAGE));
      setHasNextPage(result.hasMore);
      setHasPrevPage(currentPage > 1);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (hasActiveFilters) {
        // Use advanced filters
        result = await AdvancedFilterService.filterLeads(activeFilters, ITEMS_PER_PAGE);
      } else if (searchTerm.trim()) {
        // Use simple search
        const searchFilters: FilterGroup[] = [{
          id: 'search-group',
          conditions: [{
            id: 'search-condition',
            field: 'first_name',
            operator: 'contains',
            value: searchTerm,
            enabled: true
          }],
          operator: 'OR',
          enabled: true
        }];
        result = await AdvancedFilterService.filterLeads(searchFilters, ITEMS_PER_PAGE);
      } else {
        result = await AdvancedFilterService.filterLeads([], ITEMS_PER_PAGE);
      }

      setLeads(result.leads);
      setTotalLeads(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / ITEMS_PER_PAGE));
      setHasNextPage(result.hasMore);
      setHasPrevPage(currentPage > 1);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeFilters, hasActiveFilters, currentPage]);

  const handleApplyFilters = (filters: FilterGroup[]) => {
    setActiveFilters(filters);
    setHasActiveFilters(filters.length > 0 && filters.some(group => 
      group.enabled && group.conditions.some(condition => 
        condition.enabled && condition.value.trim() !== ''
      )
    ));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setHasActiveFilters(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'customer':
      case 'active':
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'new':
      case 'draft':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiation':
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
      case 'rejected':
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getActiveFilterCount = () => {
    return activeFilters.reduce((count, group) => {
      if (!group.enabled) return count;
      return count + group.conditions.filter(condition => condition.enabled && condition.value.trim()).length;
    }, 0);
  };

  // Load initial data
  useEffect(() => {
    loadAllLeads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Lead Search</h2>
          <p className="text-gray-600">Search and filter leads with complex conditions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => performSearch()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              hasActiveFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-1 text-xs font-medium">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((group, groupIndex) => (
                    group.enabled && group.conditions
                      .filter(condition => condition.enabled && condition.value.trim())
                      .map((condition, conditionIndex) => (
                        <span
                          key={`${group.id}-${condition.id}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {condition.field}: {condition.value}
                          <button
                            onClick={() => {
                              const newFilters = [...activeFilters];
                              newFilters[groupIndex].conditions[conditionIndex].enabled = false;
                              handleApplyFilters(newFilters);
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                  ))}
                </div>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Searching leads...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => performSearch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Found {totalLeads} lead{totalLeads !== 1 ? 's' : ''}
                {hasActiveFilters && ` with ${getActiveFilterCount()} active filter${getActiveFilterCount() !== 1 ? 's' : ''}`}
              </div>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {leads.map((lead) => (
              <div key={lead.lead_id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                      </h3>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {lead.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {lead.phone}
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      {lead.company}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="space-y-1 mb-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created: {formatDate(lead.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Updated: {formatDate(lead.updated_at)}
                  </div>
                </div>

                {/* Document ID */}
                <div className="mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-500">
                    ID: {lead.lead_id}
                  </span>
                </div>

                {/* Value */}
                {lead.contract_value > 0 && (
                  <div className="text-sm font-medium text-green-600 mb-4">
                    {formatCurrency(lead.contract_value)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewLead(lead)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <User className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => onEditLead(lead)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalLeads)} of {totalLeads} results
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => goToPage(totalPages)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}
