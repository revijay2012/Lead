import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  Tag, 
  Activity, 
  FileText, 
  FileCheck, 
  History, 
  Plus,
  Edit,
  Eye,
  Clock,
  DollarSign,
  User
} from 'lucide-react';
import { Lead, Activity as ActivityType, Proposal, Contract, StatusHistory, AuditLog } from '../types/firestore';
import { LeadManagementService } from '../services/leadManagement';
import { ActivityForm } from './ActivityForm';
import { Timestamp } from 'firebase/firestore';

interface LeadDetailManagementProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadDetailManagement({ lead, onClose }: LeadDetailManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'proposals' | 'contracts' | 'history' | 'audit'>('overview');
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);

  useEffect(() => {
    loadSubcollections();
  }, [lead.lead_id]);

  const loadSubcollections = useCallback(async () => {
    try {
      setLoading(true);
      console.log('LeadDetailManagement: Loading subcollections for lead:', lead.lead_id);
      console.log('LeadDetailManagement: Full lead object:', lead);
      const data = await LeadManagementService.getLeadWithSubcollections(lead.lead_id);
      console.log('LeadDetailManagement: Loaded subcollections data:', data);
      
      setActivities(data.activities as any);
      setProposals(data.proposals as any);
      setContracts(data.contracts as any);
      setStatusHistory(data.statusHistory as any);
      setAuditLogs(data.auditLog as any);
      
      console.log('LeadDetailManagement: Set activities:', data.activities.length);
      console.log('LeadDetailManagement: Set proposals:', data.proposals.length);
      console.log('LeadDetailManagement: Set contracts:', data.contracts.length);
    } catch (error) {
      console.error('LeadDetailManagement: Error loading subcollections:', error);
    } finally {
      setLoading(false);
    }
  }, [lead.lead_id]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'activities', label: `Activities (${activities.length})`, icon: Activity },
    { id: 'proposals', label: `Proposals (${proposals.length})`, icon: FileText },
    { id: 'contracts', label: `Contracts (${contracts.length})`, icon: FileCheck },
    { id: 'history', label: `Status History (${statusHistory.length})`, icon: History },
    { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden mt-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{lead.full_name}</h3>
              <p className="text-gray-600">{lead.company} • {lead.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info (LeadDetailManagement):</h4>
            <div className="text-xs text-yellow-700">
              <p>Lead ID: {lead.lead_id || 'NO LEAD_ID'}</p>
              <p>Lead Name: {lead.first_name} {lead.last_name}</p>
              <p>Activities Count: {activities.length}</p>
              <p>Proposals Count: {proposals.length}</p>
              <p>Contracts Count: {contracts.length}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(95vh-200px)]">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">{lead.full_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">{lead.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">{lead.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">{lead.company}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">
                            {lead.address?.street}, {lead.address?.city}, {lead.address?.state}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Status</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Stage</span>
                          <span className="ml-2 text-gray-900 capitalize">{lead.stage}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Source</span>
                          <span className="ml-2 text-gray-900">{lead.source}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Contract Value</span>
                          <span className="ml-2 text-gray-900">${lead.contract_value?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Created</span>
                          <span className="ml-2 text-gray-900">{formatDate(lead.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities Tab */}
                {activeTab === 'activities' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Activities</h4>
                      <button 
                        onClick={() => setShowActivityForm(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Activity
                      </button>
                    </div>
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.activity_id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{activity.subject}</h5>
                              <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>
                              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {activity.type}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(activity.timestamp)}
                                </span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {activity.created_by}
                                </span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                              activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status || 'completed'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">No activities recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Proposals Tab */}
                {activeTab === 'proposals' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Proposals</h4>
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Proposal
                      </button>
                    </div>
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div key={proposal.proposal_id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{proposal.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  ${proposal.amount?.toLocaleString() || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(proposal.sent_at)}
                                </span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {proposal.created_by}
                                </span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                              {proposal.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {proposals.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">No proposals sent</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contracts Tab */}
                {activeTab === 'contracts' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Contracts</h4>
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contract
                      </button>
                    </div>
                    <div className="space-y-4">
                      {contracts.map((contract) => (
                        <div key={contract.contract_id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{contract.title || 'Contract'}</h5>
                              <p className="text-sm text-gray-600 mt-1">{contract.notes}</p>
                              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  ${contract.amount?.toLocaleString() || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                                </span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {contract.created_by}
                                </span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                              {contract.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {contracts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">No contracts signed</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status History Tab */}
                {activeTab === 'history' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Status History</h4>
                    <div className="space-y-4">
                      {statusHistory.map((history) => (
                        <div key={history.event_id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.from_status)}`}>
                                {history.from_status}
                              </span>
                              <span className="mx-2 text-gray-400">→</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.to_status)}`}>
                                {history.to_status}
                              </span>
                              <p className="text-sm text-gray-600 mt-1">{history.transition_reason}</p>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div>{formatDate(history.timestamp)}</div>
                              <div>{history.changed_by}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {statusHistory.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <History className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">No status changes recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit Log Tab */}
                {activeTab === 'audit' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Audit Log</h4>
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div key={log.log_id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.change_type === 'create' ? 'bg-green-100 text-green-800' :
                                log.change_type === 'update' ? 'bg-blue-100 text-blue-800' :
                                log.change_type === 'delete' ? 'bg-red-100 text-red-800' :
                                log.change_type === 'status_change' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.change_type}
                              </span>
                              <p className="text-sm text-gray-600 mt-1">{log.reason}</p>
                              {log.fields_changed.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Fields changed:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {log.fields_changed.map((field, index) => (
                                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {field.field}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div>{formatDate(log.timestamp)}</div>
                              <div>{log.changed_by}</div>
                              {log.automated && <div className="text-orange-600">Automated</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2">No audit logs found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Form Modal */}
        {showActivityForm && (
          <ActivityForm
            leadId={lead.lead_id}
            leadName={lead.full_name}
            leadEmail={lead.email}
            onClose={() => setShowActivityForm(false)}
            onSuccess={() => {
              loadSubcollections(); // Reload data after adding activity
              setActiveTab('activities'); // Switch to activities tab
            }}
          />
        )}
      </div>
    </div>
  );
}
