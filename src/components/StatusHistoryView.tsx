import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  ArrowRight, 
  Calendar, 
  Bot, 
  UserCheck,
  ChevronDown,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { StatusHistoryService } from '../services/statusHistoryService';
import { StatusHistory, LeadStatus } from '../types/firestore';

interface StatusHistoryViewProps {
  leadId: string;
  leadName: string;
  leadEmail: string;
  className?: string;
}

export function StatusHistoryView({ leadId, leadName, leadEmail, className = "" }: StatusHistoryViewProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    changedBy: '',
    autoTriggered: '',
    dateFrom: '',
    dateTo: ''
  });
  
  useEffect(() => {
    loadStatusHistory();
  }, [leadId]);
  
  const loadStatusHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await StatusHistoryService.getStatusHistory(leadId, {
        limit: 100,
        orderBy: 'changed_at',
        orderDirection: 'desc'
      });
      
      setStatusHistory(history);
    } catch (err) {
      console.error('Error loading status history:', err);
      setError('Failed to load status history');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedItems(newExpanded);
  };
  
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const formatDateOnly = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Filter and search logic
  const filteredHistory = statusHistory.filter(entry => {
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        entry.reason.toLowerCase().includes(term) ||
        entry.changed_by.toLowerCase().includes(term) ||
        entry.previous_status.toLowerCase().includes(term) ||
        entry.to_status.toLowerCase().includes(term) ||
        entry.event_id.toLowerCase().includes(term) ||
        (entry.comments && entry.comments.toLowerCase().includes(term)) ||
        (entry.notes && entry.notes.toLowerCase().includes(term));
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && entry.to_status !== filters.status) return false;
    
    // Changed by filter
    if (filters.changedBy && !entry.changed_by.toLowerCase().includes(filters.changedBy.toLowerCase())) return false;
    
    // Auto triggered filter
    if (filters.autoTriggered !== '') {
      const isAutoTriggered = filters.autoTriggered === 'true';
      if (entry.auto_triggered !== isAutoTriggered) return false;
    }
    
    // Date filters
    if (filters.dateFrom) {
      const entryDate = entry.changed_at.toDate ? entry.changed_at.toDate() : new Date(entry.changed_at);
      const filterDate = new Date(filters.dateFrom);
      if (entryDate < filterDate) return false;
    }
    
    if (filters.dateTo) {
      const entryDate = entry.changed_at.toDate ? entry.changed_at.toDate() : new Date(entry.changed_at);
      const filterDate = new Date(filters.dateTo);
      if (entryDate > filterDate) return false;
    }
    
    return true;
  });
  
  const clearFilters = () => {
    setFilters({
      status: '',
      changedBy: '',
      autoTriggered: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading status history...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={loadStatusHistory}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Status History</h3>
            <p className="text-sm text-gray-500">
              {leadName} • {leadEmail}
            </p>
          </div>
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
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search status history..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed-won">Closed Won</option>
              <option value="closed-lost">Closed Lost</option>
            </select>
            
            <input
              type="text"
              value={filters.changedBy}
              onChange={(e) => setFilters(prev => ({ ...prev, changedBy: e.target.value }))}
              placeholder="Changed by..."
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <select
              value={filters.autoTriggered}
              onChange={(e) => setFilters(prev => ({ ...prev, autoTriggered: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Changes</option>
              <option value="true">Auto Triggered</option>
              <option value="false">Manual</option>
            </select>
            
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        {(searchTerm || Object.values(filters).some(v => v)) && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing {filteredHistory.length} of {statusHistory.length} entries
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      {/* Status History List */}
      <div className="divide-y divide-gray-200">
        {filteredHistory.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No status history found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusHistory.length === 0 
                ? 'No status changes have been recorded for this lead.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div key={entry.event_id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.previous_status)}`}>
                      {entry.previous_status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.to_status)}`}>
                      {entry.to_status}
                    </span>
                    {entry.auto_triggered && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Bot className="h-3 w-3 mr-1" />
                        Auto
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {entry.changed_by}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(entry.changed_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-800 mb-2">{entry.reason}</p>
                  
                  {entry.comments && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Comments:</p>
                      <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
                        {entry.comments}
                      </p>
                    </div>
                  )}
                  
                  {entry.notes && (
                    <p className="text-sm text-gray-600">{entry.notes}</p>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Event ID: {entry.event_id}
                  </div>
                </div>
                
                <button
                  onClick={() => toggleExpanded(entry.event_id)}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                >
                  {expandedItems.has(entry.event_id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Expanded Details */}
              {expandedItems.has(entry.event_id) && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Previous Data</h4>
                      <pre className="bg-gray-50 p-2 rounded text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(entry.previous_data || { status: entry.previous_status }, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">New Data</h4>
                      <pre className="bg-gray-50 p-2 rounded text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(entry.new_data || { status: entry.to_status }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
