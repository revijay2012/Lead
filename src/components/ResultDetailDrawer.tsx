import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, FileText, Activity as ActivityIcon, Clock, Tag, ExternalLink } from 'lucide-react';
import { SearchResult } from '../types/firestore';
import { 
  getLeadById, 
  getActivityById, 
  getProposalById, 
  getContractById,
  getActivitiesByLeadId,
  getProposalsByLeadId,
  getContractsByLeadId
} from '../services/firestoreSearch';
import { Lead, Activity, Proposal, Contract } from '../types/firestore';

interface ResultDetailDrawerProps {
  result: SearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ResultDetailDrawer({ result, isOpen, onClose, className = "" }: ResultDetailDrawerProps) {
  const [fullData, setFullData] = useState<Lead | Activity | Proposal | Contract | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load full data when result changes
  useEffect(() => {
    if (!result || !isOpen) {
      setFullData(null);
      setActivities([]);
      setProposals([]);
      setContracts([]);
      return;
    }

    const loadFullData = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: Lead | Activity | Proposal | Contract | null = null;

        switch (result.type) {
          case 'lead':
            data = await getLeadById(result.id);
            // Load subcollections for lead
            if (data) {
              const [activitiesData, proposalsData, contractsData] = await Promise.all([
                getActivitiesByLeadId(result.id),
                getProposalsByLeadId(result.id),
                getContractsByLeadId(result.id)
              ]);
              setActivities(activitiesData);
              setProposals(proposalsData);
              setContracts(contractsData);
            }
            break;
          case 'activity':
            if (result.lead_id) {
              data = await getActivityById(result.lead_id, result.id);
            }
            break;
          case 'proposal':
            if (result.lead_id) {
              data = await getProposalById(result.lead_id, result.id);
            }
            break;
          case 'contract':
            if (result.lead_id) {
              data = await getContractById(result.lead_id, result.id);
            }
            break;
        }

        setFullData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    loadFullData();
  }, [result, isOpen]);

  if (!isOpen || !result) return null;

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
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
      case 'churned':
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLeadDetails = (lead: Lead) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {lead.first_name} {lead.last_name}
          </h2>
          <p className="text-gray-600">{lead.email}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <Phone className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-900">{lead.phone || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-900">{lead.email}</span>
        </div>
        {lead.company && (
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-gray-900">{lead.company}</span>
          </div>
        )}
        {lead.title && (
          <div className="flex items-center">
            <Tag className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-gray-900">{lead.title}</span>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        {lead.source && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Source</h4>
            <p className="text-gray-900">{lead.source}</p>
          </div>
        )}
        
        {lead.notes && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        {lead.tags && lead.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700">Created</h4>
            <p className="text-gray-900">{formatTimestamp(lead.created_at)}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Last Updated</h4>
            <p className="text-gray-900">{formatTimestamp(lead.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Subcollections */}
      <div className="space-y-6">
        {/* Activities */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <ActivityIcon className="h-5 w-5 mr-2" />
            Activities ({activities.length})
          </h3>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.activity_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{activity.subject}</h4>
                      <p className="text-sm text-gray-600">{activity.notes}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.type)}`}>
                        {activity.type}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No activities found</p>
          )}
        </div>

        {/* Proposals */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Proposals ({proposals.length})
          </h3>
          {proposals.length > 0 ? (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div key={proposal.proposal_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                      <p className="text-sm text-gray-600">{proposal.description}</p>
                      {proposal.value && (
                        <p className="text-sm text-green-600 font-medium">${proposal.value.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(proposal.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No proposals found</p>
          )}
        </div>

        {/* Contracts */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Contracts ({contracts.length})
          </h3>
          {contracts.length > 0 ? (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.contract_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{contract.title}</h4>
                      <p className="text-sm text-gray-600">{contract.type}</p>
                      {contract.value && (
                        <p className="text-sm text-green-600 font-medium">${contract.value.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(contract.start_date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No contracts found</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivityDetails = (activity: Activity) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{activity.subject}</h2>
          <p className="text-gray-600">Activity • {activity.lead_name}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.type)}`}>
          {activity.type}
        </span>
      </div>

      {/* Content */}
      {activity.notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
          <p className="text-gray-900 whitespace-pre-wrap">{activity.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-gray-700">Date</h4>
          <p className="text-gray-900">{formatTimestamp(activity.timestamp)}</p>
        </div>
        {activity.duration && (
          <div>
            <h4 className="font-medium text-gray-700">Duration</h4>
            <p className="text-gray-900">{activity.duration} minutes</p>
          </div>
        )}
        {activity.outcome && (
          <div>
            <h4 className="font-medium text-gray-700">Outcome</h4>
            <p className="text-gray-900">{activity.outcome}</p>
          </div>
        )}
        {activity.next_follow_up && (
          <div>
            <h4 className="font-medium text-gray-700">Next Follow-up</h4>
            <p className="text-gray-900">{formatTimestamp(activity.next_follow_up)}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProposalDetails = (proposal: Proposal) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{proposal.title}</h2>
          <p className="text-gray-600">Proposal • {proposal.lead_name}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
          {proposal.status}
        </span>
      </div>

      {/* Content */}
      {proposal.notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
          <p className="text-gray-900 whitespace-pre-wrap">{proposal.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-gray-700">Sent Date</h4>
          <p className="text-gray-900">{formatTimestamp(proposal.sent_at)}</p>
        </div>
        {proposal.amount && (
          <div>
            <h4 className="font-medium text-gray-700">Amount</h4>
            <p className="text-gray-900">
              {proposal.currency || '$'}{proposal.amount.toLocaleString()}
            </p>
          </div>
        )}
        {proposal.valid_until && (
          <div>
            <h4 className="font-medium text-gray-700">Valid Until</h4>
            <p className="text-gray-900">{formatTimestamp(proposal.valid_until)}</p>
          </div>
        )}
        {proposal.terms && (
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-700">Terms</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{proposal.terms}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContractDetails = (contract: Contract) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Contract</h2>
          <p className="text-gray-600">Contract • {contract.lead_name}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
          {contract.status}
        </span>
      </div>

      {/* Content */}
      {contract.notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
          <p className="text-gray-900 whitespace-pre-wrap">{contract.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-gray-700">Start Date</h4>
          <p className="text-gray-900">{formatTimestamp(contract.start_date)}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">End Date</h4>
          <p className="text-gray-900">{formatTimestamp(contract.end_date)}</p>
        </div>
        {contract.renewal_date && (
          <div>
            <h4 className="font-medium text-gray-700">Renewal Date</h4>
            <p className="text-gray-900">{formatTimestamp(contract.renewal_date)}</p>
          </div>
        )}
        {contract.amount && (
          <div>
            <h4 className="font-medium text-gray-700">Amount</h4>
            <p className="text-gray-900">
              {contract.currency || '$'}{contract.amount.toLocaleString()}
            </p>
          </div>
        )}
        {contract.auto_renew !== undefined && (
          <div>
            <h4 className="font-medium text-gray-700">Auto Renew</h4>
            <p className="text-gray-900">{contract.auto_renew ? 'Yes' : 'No'}</p>
          </div>
        )}
        {contract.terms && (
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-700">Terms</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{contract.terms}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading details...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">⚠️</div>
                <p className="text-red-600 mb-2">Failed to load details</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {fullData && !loading && !error && (
            <>
              {result.type === 'lead' && renderLeadDetails(fullData as Lead)}
              {result.type === 'activity' && renderActivityDetails(fullData as Activity)}
              {result.type === 'proposal' && renderProposalDetails(fullData as Proposal)}
              {result.type === 'contract' && renderContractDetails(fullData as Contract)}
            </>
          )}

          {!fullData && !loading && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">📄</div>
                <p className="text-gray-600">No details available</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
            {result.lead_id && (
              <button
                onClick={() => {
                  // Navigate to lead detail page or open in new tab
                  window.open(`/leads/${result.lead_id}`, '_blank');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ExternalLink className="h-4 w-4 inline mr-2" />
                View Full Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
