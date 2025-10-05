import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, Building, Calendar, Tag, DollarSign, 
  Plus, Edit, Trash2, Activity as ActivityIcon, FileText, 
  FileContract, History, Eye, EyeOff, ChevronDown, ChevronRight, X
} from 'lucide-react';
import { Lead, Activity, Proposal, Contract, SearchResult } from '../types/firestore';
import { LeadForm } from './LeadForm';
import { ActivityForm } from './ActivityForm';
import { ProposalForm } from './ProposalForm';
import { ContractForm } from './ContractForm';
import { 
  getLeadById, 
  getActivitiesByLeadId, 
  getProposalsByLeadId, 
  getContractsByLeadId,
  deleteLead,
  deleteActivity,
  deleteProposal,
  deleteContract
} from '../services/firestoreSearch';

interface LeadDetailViewProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdate: (lead: Lead) => void;
  onLeadDelete: (leadId: string) => void;
}

export function LeadDetailView({ leadId, isOpen, onClose, onLeadUpdate, onLeadDelete }: LeadDetailViewProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // UI states
  const [expandedSections, setExpandedSections] = useState({
    activities: true,
    proposals: true,
    contracts: true
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load lead data
  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadData();
    }
  }, [isOpen, leadId]);

  const loadLeadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadData, activitiesData, proposalsData, contractsData] = await Promise.all([
        getLeadById(leadId),
        getActivitiesByLeadId(leadId),
        getProposalsByLeadId(leadId),
        getContractsByLeadId(leadId)
      ]);

      setLead(leadData);
      setActivities(activitiesData);
      setProposals(proposalsData);
      setContracts(contractsData);
    } catch (err) {
      console.error('Error loading lead data:', err);
      setError('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSave = (updatedLead: Lead) => {
    setLead(updatedLead);
    onLeadUpdate(updatedLead);
    setShowLeadForm(false);
    setEditingLead(null);
  };

  const handleActivitySave = (activity: Activity) => {
    if (editingActivity) {
      setActivities(prev => prev.map(a => a.activity_id === activity.activity_id ? activity : a));
    } else {
      setActivities(prev => [activity, ...prev]);
    }
    setShowActivityForm(false);
    setEditingActivity(null);
  };

  const handleProposalSave = (proposal: Proposal) => {
    if (editingProposal) {
      setProposals(prev => prev.map(p => p.proposal_id === proposal.proposal_id ? proposal : p));
    } else {
      setProposals(prev => [proposal, ...prev]);
    }
    setShowProposalForm(false);
    setEditingProposal(null);
  };

  const handleContractSave = (contract: Contract) => {
    if (editingContract) {
      setContracts(prev => prev.map(c => c.contract_id === contract.contract_id ? contract : c));
    } else {
      setContracts(prev => [contract, ...prev]);
    }
    setShowContractForm(false);
    setEditingContract(null);
  };

  const handleDelete = async (type: 'lead' | 'activity' | 'proposal' | 'contract', id: string) => {
    try {
      switch (type) {
        case 'lead':
          await deleteLead(id);
          onLeadDelete(id);
          onClose();
          break;
        case 'activity':
          await deleteActivity(leadId, id);
          setActivities(prev => prev.filter(a => a.activity_id !== id));
          break;
        case 'proposal':
          await deleteProposal(leadId, id);
          setProposals(prev => prev.filter(p => p.proposal_id !== id));
          break;
        case 'contract':
          await deleteContract(leadId, id);
          setContracts(prev => prev.filter(c => c.contract_id !== id));
          break;
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading lead details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error || 'Lead not found'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Main Content */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </h2>
                  <p className="text-sm text-gray-600">{lead.company || 'No company'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingLead(lead);
                    setShowLeadForm(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm('lead')}
                  className="p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Information */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{lead.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{lead.phone}</span>
                      </div>
                      {lead.company && (
                        <div className="flex items-center space-x-3">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{lead.company}</span>
                        </div>
                      )}
                      {lead.title && (
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{lead.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.status === 'customer' ? 'bg-green-100 text-green-800' :
                          lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Source:</span>
                        <span className="text-sm text-gray-700">{lead.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm text-gray-700">{formatDate(lead.created_at)}</span>
                      </div>
                      {lead.estimated_value && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Value:</span>
                          <span className="text-sm text-gray-700">
                            {formatCurrency(lead.estimated_value, lead.currency || 'USD')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {lead.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                      <p className="text-sm text-gray-700">{lead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Activities, Proposals, and Contracts */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Activities */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                      onClick={() => toggleSection('activities')}
                    >
                      <div className="flex items-center space-x-2">
                        <ActivityIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-900">Activities</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {activities.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActivity(null);
                            setShowActivityForm(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {expandedSections.activities ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {expandedSections.activities && (
                      <div className="p-4 space-y-3">
                        {activities.length === 0 ? (
                          <p className="text-gray-500 text-sm">No activities yet</p>
                        ) : (
                          activities.map(activity => (
                            <div key={activity.activity_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">{activity.subject}</span>
                                  <span className="text-xs text-gray-500">({activity.type})</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{formatDate(activity.timestamp)}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingActivity(activity)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(`activity-${activity.activity_id}`)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Proposals */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                      onClick={() => toggleSection('proposals')}
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-900">Proposals</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {proposals.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProposal(null);
                            setShowProposalForm(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {expandedSections.proposals ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {expandedSections.proposals && (
                      <div className="p-4 space-y-3">
                        {proposals.length === 0 ? (
                          <p className="text-gray-500 text-sm">No proposals yet</p>
                        ) : (
                          proposals.map(proposal => (
                            <div key={proposal.proposal_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">{proposal.title}</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {proposal.status}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-gray-600">
                                    {formatCurrency(proposal.amount, proposal.currency)}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatDate(proposal.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingProposal(proposal)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(`proposal-${proposal.proposal_id}`)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contracts */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                      onClick={() => toggleSection('contracts')}
                    >
                      <div className="flex items-center space-x-2">
                        <FileContract className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-900">Contracts</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {contracts.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingContract(null);
                            setShowContractForm(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {expandedSections.contracts ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {expandedSections.contracts && (
                      <div className="p-4 space-y-3">
                        {contracts.length === 0 ? (
                          <p className="text-gray-500 text-sm">No contracts yet</p>
                        ) : (
                          contracts.map(contract => (
                            <div key={contract.contract_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">{contract.title}</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                    contract.status === 'expired' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {contract.status}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-gray-600">
                                    {formatCurrency(contract.amount, contract.currency)}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatDate(contract.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingContract(contract)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(`contract-${contract.contract_id}`)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      {showLeadForm && (
        <LeadForm
          lead={editingLead}
          isOpen={showLeadForm}
          onClose={() => {
            setShowLeadForm(false);
            setEditingLead(null);
          }}
          onSave={handleLeadSave}
        />
      )}

      {showActivityForm && (
        <ActivityForm
          activity={editingActivity}
          leadId={leadId}
          leadName={`${lead.first_name} ${lead.last_name}`}
          isOpen={showActivityForm}
          onClose={() => {
            setShowActivityForm(false);
            setEditingActivity(null);
          }}
          onSave={handleActivitySave}
        />
      )}

      {showProposalForm && (
        <ProposalForm
          proposal={editingProposal}
          leadId={leadId}
          leadName={`${lead.first_name} ${lead.last_name}`}
          isOpen={showProposalForm}
          onClose={() => {
            setShowProposalForm(false);
            setEditingProposal(null);
          }}
          onSave={handleProposalSave}
        />
      )}

      {showContractForm && (
        <ContractForm
          contract={editingContract}
          leadId={leadId}
          leadName={`${lead.first_name} ${lead.last_name}`}
          isOpen={showContractForm}
          onClose={() => {
            setShowContractForm(false);
            setEditingContract(null);
          }}
          onSave={handleContractSave}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this {showDeleteConfirm.split('-')[0]}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const [type, id] = showDeleteConfirm.split('-');
                    handleDelete(type as any, id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
