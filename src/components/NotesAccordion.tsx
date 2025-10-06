import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Send, 
  Clock, 
  User,
  AlertCircle 
} from 'lucide-react';
import { LeadManagementService } from '../services/leadManagement';
import { Activity } from '../types/firestore';

interface NotesAccordionProps {
  leadId: string;
  leadName: string;
  leadEmail: string;
  className?: string;
}

export function NotesAccordion({ leadId, leadName, leadEmail, className = "" }: NotesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, leadId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await LeadManagementService.getLeadWithSubcollections(leadId);
      const noteActivities = data.activities.filter(activity => activity.type === 'note');
      setNotes(noteActivities as Activity[]);
    } catch (error) {
      console.error('Error loading notes:', error);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      setError('Please enter a note');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await LeadManagementService.addActivity(
        leadId,
        {
          type: 'note',
          subject: 'Note',
          notes: newNote.trim(),
          timestamp: new Date()
        },
        leadName,
        leadEmail,
        'system' // TODO: Replace with actual user
      );

      setNewNote('');
      await loadNotes(); // Reload notes
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
          )}
          <h3 className="text-sm font-medium text-gray-900">Notes ({notes.length})</h3>
        </div>
        <Plus className="h-4 w-4 text-gray-400" />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-gray-200">
          {/* Add New Note Form */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add New Note
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading || !newNote.trim()}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Add Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Previous Notes List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notes.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first note using the form above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notes.map((note, index) => (
                  <div key={note.activity_id || index} className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {note.created_by || 'System'}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(note.timestamp)}
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {note.notes}
                          </p>
                        </div>
                        {note.subject && note.subject !== 'Note' && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {note.subject}
                            </span>
                          </div>
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
  );
}
