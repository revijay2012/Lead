import { useState, lazy, Suspense } from 'react';
import { Search, Plus, Users, Loader2 } from 'lucide-react';
import { SearchProvider } from './contexts/SearchContext';
import { useSearch } from './contexts/SearchContext';
import { createLead } from './services/firestoreSearch';
import { Lead, LeadFormData } from './types/firestore';
import { TestConnection } from './components/TestConnection';

// Lazy load components for better performance
const SearchBar = lazy(() => import('./components/SearchBar').then(module => ({ default: module.SearchBar })));
const SearchResults = lazy(() => import('./components/SearchResults').then(module => ({ default: module.SearchResults })));
const ResultDetailDrawer = lazy(() => import('./components/ResultDetailDrawer').then(module => ({ default: module.ResultDetailDrawer })));
const LeadForm = lazy(() => import('./components/LeadForm').then(module => ({ default: module.LeadForm })));
const LeadsList = lazy(() => import('./components/LeadsList').then(module => ({ default: module.LeadsList })));

function AppContent() {
  const { selectedResult, setSelected, term } = useSearch();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [currentView, setCurrentView] = useState<'leads' | 'search'>('leads');

  const handleCloseDetail = () => {
    setSelected(null);
  };

  const handleCloseLeadForm = () => {
    setShowLeadForm(false);
    setEditingLead(null);
  };

  const handleSaveLead = async (leadData: LeadFormData) => {
    try {
      if (editingLead) {
        // Update existing lead
        console.log('Updating lead:', leadData);
        // TODO: Implement updateLead function
      } else {
        // Create new lead
        const newLead = await createLead(leadData);
        console.log('Lead created successfully:', newLead);
      }
      setShowLeadForm(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead. Please try again.');
    }
  };

  const handleViewLead = (lead: Lead) => {
    // Convert Lead to SearchResult format for the ResultDetailDrawer
    const searchResult = {
      id: lead.lead_id,
      type: 'lead' as const,
      title: lead.full_name || `${lead.first_name} ${lead.last_name}`,
      subtitle: lead.email,
      status: lead.status,
      timestamp: lead.created_at,
      lead_id: lead.lead_id,
      lead_name: lead.full_name || `${lead.first_name} ${lead.last_name}`,
      data: lead
    };
    setSelected(searchResult);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowLeadForm(true);
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
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar - only show when in search view */}
              {currentView === 'search' && (
                <div className="flex-1 max-w-lg">
                  <Suspense fallback={<div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>}>
                    <SearchBar />
                  </Suspense>
                </div>
              )}
              
              {/* Add Lead Button */}
              <button
                onClick={() => setShowLeadForm(true)}
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
                <Suspense fallback={
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading leads...</span>
                  </div>
                }>
                  <LeadsList 
                    onViewLead={handleViewLead}
                    onEditLead={handleEditLead}
                  />
                </Suspense>
              ) : (
            /* Search View */
            <>
              <Suspense fallback={
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading search...</span>
                </div>
              }>
                <SearchResults />
              </Suspense>
              
              {/* Empty State for Search */}
              {!term && (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Search leads, activities, proposals, and contracts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Use the search bar above to find specific records across all your data.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Result Detail Drawer */}
      <Suspense fallback={<div></div>}>
        <ResultDetailDrawer
          result={selectedResult}
          isOpen={!!selectedResult}
          onClose={handleCloseDetail}
        />
      </Suspense>

      {/* Lead Form */}
      <Suspense fallback={<div></div>}>
        <LeadForm
          lead={editingLead}
          isOpen={showLeadForm}
          onClose={handleCloseLeadForm}
          onSave={handleSaveLead}
        />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <SearchProvider>
      <AppContent />
    </SearchProvider>
  );
}

export default App;