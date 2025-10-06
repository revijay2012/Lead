import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3,
  Activity,
  FileText,
  FileCheck,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Tag,
  Save,
  X
} from 'lucide-react';
import { Lead, Activity as ActivityType, Proposal, Contract, StatusHistory } from '../types/firestore';
import { LeadManagementService } from '../services/leadManagement';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Generate prefixes for search
function generatePrefixes(str: string, maxLen = 15): string[] {
  const normalized = str.toLowerCase().trim();
  if (!normalized) return [];
  
  const tokens = [];
  for (let i = 1; i <= Math.min(normalized.length, maxLen); i++) {
    tokens.push(normalized.slice(0, i));
  }
  return tokens;
}

// Build search prefixes for a lead
function buildSearchPrefixes(leadData: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
}): string[] {
  const first = (leadData.first_name || '').toLowerCase();
  const last = (leadData.last_name || '').toLowerCase();
  const full = `${first} ${last}`.trim();
  const email = (leadData.email || '').toLowerCase();
  const phone = (leadData.phone || '').replace(/\D/g, '');
  const company = (leadData.company || '').toLowerCase();

  const prefixes = new Set([
    ...generatePrefixes(first),
    ...generatePrefixes(last),
    ...generatePrefixes(full),
    ...generatePrefixes(email),
    ...generatePrefixes(phone),
    ...generatePrefixes(company)
  ]);

  return Array.from(prefixes);
}

interface EnhancedLeadFormProps {
  lead: Lead | null;
  onSave: (lead: Lead) => void;
  onClose: () => void;
}

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  isOpen: boolean;
}

export const EnhancedLeadForm: React.FC<EnhancedLeadFormProps> = ({ lead, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'new' as const,
    stage: 'awareness' as const,
    source: '',
    notes: '',
    contract_value: 0,
    tags: [] as string[],
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    }
  });

  const [accordionSections, setAccordionSections] = useState<AccordionSection[]>([
    { id: 'basic', title: 'Basic Information', icon: User, isOpen: true },
    { id: 'activities', title: 'Activities', icon: Activity, isOpen: true },
    { id: 'proposals', title: 'Proposals', icon: FileText, isOpen: true },
    { id: 'contracts', title: 'Contracts', icon: FileCheck, isOpen: true }
  ]);

  // Subcollection data
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Form states for new items
  const [newActivity, setNewActivity] = useState({
    type: 'call' as const,
    subject: '',
    notes: '',
    status: 'completed' as const,
    priority: 'medium' as const,
    duration: '',
    outcome: ''
  });

  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    status: 'draft' as const,
    amount: '',
    currency: 'USD',
    valid_until: '',
    terms: ''
  });

  const [newContract, setNewContract] = useState({
    title: '',
    status: 'active' as const,
    amount: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
    terms: '',
    auto_renew: false
  });

  const [loading, setLoading] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (lead) {
      console.log('EnhancedLeadForm: Lead loaded, setting form data:', lead);
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        title: lead.title || '',
        status: lead.status || 'new',
        stage: lead.stage || 'awareness',
        source: lead.source || '',
        notes: lead.notes || '',
        contract_value: lead.contract_value || 0,
        tags: lead.tags || [],
        address: lead.address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'USA'
        }
      });

      // Load subcollections
      console.log('EnhancedLeadForm: About to load subcollections for lead:', lead.lead_id);
      loadSubcollections();
    }
  }, [lead]);

  const loadSubcollections = useCallback(async () => {
    if (!lead) return;
    
    try {
      console.log('Loading subcollections for lead:', lead.lead_id);
      const data = await LeadManagementService.getLeadWithSubcollections(lead.lead_id);
      console.log('Loaded subcollections data:', data);
      
      setActivities(data.activities as ActivityType[]);
      setProposals(data.proposals as Proposal[]);
      setContracts(data.contracts as Contract[]);
      
      console.log('Set activities:', data.activities.length);
      console.log('Set proposals:', data.proposals.length);
      console.log('Set contracts:', data.contracts.length);
    } catch (error) {
      console.error('Error loading subcollections:', error);
    }
  }, [lead]);

  const toggleAccordion = (sectionId: string) => {
    setAccordionSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullName = `${formData.first_name} ${formData.last_name}`;
      const phoneDigits = formData.phone.replace(/\D/g, '');
      
      // Generate search prefixes
      const searchPrefixes = buildSearchPrefixes({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company
      });
      
      const leadData = {
        ...formData,
        full_name: fullName,
        full_name_lower: fullName.toLowerCase(),
        email_lower: formData.email.toLowerCase(),
        phone_digits: phoneDigits,
        company_lower: formData.company.toLowerCase(),
        updated_at: Timestamp.now(),
        created_at: lead?.created_at || Timestamp.now(),
        search_prefixes: searchPrefixes,
      };

      if (lead) {
        // Update existing lead
        await LeadManagementService.updateLead(
          lead.lead_id,
          leadData,
          'Current User',
          'Lead updated via enhanced form'
        );
        setSavedLeadId(lead.lead_id);
        setShowSuccessMessage(true);
        onSave({ ...lead, ...leadData });
      } else {
        // Create new lead
        const leadsRef = collection(db, 'leads');
        const docRef = await addDoc(leadsRef, leadData);
        const newLead = { ...leadData, lead_id: docRef.id } as Lead;
        setSavedLeadId(docRef.id);
        setShowSuccessMessage(true);
        onSave(newLead);
      }

      // Don't close immediately - show success message first
      // onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async () => {
    if (!newActivity.subject.trim()) {
      alert('Please enter an activity subject.');
      return;
    }

    if (!lead) {
      alert('Cannot add activity: Lead must be saved first. Please save the lead before adding activities.');
      return;
    }

    try {
      console.log('Adding activity for lead:', lead.lead_id);
      const activityData = {
        type: newActivity.type,
        subject: newActivity.subject,
        subject_lower: newActivity.subject.toLowerCase(),
        notes: newActivity.notes,
        notes_lower: newActivity.notes.toLowerCase(),
        duration: newActivity.duration ? parseInt(newActivity.duration) : undefined,
        status: newActivity.status,
        priority: newActivity.priority,
        outcome: newActivity.outcome || ''
      };

      console.log('Activity data:', activityData);
      const activityId = await LeadManagementService.addActivity(
        lead.lead_id,
        activityData,
        lead.full_name,
        lead.email,
        'Current User'
      );

      console.log('Activity added successfully with ID:', activityId);

      setNewActivity({
        type: 'call',
        subject: '',
        notes: '',
        status: 'completed',
        priority: 'medium',
        duration: '',
        outcome: ''
      });

      await loadSubcollections();
      console.log('Subcollections reloaded');
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity. Please check the console for details.');
    }
  };

  const addProposal = async () => {
    if (!newProposal.title.trim()) {
      alert('Please enter a proposal title.');
      return;
    }

    if (!lead) {
      alert('Cannot add proposal: Lead must be saved first. Please save the lead before adding proposals.');
      return;
    }

    try {
      const proposalData = {
        title: newProposal.title,
        title_lower: newProposal.title.toLowerCase(),
        description: newProposal.description,
        description_lower: newProposal.description?.toLowerCase(),
        status: newProposal.status,
        amount: newProposal.amount ? parseFloat(newProposal.amount) : undefined,
        currency: newProposal.currency,
        valid_until: newProposal.valid_until ? Timestamp.fromDate(new Date(newProposal.valid_until)) : undefined,
        terms: newProposal.terms
      };

      console.log('Adding proposal for lead:', lead.lead_id);
      console.log('Proposal data:', proposalData);
      
      const proposalId = await LeadManagementService.addProposal(
        lead.lead_id,
        proposalData,
        lead.full_name,
        lead.email,
        'Current User'
      );

      console.log('Proposal added successfully with ID:', proposalId);

      setNewProposal({
        title: '',
        description: '',
        status: 'draft',
        amount: '',
        currency: 'USD',
        valid_until: '',
        terms: ''
      });

      await loadSubcollections();
      console.log('Subcollections reloaded');
    } catch (error) {
      console.error('Error adding proposal:', error);
      alert('Failed to add proposal. Please check the console for details.');
    }
  };

  const addContract = async () => {
    if (!newContract.title.trim()) {
      alert('Please enter a contract title.');
      return;
    }

    if (!lead) {
      alert('Cannot add contract: Lead must be saved first. Please save the lead before adding contracts.');
      return;
    }

    try {
      const contractData = {
        ...newContract,
        title_lower: newContract.title.toLowerCase(),
        amount: newContract.amount ? parseFloat(newContract.amount) : undefined,
        start_date: Timestamp.fromDate(new Date(newContract.start_date)),
        end_date: Timestamp.fromDate(new Date(newContract.end_date)),
        created_by: 'Current User',
        search_keywords: []
      };

      await LeadManagementService.addContract(
        lead.lead_id,
        contractData,
        lead.full_name,
        lead.email,
        'Current User'
      );

      setNewContract({
        title: '',
        status: 'active',
        amount: '',
        currency: 'USD',
        start_date: '',
        end_date: '',
        terms: '',
        auto_renew: false
      });

      loadSubcollections();
    } catch (error) {
      console.error('Error adding contract:', error);
    }
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-start justify-center p-4 pt-8">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {lead ? 'Edit Lead' : 'Add New Lead'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Debug Info */}
          {lead && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h4>
              <div className="text-xs text-yellow-700">
                <p>Lead ID: {lead.lead_id || 'NO LEAD_ID'}</p>
                <p>Lead Name: {lead.first_name} {lead.last_name}</p>
                <p>Activities Count: {activities.length}</p>
                <p>Proposals Count: {proposals.length}</p>
                <p>Contracts Count: {contracts.length}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && savedLeadId && (
            <div className="p-6 bg-green-50 border-b border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {lead ? 'Lead Updated Successfully!' : 'Lead Created Successfully!'}
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Document ID:</strong> <code className="bg-green-100 px-2 py-1 rounded text-xs font-mono">{savedLeadId}</code></p>
                    <p className="mt-1">You can use this ID to search for the lead in your database.</p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuccessMessage(false);
                        setSavedLeadId(null);
                        onClose();
                      }}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Accordion Sections */}
            {accordionSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="mb-6">
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleAccordion(section.id)}
                    className="flex items-center justify-between w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="font-medium text-gray-900">{section.title}</span>
                      {section.id === 'activities' && activities.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {activities.length}
                        </span>
                      )}
                      {section.id === 'proposals' && proposals.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {proposals.length}
                        </span>
                      )}
                      {section.id === 'contracts' && contracts.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          {contracts.length}
                        </span>
                      )}
                    </div>
                    {section.isOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                  </button>

                  {/* Accordion Content */}
                  {section.isOpen && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                      {section.id === 'basic' && (
                        <div className="space-y-6">
                          {/* Basic Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                              </label>
                              <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company *
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Job Title
                              </label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                              </label>
                              <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Source
                              </label>
                              <input
                                type="text"
                                value={formData.source}
                                onChange={(e) => handleInputChange('source', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              rows={4}
                              value={formData.notes}
                              onChange={(e) => handleInputChange('notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Add any additional notes about this lead..."
                            />
                          </div>
                        </div>
                      )}

                      {section.id === 'activities' && (
                        <div className="space-y-4">
                          {/* Add New Activity */}
                          <div className={`p-4 rounded-lg ${lead ? 'bg-blue-50' : 'bg-gray-50 opacity-60'}`}>
                            <h4 className={`font-medium mb-3 ${lead ? 'text-blue-900' : 'text-gray-500'}`}>
                              Add New Activity
                              {!lead && <span className="ml-2 text-xs text-gray-400">(Save lead first)</span>}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  value={newActivity.type}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as any }))}
                                  disabled={!lead}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${!lead ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                  <option value="call">Call</option>
                                  <option value="email">Email</option>
                                  <option value="meeting">Meeting</option>
                                  <option value="note">Note</option>
                                  <option value="task">Task</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                <input
                                  type="text"
                                  value={newActivity.subject}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, subject: e.target.value }))}
                                  disabled={!lead}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${!lead ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  placeholder="Activity subject"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={newActivity.status}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, status: e.target.value as any }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="completed">Completed</option>
                                  <option value="pending">Pending</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input
                                  type="number"
                                  value={newActivity.duration}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, duration: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="e.g., 30"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                rows={3}
                                value={newActivity.notes}
                                onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Activity notes..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addActivity}
                              disabled={!lead}
                              className={`mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                                lead 
                                  ? 'text-white bg-blue-600 hover:bg-blue-700' 
                                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Activity
                            </button>
                          </div>

                          {/* Existing Activities */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">Existing Activities ({activities.length})</h4>
                              <button
                                type="button"
                                onClick={loadSubcollections}
                                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                              >
                                Reload
                              </button>
                            </div>
                            {console.log('EnhancedLeadForm: Rendering activities, count:', activities.length, 'data:', activities)}
                            {activities.length === 0 ? (
                              <p className="text-gray-500 text-sm">No activities yet. Add one above!</p>
                            ) : (
                              <div className="space-y-3">
                                {activities.map((activity, index) => (
                                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <Activity className="h-4 w-4 mr-2 text-blue-600" />
                                        <span className="font-medium text-sm">{activity.subject}</span>
                                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                          {activity.type}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{activity.notes}</p>
                                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                                        <span>{formatDate(activity.timestamp)}</span>
                                        {activity.duration && <span>{activity.duration} min</span>}
                                        <span className={`px-2 py-1 rounded-full ${
                                          (activity.status || 'completed') === 'completed' ? 'bg-green-100 text-green-800' :
                                          (activity.status || 'completed') === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {activity.status || 'completed'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {section.id === 'proposals' && (
                        <div className="space-y-4">
                          {/* Add New Proposal */}
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-3">Add New Proposal</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                  type="text"
                                  value={newProposal.title}
                                  onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Proposal title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={newProposal.status}
                                  onChange={(e) => setNewProposal(prev => ({ ...prev, status: e.target.value as any }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="draft">Draft</option>
                                  <option value="sent">Sent</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="rejected">Rejected</option>
                                  <option value="expired">Expired</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                  type="number"
                                  value={newProposal.amount}
                                  onChange={(e) => setNewProposal(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                <select
                                  value={newProposal.currency}
                                  onChange={(e) => setNewProposal(prev => ({ ...prev, currency: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                <input
                                  type="date"
                                  value={newProposal.valid_until}
                                  onChange={(e) => setNewProposal(prev => ({ ...prev, valid_until: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                rows={3}
                                value={newProposal.description}
                                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Proposal description..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addProposal}
                              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Proposal
                            </button>
                          </div>

                          {/* Existing Proposals */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">Existing Proposals ({proposals.length})</h4>
                              <button
                                type="button"
                                onClick={loadSubcollections}
                                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                              >
                                Reload
                              </button>
                            </div>
                            {console.log('EnhancedLeadForm: Rendering proposals, count:', proposals.length, 'data:', proposals)}
                            {proposals.length === 0 ? (
                              <p className="text-gray-500 text-sm">No proposals yet. Add one above!</p>
                            ) : (
                              <div className="space-y-3">
                                {proposals.map((proposal, index) => (
                                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <FileText className="h-4 w-4 mr-2 text-green-600" />
                                        <span className="font-medium text-sm">{proposal.title}</span>
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                          proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                          proposal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                          proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {proposal.status}
                                        </span>
                                      </div>
                                      {proposal.description && (
                                        <p className="text-sm text-gray-600 mb-2">{proposal.description}</p>
                                      )}
                                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                                        <span>{formatDate(proposal.sent_at || proposal.created_at)}</span>
                                        {(proposal.amount || proposal.value) && (
                                          <span className="font-medium">
                                            {formatCurrency(proposal.amount || proposal.value, proposal.currency || 'USD')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {section.id === 'contracts' && (
                        <div className="space-y-4">
                          {/* Add New Contract */}
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-medium text-purple-900 mb-3">Add New Contract</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                  type="text"
                                  value={newContract.title}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, title: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Contract title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={newContract.status}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, status: e.target.value as any }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="active">Active</option>
                                  <option value="expired">Expired</option>
                                  <option value="pending">Pending</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                  type="number"
                                  value={newContract.amount}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                <select
                                  value={newContract.currency}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, currency: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={newContract.start_date}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, start_date: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={newContract.end_date}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, end_date: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
                              <textarea
                                rows={3}
                                value={newContract.terms}
                                onChange={(e) => setNewContract(prev => ({ ...prev, terms: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Contract terms..."
                              />
                            </div>
                            <div className="mt-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newContract.auto_renew}
                                  onChange={(e) => setNewContract(prev => ({ ...prev, auto_renew: e.target.checked }))}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Auto-renewal</span>
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={addContract}
                              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Contract
                            </button>
                          </div>

                          {/* Existing Contracts */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Existing Contracts ({contracts.length})</h4>
                            {contracts.length === 0 ? (
                              <p className="text-gray-500 text-sm">No contracts yet. Add one above!</p>
                            ) : (
                              <div className="space-y-3">
                                {contracts.map((contract, index) => (
                                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <FileCheck className="h-4 w-4 mr-2 text-purple-600" />
                                        <span className="font-medium text-sm">{contract.title || 'Untitled Contract'}</span>
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                          contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                          contract.status === 'expired' ? 'bg-red-100 text-red-800' :
                                          contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {contract.status}
                                        </span>
                                      </div>
                                      {contract.terms && (
                                        <p className="text-sm text-gray-600 mb-2">{contract.terms}</p>
                                      )}
                                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                                        <span>Start: {formatDate(contract.start_date)}</span>
                                        <span>End: {formatDate(contract.end_date)}</span>
                                        {(contract.amount || contract.value) && (
                                          <span className="font-medium">
                                            {formatCurrency(contract.amount || contract.value, contract.currency || 'USD')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Lead
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
