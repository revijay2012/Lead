import { useState, useEffect } from 'react';
import { User, Phone, Mail, Building, Calendar, Eye, Edit } from 'lucide-react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Lead } from '../types/firestore';

interface LeadsListProps {
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

export function LeadsList({ onViewLead, onEditLead }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leadsRef = collection(db, 'leads');
      const q = query(leadsRef, orderBy('created_at', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const leadsData = snapshot.docs.map(doc => ({
        lead_id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      setLeads(leadsData);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
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
      case 'lost':
      case 'expired':
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'contacted':
      case 'qualified':
      case 'proposal':
      case 'negotiation':
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading leads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadLeads}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first lead.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          All Leads ({leads.length})
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          View and manage all your leads
        </p>
      </div>
      <ul className="divide-y divide-gray-200">
        {leads.map((lead) => (
          <li key={lead.lead_id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                      </p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                  {lead.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {lead.phone}
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {lead.company}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(lead.created_at)}
                  </div>
                  {lead.contract_value && (
                    <div className="text-green-600 font-medium">
                      {formatCurrency(lead.contract_value)}
                    </div>
                  )}
                </div>
                
                {/* Document ID */}
                <div className="mt-2 flex items-center text-xs text-gray-400">
                  <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                    ID: {lead.lead_id}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onViewLead(lead)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </button>
                <button
                  onClick={() => onEditLead(lead)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

