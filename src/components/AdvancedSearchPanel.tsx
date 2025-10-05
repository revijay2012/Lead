import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronRight,
  User,
  Activity,
  FileText,
  FileCheck,
  Calendar,
  Tag,
  Loader2
} from 'lucide-react';
import { 
  searchGlobalIndex, 
  GlobalSearchResult,
  GlobalSearchEntityType
} from '../services/globalSearchIndex';
import { 
  searchAcrossAllSubcollections, 
  SubcollectionSearchResult 
} from '../services/subcollectionSearch';
import { 
  getLeadsByPrefix,
  SearchResult,
  SearchFilters
} from '../services/firestoreSearch';
import { useDebounce } from '../hooks/useDebounce';

interface AdvancedSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (result: any) => void;
}

export function AdvancedSearchPanel({ isOpen, onClose, onResultClick }: AdvancedSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'activities' | 'proposals' | 'contracts'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  // Get search suggestions
  useEffect(() => {
    if (searchTerm.length >= 2) {
      getSearchSuggestions(searchTerm, 5).then(setSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      let entityTypes: string[] = [];
      
      switch (activeTab) {
        case 'leads':
          entityTypes = ['lead'];
          break;
        case 'activities':
          entityTypes = ['activity'];
          break;
        case 'proposals':
          entityTypes = ['proposal'];
          break;
        case 'contracts':
          entityTypes = ['contract'];
          break;
        default:
          entityTypes = ['lead', 'activity', 'proposal', 'contract'];
      }

      const searchFilters = {
        type: filters.type || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from ? new Date(filters.date_from) : undefined,
        date_to: filters.date_to ? new Date(filters.date_to) : undefined
      };

      const result = await searchGlobalIndex(searchTerm, entityTypes, searchFilters);
      setSearchResults(result.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'lead':
        return <User className="h-4 w-4" />;
      case 'activity':
        return <Activity className="h-4 w-4" />;
      case 'proposal':
        return <FileText className="h-4 w-4" />;
    case 'contract':
      return <FileCheck className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case 'lead':
        return 'text-blue-600 bg-blue-100';
      case 'activity':
        return 'text-green-600 bg-green-100';
      case 'proposal':
        return 'text-purple-600 bg-purple-100';
      case 'contract':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search across all entities..."
                />
              </div>
              
              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'all', label: 'All', icon: Search },
              { id: 'leads', label: 'Leads', icon: User },
              { id: 'activities', label: 'Activities', icon: Activity },
              { id: 'proposals', label: 'Proposals', icon: FileText },
              { id: 'contracts', label: 'Contracts', icon: FileContract }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
            </button>
            
            {showFilters && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="demo">Demo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {searchResults.length === 0 && !loading && searchTerm && (
              <div className="text-center text-gray-500 py-8">
                No results found for "{searchTerm}"
              </div>
            )}
            
            {searchResults.length === 0 && !loading && !searchTerm && (
              <div className="text-center text-gray-500 py-8">
                Enter a search term to find leads, activities, proposals, and contracts
              </div>
            )}

            {searchResults.map((result) => (
              <div
                key={`${result.entity}-${result.id}`}
                onClick={() => onResultClick(result)}
                className="p-4 border border-gray-200 rounded-lg mb-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getEntityColor(result.entity)}`}>
                      {getEntityIcon(result.entity)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {result.title || result.subject || result.lead_name || 'Untitled'}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getEntityColor(result.entity)}`}>
                          {result.entity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {result.description || result.notes || result.lead_email || 'No description'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {result.lead_name && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {result.lead_name}
                          </div>
                        )}
                        
                        {result.type && (
                          <div className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            {result.type}
                          </div>
                        )}
                        
                        {result.timestamp && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(result.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {result.status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.status === 'active' ? 'bg-green-100 text-green-800' :
                      result.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
