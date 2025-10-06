import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { LeadStatus } from '../types/firestore';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStatus: LeadStatus, reason: string, comments: string, notes: string) => void;
  currentStatus: LeadStatus;
  leadName: string;
}

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
];

const commonReasons = [
  'Initial contact made',
  'Budget confirmed',
  'Decision maker identified',
  'Requirements clarified',
  'Proposal submitted',
  'Negotiation started',
  'Contract signed',
  'Deal closed',
  'Budget not available',
  'No decision maker',
  'Competitor chosen',
  'Timing not right',
  'Requirements changed',
  'Lost to competitor'
];

export function StatusChangeDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  currentStatus, 
  leadName 
}: StatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the status change');
      return;
    }

    if (selectedStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(selectedStatus, reason.trim(), comments.trim(), notes.trim());
      handleClose();
    } catch (err) {
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(currentStatus);
    setReason('');
    setComments('');
    setNotes('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleReasonSelect = (selectedReason: string) => {
    setReason(selectedReason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Change Lead Status</h2>
            <p className="text-sm text-gray-600 mt-1">{leadName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusOptions.find(s => s.value === currentStatus)?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {statusOptions.find(s => s.value === currentStatus)?.label || currentStatus}
              </span>
            </div>
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  disabled={status.value === currentStatus}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedStatus === status.value
                      ? 'border-blue-500 bg-blue-50'
                      : status.value === currentStatus
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change *
            </label>
            
            {/* Quick reason selection */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Quick select:</p>
              <div className="flex flex-wrap gap-2">
                {commonReasons.map((commonReason) => (
                  <button
                    key={commonReason}
                    onClick={() => handleReasonSelect(commonReason)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      reason === commonReason
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {commonReason}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you're changing the status..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional notes or context about this status change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              These comments will be stored with the status history and are searchable.
            </p>
          </div>

          {/* Separate Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Note to Activities
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="This will create a separate note entry in the activities section with timestamp..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will create a separate note activity entry with timestamp that appears in the Activities section.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || selectedStatus === currentStatus || !reason.trim()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Status
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
