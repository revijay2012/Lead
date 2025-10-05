import { useState, useEffect } from 'react';
import { Search, Plus, Users, Loader2, Filter, X } from 'lucide-react';
import { TestConnection } from './components/TestConnection';
import { LeadsList } from './components/LeadsList';
import { LeadDetailManagement } from './components/LeadDetailManagement';
import { EnhancedLeadForm } from './components/EnhancedLeadForm';
import { LeadSearchGrid } from './components/LeadSearchGrid';
import { Lead } from './types/firestore';
import { collection, getDocs, query, orderBy, limit, where, startAt, endAt, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import { LeadManagementService } from './services/leadManagement';

function App() {
  const [currentView, setCurrentView] = useState<'leads' | 'search' | 'search-grid'>('leads');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    status: '',
    source: '',
    tags: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleViewLead = (lead: Lead) => {
    console.log('View lead:', lead);
    setSelectedResult(lead);
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setShowLeadForm(true);
  };

  const handleEditLead = (lead: Lead) => {
    console.log('Edit lead:', lead);
    setEditingLead(lead);
    setShowLeadForm(true);
  };

  // Search functionality
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const leadsRef = collection(db, 'leads');
      let q = query(leadsRef);
      
      // Build query based on search type
      if (searchTerm.includes('@')) {
        // Email search
        q = query(leadsRef, orderBy('email_lower'), startAt(searchTerm.toLowerCase()), endAt(searchTerm.toLowerCase() + '\uf8ff'));
      } else if (/^\d+$/.test(searchTerm.replace(/\D/g, ''))) {
        // Phone search
        const phoneDigits = searchTerm.replace(/\D/g, '');
        q = query(leadsRef, orderBy('phone_digits'), startAt(phoneDigits), endAt(phoneDigits + '\uf8ff'));
      } else {
        // Name or company search using search_prefixes array
        q = query(leadsRef, where('search_prefixes', 'array-contains', searchTerm.toLowerCase()));
      }
      
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({
        lead_id: doc.id,
        ...doc.data()
      })) as Lead[];

      // Apply additional filters
      if (searchFilters.status) {
        results = results.filter(lead => lead.status === searchFilters.status);
      }
      if (searchFilters.source) {
        results = results.filter(lead => lead.source === searchFilters.source);
      }
      if (searchFilters.tags.length > 0) {
        results = results.filter(lead => 
          searchFilters.tags.some(tag => lead.tags?.includes(tag))
        );
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchFilters]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchFilters({ status: '', source: '', tags: [] });
  };

  // Helper function to generate search prefixes
  const generateSearchPrefixes = (text: string) => {
    if (!text) return [];
    const prefixes = new Set();
    const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = normalizedText.split(/\s+/).filter(word => word.length > 0);

    words.forEach(word => {
      for (let i = 1; i <= word.length; i++) {
        prefixes.add(word.substring(0, i));
      }
    });
    return Array.from(prefixes);
  };

  // Save lead to Firestore (create or update)
  const saveLead = async (formData: FormData) => {
    try {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const company = formData.get('company') as string;
      const title = formData.get('title') as string;
      const status = formData.get('status') as string;
      const source = formData.get('source') as string;
      const notes = formData.get('notes') as string;

      const fullName = `${firstName} ${lastName}`;
      const phoneDigits = phone.replace(/\D/g, '');
      
      // Generate search prefixes from name, email, phone, and company
      const searchPrefixes = [
        ...generateSearchPrefixes(fullName),
        ...generateSearchPrefixes(email),
        ...generateSearchPrefixes(phone),
        ...generateSearchPrefixes(company)
      ];

      const leadData = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        full_name_lower: fullName.toLowerCase(),
        email: email,
        email_lower: email.toLowerCase(),
        phone: phone || '',
        phone_digits: phoneDigits,
        company: company,
        company_lower: company.toLowerCase(),
        title: title || '',
        status: (status as any) || 'new',
        stage: editingLead?.stage || 'awareness',
        contract_value: editingLead?.contract_value || 0,
        account_status: editingLead?.account_status || 'active',
        source: source || 'Manual Entry',
        updated_at: Timestamp.now(),
        search_prefixes: searchPrefixes,
        tags: editingLead?.tags || [],
        notes: notes || '',
        assigned_to: editingLead?.assigned_to || 'Current User',
        address: editingLead?.address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'USA',
        },
      };

      // Add created_at only for new leads
      if (!editingLead) {
        (leadData as any).created_at = Timestamp.now();
      } else {
        (leadData as any).created_at = editingLead.created_at;
      }

      let resultMessage = '';
      
      if (editingLead) {
        // Update existing lead with audit trail
        await LeadManagementService.updateLead(
          editingLead.lead_id, 
          leadData, 
          'Current User',
          'Lead updated via form'
        );
        resultMessage = `Lead updated successfully! ID: ${editingLead.lead_id}`;
        console.log('Lead updated successfully with ID:', editingLead.lead_id);
      } else {
        // Create new lead
        const leadsRef = collection(db, 'leads');
        const docRef = await addDoc(leadsRef, leadData);
        resultMessage = `Lead created successfully! ID: ${docRef.id}`;
        console.log('Lead created successfully with ID:', docRef.id);
      }
      
      // Close form and show success
      setShowLeadForm(false);
      setEditingLead(null);
      alert(resultMessage);
      
      // Refresh the leads list if we're on the leads view
      if (currentView === 'leads') {
        window.location.reload(); // Simple refresh for now
      }
      
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-semibold text-gray-900">LEADS Management System</h1>
              
              {/* Navigation */}
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('leads')}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'leads'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Leads
                </button>
                <button
                  onClick={() => setCurrentView('search')}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'search'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </button>
                <button
                  onClick={() => setCurrentView('search-grid')}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'search-grid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Search Grid
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
                  {/* Add Lead Button */}
              <button
                onClick={handleAddLead}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Debug Connection Test */}
          <div className="mb-6">
            <TestConnection />
          </div>
          
          {currentView === 'leads' ? (
            /* Leads List View */
        <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">All Leads</h2>
              <LeadsList 
                onViewLead={handleViewLead}
                onEditLead={handleEditLead}
              />
            </div>
          ) : currentView === 'search-grid' ? (
            /* Search Grid View */
            <LeadSearchGrid
              onViewLead={handleViewLead}
              onEditLead={handleEditLead}
            />
          ) : (
                /* Search View */
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Search Leads</h2>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </button>
                  </div>
            
            {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
              <input
                type="text"
                        placeholder="Search by name, email, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg"
                      />
                      {searchTerm && (
                        <button
                          onClick={clearSearch}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    {/* Search Tips */}
                    <div className="mt-2 text-sm text-gray-500">
                      <p>💡 Try searching by: name (John), email (john@company.com), phone (555), or company (Tech)</p>
                    </div>
            </div>
            
            {/* Filters */}
                  {showFilters && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Results</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                            value={searchFilters.status}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              </div>
              
              <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                            value={searchFilters.source}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, source: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Sources</option>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Cold Call">Cold Call</option>
                            <option value="Event">Event</option>
                            <option value="Partner">Partner</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                          <select
                            value=""
                            onChange={(e) => {
                              const tag = e.target.value;
                              if (tag && !searchFilters.tags.includes(tag)) {
                                setSearchFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a tag...</option>
                            <option value="enterprise">Enterprise</option>
                            <option value="small-business">Small Business</option>
                            <option value="startup">Startup</option>
                            <option value="active">Active</option>
                            <option value="priority">Priority</option>
                            <option value="new-market">New Market</option>
                </select>
                          {searchFilters.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {searchFilters.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {tag}
                                  <button
                                    onClick={() => setSearchFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
              </div>
                          )}
            </div>
          </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchLoading && (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Searching...</span>
            </div>
                  )}

                  {!searchLoading && searchTerm && searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search terms or filters.
                      </p>
                    </div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Search Results ({searchResults.length})
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Found {searchResults.length} leads matching "{searchTerm}"
                        </p>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        {searchResults.map((lead) => (
                          <li key={lead.lead_id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewLead(lead)}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                                      </p>
                                      <p className="text-sm text-gray-500">{lead.email}</p>
                                    </div>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    lead.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                                    lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                                    lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                    lead.status === 'proposal' ? 'bg-purple-100 text-purple-800' :
                                    lead.status === 'closed-won' ? 'bg-green-100 text-green-800' :
                                    lead.status === 'closed-lost' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                              {lead.status}
                            </span>
                          </div>
                                
                                <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                                  {lead.phone && (
                                    <div className="flex items-center">
                                      <span className="mr-1">📞</span>
                                      {lead.phone}
                        </div>
                                  )}
                                  {lead.company && (
                                    <div className="flex items-center">
                                      <span className="mr-1">🏢</span>
                                      {lead.company}
                        </div>
                                  )}
                                  {lead.source && (
                                    <div className="flex items-center">
                                      <span className="mr-1">📍</span>
                                      {lead.source}
                      </div>
                                  )}
                    </div>
                              </div>
                            </div>
                          </li>
                  ))}
                      </ul>
                </div>
              )}

                  {!searchTerm && (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching for leads</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter a name, email, phone number, or company name to find leads.
                      </p>
            </div>
                  )}
          </div>
              )}
        </div>
      </main>

      {/* Enhanced Lead Form Modal */}
      {showLeadForm && (
        <EnhancedLeadForm
          lead={editingLead}
          onSave={(updatedLead) => {
            setShowLeadForm(false);
            setEditingLead(null);
            // Refresh the leads list
            window.location.reload();
          }}
          onClose={() => {
            setShowLeadForm(false);
            setEditingLead(null);
          }}
        />
      )}

      {/* Old Lead Form Modal - Commented Out */}
      {false && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center p-4 pt-8">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowLeadForm(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mt-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </h3>
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form 
                className="p-6 space-y-6"
                onSubmit={async (e) => {
                e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await saveLead(formData);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                  <input
                    type="text"
                      id="firstName"
                      name="firstName"
                    required
                      defaultValue={editingLead?.first_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter first name"
                  />
                </div>
                  
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                  <input
                    type="text"
                      id="lastName"
                      name="lastName"
                    required
                      defaultValue={editingLead?.last_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter last name"
                  />
                </div>
                  
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                  <input
                    type="email"
                      id="email"
                    name="email"
                    required
                      defaultValue={editingLead?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                  />
                </div>
                
                    <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                      <input
                        type="tel"
                      id="phone"
                        name="phone"
                        defaultValue={editingLead?.phone || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                    <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                      <input
                        type="text"
                      id="company"
                      name="company"
                      required
                      defaultValue={editingLead?.company || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  
                    <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                      <input
                        type="text"
                      id="title"
                      name="title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter job title"
                      />
                  </div>
                  
                    <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                <select
                      id="status"
                      name="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
            </div>

              <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                      Source
                    </label>
                <input
                      type="text"
                      id="source"
                      name="source"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="How did you find this lead?"
                />
              </div>
            </div>
                  
              <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes about this lead..."
                  ></textarea>
              </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                  type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                  type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Lead
              </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Management Modal */}
      {selectedResult && (
        <LeadDetailManagement 
          lead={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}

export default App;
