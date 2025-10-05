import { useState, useEffect } from 'react';
import { Search, Plus, Users, Loader2 } from 'lucide-react';
import { TestConnection } from './components/TestConnection';
import { LeadsList } from './components/LeadsList';
import { Lead } from './types/firestore';

function App() {
  const [currentView, setCurrentView] = useState<'leads' | 'search'>('leads');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const handleViewLead = (lead: Lead) => {
    console.log('View lead:', lead);
    setSelectedResult(lead);
  };

  const handleEditLead = (lead: Lead) => {
    console.log('Edit lead:', lead);
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">All Leads</h2>
              <LeadsList 
                onViewLead={handleViewLead}
                onEditLead={handleEditLead}
              />
            </div>
          ) : (
            /* Search View */
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Leads</h2>
              <p className="text-gray-600">Search functionality coming soon...</p>
            </div>
          )}
        </div>
      </main>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Lead</h3>
              <p className="text-gray-600 mb-4">Lead form will be implemented here.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Lead saved! (Demo)');
                    setShowLeadForm(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Lead Details</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedResult.full_name}</p>
                <p><strong>Email:</strong> {selectedResult.email}</p>
                <p><strong>Company:</strong> {selectedResult.company}</p>
                <p><strong>Status:</strong> {selectedResult.status}</p>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
