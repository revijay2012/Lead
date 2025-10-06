import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  X, 
  Plus, 
  Minus, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  DollarSign,
  Tag,
  RefreshCw,
  Download
} from 'lucide-react';

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'not_equals' | 'not_contains';
  value: string;
  enabled: boolean;
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
  enabled: boolean;
}

export interface AdvancedFilterProps {
  onApplyFilters: (filters: FilterGroup[]) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_OPTIONS = [
  { value: 'first_name', label: 'First Name', icon: User, type: 'text' },
  { value: 'last_name', label: 'Last Name', icon: User, type: 'text' },
  { value: 'email', label: 'Email', icon: Mail, type: 'email' },
  { value: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
  { value: 'company', label: 'Company', icon: Building, type: 'text' },
  { value: 'status', label: 'Status', icon: Tag, type: 'select' },
  { value: 'source', label: 'Source', icon: Tag, type: 'select' },
  { value: 'contract_value', label: 'Contract Value', icon: DollarSign, type: 'number' },
  { value: 'created_at', label: 'Created Date', icon: Calendar, type: 'date' },
  { value: 'updated_at', label: 'Updated Date', icon: Calendar, type: 'date' }
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'not_contains', label: 'Not Contains' }
];

const STATUS_OPTIONS = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'customer'
];

const SOURCE_OPTIONS = [
  'website', 'referral', 'cold_call', 'trade_show', 'social_media', 'email_campaign', 'linkedin', 'google_ads'
];

export function AdvancedFilterPanel({ onApplyFilters, onClearFilters, isOpen, onClose }: AdvancedFilterProps) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: 'group-1',
      conditions: [
        {
          id: 'condition-1',
          field: 'first_name',
          operator: 'contains',
          value: '',
          enabled: true
        }
      ],
      operator: 'AND',
      enabled: true
    }
  ]);

  const [isExpanded, setIsExpanded] = useState(false);

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      conditions: [
        {
          id: `condition-${Date.now()}`,
          field: 'first_name',
          operator: 'contains',
          value: '',
          enabled: true
        }
      ],
      operator: 'AND',
      enabled: true
    };
    setFilterGroups([...filterGroups, newGroup]);
  };

  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length > 1) {
      setFilterGroups(filterGroups.filter(group => group.id !== groupId));
    }
  };

  const addCondition = (groupId: string) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                {
                  id: `condition-${Date.now()}`,
                  field: 'first_name',
                  operator: 'contains',
                  value: '',
                  enabled: true
                }
              ]
            }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter(condition => condition.id !== conditionId)
            }
          : group
      )
    );
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map(condition =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition
              )
            }
          : group
      )
    );
  };

  const updateGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, operator }
          : group
      )
    );
  };

  const toggleGroupEnabled = (groupId: string) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, enabled: !group.enabled }
          : group
      )
    );
  };

  const toggleConditionEnabled = (groupId: string, conditionId: string) => {
    updateCondition(groupId, conditionId, { enabled: !filterGroups
      .find(g => g.id === groupId)
      ?.conditions.find(c => c.id === conditionId)?.enabled });
  };

  const getFieldConfig = (fieldValue: string) => {
    return FIELD_OPTIONS.find(field => field.value === fieldValue) || FIELD_OPTIONS[0];
  };

  const getFieldOptions = (fieldValue: string) => {
    switch (fieldValue) {
      case 'status':
        return STATUS_OPTIONS;
      case 'source':
        return SOURCE_OPTIONS;
      default:
        return [];
    }
  };

  const handleApplyFilters = () => {
    const enabledGroups = filterGroups.filter(group => group.enabled);
    onApplyFilters(enabledGroups);
  };

  const handleClearFilters = () => {
    setFilterGroups([
      {
        id: 'group-1',
        conditions: [
          {
            id: 'condition-1',
            field: 'first_name',
            operator: 'contains',
            value: '',
            enabled: true
          }
        ],
        operator: 'AND',
        enabled: true
      }
    ]);
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    return filterGroups.reduce((count, group) => {
      if (!group.enabled) return count;
      return count + group.conditions.filter(condition => condition.enabled && condition.value.trim()).length;
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getActiveFilterCount()} active
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? 'Collapse' : 'Expand'} All
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {filterGroups.map((group, groupIndex) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={group.enabled}
                        onChange={() => toggleGroupEnabled(group.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Filter Group {groupIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={group.operator}
                        onChange={(e) => updateGroupOperator(group.id, e.target.value as 'AND' | 'OR')}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        disabled={!group.enabled}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                      {filterGroups.length > 1 && (
                        <button
                          onClick={() => removeFilterGroup(group.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-3">
                    {group.conditions.map((condition, conditionIndex) => {
                      const fieldConfig = getFieldConfig(condition.field);
                      const fieldOptions = getFieldOptions(condition.field);
                      const IconComponent = fieldConfig.icon;

                      return (
                        <div key={condition.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                          <input
                            type="checkbox"
                            checked={condition.enabled}
                            onChange={() => toggleConditionEnabled(group.id, condition.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4 text-gray-500" />
                            <select
                              value={condition.field}
                              onChange={(e) => updateCondition(group.id, condition.id, { field: e.target.value })}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1"
                              disabled={!condition.enabled}
                            >
                              {FIELD_OPTIONS.map(field => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(group.id, condition.id, { operator: e.target.value as any })}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1"
                            disabled={!condition.enabled}
                          >
                            {OPERATOR_OPTIONS.map(op => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex-1">
                            {fieldOptions.length > 0 ? (
                              <select
                                value={condition.value}
                                onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                                disabled={!condition.enabled}
                              >
                                <option value="">Select {fieldConfig.label}</option>
                                {fieldOptions.map(option => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={fieldConfig.type}
                                value={condition.value}
                                onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
                                placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                                disabled={!condition.enabled}
                              />
                            )}
                          </div>

                          {group.conditions.length > 1 && (
                            <button
                              onClick={() => removeCondition(group.id, condition.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          {conditionIndex < group.conditions.length - 1 && (
                            <span className="text-sm text-gray-500 font-medium">
                              {group.operator}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={() => addCondition(group.id)}
                      className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:text-gray-800 hover:border-gray-400"
                      disabled={!group.enabled}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addFilterGroup}
                className="w-full flex items-center justify-center px-4 py-3 border border-dashed border-blue-300 rounded-lg text-sm text-blue-600 hover:text-blue-800 hover:border-blue-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Filter Group
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All Filters
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
