import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Building, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit,
  Download,
  RefreshCw
} from 'lucide-react';
import { Lead } from '../types/firestore';
import { collection, query, where, orderBy, limit, getDocs, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface LeadSearchGridProps {
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

interface SearchFilters {
  searchTerm: string;
  status: string;
  source: string;
  createdDateFrom: string;
  createdDateTo: string;
  updatedDateFrom: string;
  updatedDateTo: string;
  assignedTo: string;
}

const ITEMS_PER_PAGE = 12;

export function LeadSearchGrid({ onViewLead, onEditLead }: LeadSearchGridProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: '',
    source: '',
    createdDateFrom: '',
    createdDateTo: '',
    updatedDateFrom: '',
    updatedDateTo: '',
    assignedTo: ''
  });

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm || hasActiveFilters()) {
        performSearch();
      } else {
        loadLeads();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, currentPage]);

  const hasActiveFilters = () => {
    return filters.status || filters.source || filters.createdDateFrom || 
           filters.createdDateTo || filters.updatedDateFrom || filters.updatedDateTo || 
           filters.assignedTo;
  };

  const buildQuery = () => {
    const constraints = [];
    
    // Text search using search_prefixes
    if (filters.searchTerm.trim()) {
      constraints.push(where('search_prefixes', 'array-contains', filters.searchTerm.toLowerCase().trim()));
    }

    // Status filter
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    // Source filter
    if (filters.source) {
      constraints.push(where('source', '==', filters.source));
    }

    // Assigned to filter
    if (filters.assignedTo) {
      constraints.push(where('assigned_to', '==', filters.assignedTo));
    }

    // Date filters
    if (filters.createdDateFrom) {
      constraints.push(where('created_at', '>=', Timestamp.fromDate(new Date(filters.createdDateFrom))));
    }
    if (filters.createdDateTo) {
      constraints.push(where('created_at', '<=', Timestamp.fromDate(new Date(filters.createdDateTo))));
    }
    if (filters.updatedDateFrom) {
      constraints.push(where('updated_at', '>=', Timestamp.fromDate(new Date(filters.updatedDateFrom))));
    }
    if (filters.updatedDateTo) {
      constraints.push(where('updated_at', '<=', Timestamp.fromDate(new Date(filters.updatedDateTo))));
    }

    // Always order by created_at descending
    constraints.push(orderBy('created_at', 'desc'));

    return query(collection(db, 'leads'), ...constraints);
  };

  const loadLeads = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      
      const leadsData = snapshot.docs.map(doc => ({
        lead_id: doc.id,
        ...doc.data()
      })) as Lead[];

      // Simple pagination (in a real app, you'd use cursor-based pagination)
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedLeads = leadsData.slice(startIndex, endIndex);

      setLeads(paginatedLeads);
      setTotalLeads(leadsData.length);
      setTotalPages(Math.ceil(leadsData.length / ITEMS_PER_PAGE));
      setHasNextPage(page < Math.ceil(leadsData.length / ITEMS_PER_PAGE));
      setHasPrevPage(page > 1);
      setCurrentPage(page);

    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(() => {
    setCurrentPage(1);
    loadLeads(1);
  }, [filters]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      source: '',
      createdDateFrom: '',
      createdDateTo: '',
      updatedDateFrom: '',
      updatedDateTo: '',
      assignedTo: ''
    });
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadLeads(page);
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

  // Load initial data
  useEffect(() => {
    loadLeads(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Search</h2>
          <p className="text-gray-600">Search and filter leads with advanced options</p>
        </div>
        <button
          onClick={() => loadLeads(currentPage)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone, or company..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              showFilters || hasActiveFilters()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters() && (
              <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-1 text-xs font-medium">
                {Object.values(filters).filter(v => v && v !== filters.searchTerm).length}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed">Closed</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="trade_show">Trade Show</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google_ads">Google Ads</option>
                </select>
              </div>

              {/* Assigned To Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Created Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created From</label>
                <input
                  type="date"
                  value={filters.createdDateFrom}
                  onChange={(e) => handleFilterChange('createdDateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Created Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created To</label>
                <input
                  type="date"
                  value={filters.createdDateTo}
                  onChange={(e) => handleFilterChange('createdDateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Updated Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Updated From</label>
                <input
                  type="date"
                  value={filters.updatedDateFrom}
                  onChange={(e) => handleFilterChange('updatedDateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Updated Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Updated To</label>
                <input
                  type="date"
                  value={filters.updatedDateTo}
                  onChange={(e) => handleFilterChange('updatedDateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-600">
                {totalLeads} lead{totalLeads !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading leads...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => loadLeads(currentPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
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
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => onEditLead(lead)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
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
    </div>
  );
}
