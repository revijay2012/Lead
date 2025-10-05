import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Building, Tag, Calendar } from 'lucide-react';
import { Lead, LeadFormData, LeadStatus, AccountStatus } from '../types/firestore';
import { addDoc, collection, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface LeadFormProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

const LEAD_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
];

const ACCOUNT_STATUSES: AccountStatus[] = [
  'active', 'churned', 'suspended'
];

const COMMON_SOURCES = [
  'website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'linkedin', 'google_ads'
];

const COMMON_TAGS = [
  'enterprise', 'premium', 'active', 'startup', 'growth', 'innovative', 'established', 'renewal', 
  'fast-growing', 'global', 'strategic', 'mid-market', 'expansion', 'digital', 'security', 'compliance'
];

// 🔧 Prefix Generator for search optimization
function generatePrefixes(str: string, maxLen = 15): string[] {
  if (!str) return [];
  const normalized = str.toLowerCase().replace(/[^a-z0-9@.]/g, '');
  const tokens: string[] = [];
  for (let i = 1; i <= Math.min(normalized.length, maxLen); i++) {
    tokens.push(normalized.slice(0, i));
  }
  return tokens;
}

// Build search prefixes for a lead
function buildSearchPrefixes(leadData: LeadFormData): string[] {
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

export function LeadForm({ lead, isOpen, onClose, onSave }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'new',
    stage: 'awareness',
    account_status: 'active',
    source: '',
    tags: [],
    company: '',
    title: '',
    notes: '',
    assigned_to: '',
    expected_close_date: undefined,
    estimated_value: undefined,
    currency: 'USD'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customSource, setCustomSource] = useState('');
  const [customTag, setCustomTag] = useState('');

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || 'new',
        stage: lead.stage || 'awareness',
        account_status: lead.account_status || 'active',
        source: lead.source || '',
        tags: lead.tags || [],
        company: lead.company || '',
        title: lead.title || '',
        notes: lead.notes || '',
        assigned_to: lead.assigned_to || '',
        expected_close_date: lead.expected_close_date,
        estimated_value: lead.estimated_value,
        currency: lead.currency || 'USD'
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'new',
        stage: 'awareness',
        account_status: 'active',
        source: '',
        tags: [],
        company: '',
        title: '',
        notes: '',
        assigned_to: '',
        expected_close_date: undefined,
        estimated_value: undefined,
        currency: 'USD'
      });
    }
  }, [lead]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.source.trim()) {
      newErrors.source = 'Source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateLeadId = (): string => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `L-${dateStr}-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const leadId = lead?.lead_id || generateLeadId();
      const now = Timestamp.now();

      // Build search prefixes for the lead data
      const searchPrefixes = buildSearchPrefixes(formData);

      const leadData: Lead = {
        lead_id: leadId,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        full_name_lower: `${formData.first_name.trim()} ${formData.last_name.trim()}`.toLowerCase(),
        email: formData.email.trim(),
        email_lower: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        phone_digits: formData.phone.replace(/[^\d]/g, ''),
        company: formData.company?.trim() || '',
        company_lower: (formData.company?.trim() || '').toLowerCase(),
        title: formData.title?.trim() || '',
        status: formData.status,
        stage: formData.stage,
        contract_value: formData.estimated_value || 0,
        account_status: formData.account_status,
        source: formData.source.trim(),
        created_at: lead?.created_at || now,
        updated_at: now,
        search_prefixes: searchPrefixes,
        tags: formData.tags,
        notes: formData.notes?.trim() || '',
        assigned_to: formData.assigned_to?.trim() || '',
        expected_close_date: formData.expected_close_date,
        estimated_value: formData.estimated_value,
        currency: formData.currency,
        address: {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'USA'
        }
      };

      if (lead) {
        // Update existing lead
        await updateDoc(doc(db, 'leads', leadId), leadData);
      } else {
        // Create new lead
        await addDoc(collection(db, 'leads'), leadData);
      }

      onSave(leadData);
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      setErrors({ submit: 'Failed to save lead. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LeadFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleCustomSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSource.trim()) {
      handleInputChange('source', customSource.trim());
      setCustomSource('');
    }
  };

  const handleCustomTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTag.trim()) {
      handleAddTag(customTag.trim());
      setCustomTag('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-white">
      {/* Full Page Container */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.first_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.last_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+1-555-0123"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CEO"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.source ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a source</option>
                      {COMMON_SOURCES.map(source => (
                        <option key={source} value={source}>
                          {source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    
                    <form onSubmit={handleCustomSourceSubmit} className="flex">
                      <input
                        type="text"
                        value={customSource}
                        onChange={(e) => setCustomSource(e.target.value)}
                        placeholder="Custom source..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                  {errors.source && (
                    <p className="mt-1 text-sm text-red-600">{errors.source}</p>
                  )}
                </div>
              </div>

              {/* Status and Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Status & Tags
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as LeadStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {LEAD_STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sales Stage
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) => handleInputChange('stage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="awareness">Awareness</option>
                      <option value="interest">Interest</option>
                      <option value="consideration">Consideration</option>
                      <option value="intent">Intent</option>
                      <option value="evaluation">Evaluation</option>
                      <option value="purchase">Purchase</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.account_status}
                      onChange={(e) => handleInputChange('account_status', e.target.value as AccountStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {ACCOUNT_STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  
                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Common Tags */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {COMMON_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        disabled={formData.tags.includes(tag)}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Tag Input */}
                  <form onSubmit={handleCustomTagSubmit} className="flex">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Custom tag..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Additional Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={formData.assigned_to || ''}
                    onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sales@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_close_date ? 
                      (formData.expected_close_date as any).toDate?.()?.toISOString().split('T')[0] || 
                      new Date(formData.expected_close_date).toISOString().split('T')[0] : 
                      ''
                    }
                    onChange={(e) => handleInputChange('expected_close_date', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Value
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_value || ''}
                      onChange={(e) => handleInputChange('estimated_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this lead..."
                />
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {lead ? 'Update Lead' : 'Create Lead'}
                  </>
                )}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

