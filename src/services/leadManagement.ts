import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Lead, 
  Activity, 
  Proposal, 
  Contract, 
  StatusHistory, 
  AuditLog, 
  LeadVersion 
} from '../types/firestore';

// Helper function to generate search keywords
function generateSearchKeywords(text: string): string[] {
  if (!text) return [];
  const keywords = new Set();
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalizedText.split(/\s+/).filter(word => word.length > 2);

  words.forEach(word => {
    keywords.add(word);
    for (let i = 3; i <= Math.min(word.length, 8); i++) {
      keywords.add(word.slice(0, i));
    }
  });

  return Array.from(keywords);
}

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

// Lead Management Service
export class LeadManagementService {
  
  // Update lead with status change tracking
  static async updateLead(
    leadId: string, 
    updates: Partial<Lead>, 
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get current lead data
      const leadRef = doc(db, 'leads', leadId);
      const leadDoc = await getDocs(query(collection(db, 'leads'), where('__name__', '==', leadId)));
      const currentLead = leadDoc.docs[0]?.data() as Lead;
      
      if (!currentLead) {
        throw new Error('Lead not found');
      }

      // Check for status change
      const statusChanged = updates.status && updates.status !== currentLead.status;
      
      // Prepare updated lead data
      const updatedLeadData = {
        ...updates,
        updated_at: Timestamp.now(),
      };

      // Add search keywords if text fields changed
      if (updates.first_name || updates.last_name || updates.full_name || updates.email || updates.company) {
        const searchPrefixes = buildSearchPrefixes({
          first_name: updates.first_name || currentLead.first_name,
          last_name: updates.last_name || currentLead.last_name,
          email: updates.email || currentLead.email,
          phone: updates.phone || currentLead.phone,
          company: updates.company || currentLead.company
        });
        updatedLeadData.search_prefixes = searchPrefixes;
      }

      // Update lead document
      batch.update(leadRef, updatedLeadData);

      // Create audit log
      const auditLogRef = doc(collection(db, 'leads', leadId, 'audit_log'));
      const fieldsChanged = Object.keys(updates).map(field => ({
        field,
        old_value: currentLead[field as keyof Lead],
        new_value: updates[field as keyof Lead],
        field_type: typeof updates[field as keyof Lead]
      }));

      const auditLog: Omit<AuditLog, 'log_id'> = {
        changed_by: changedBy,
        fields_changed: fieldsChanged,
        timestamp: Timestamp.now(),
        search_keywords: generateSearchKeywords(
          `lead update ${currentLead.full_name} ${updates.status || currentLead.status}`
        ),
        lead_id: leadId,
        lead_name: updates.full_name || currentLead.full_name,
        lead_email: updates.email || currentLead.email,
        change_type: statusChanged ? 'status_change' : 'update',
        reason: reason || 'Lead updated',
        automated: false
      };

      batch.set(auditLogRef, { ...auditLog, log_id: auditLogRef.id });

      // Create status history entry if status changed
      if (statusChanged) {
        const statusHistoryRef = doc(collection(db, 'leads', leadId, 'status_history'));
        const statusHistory: Omit<StatusHistory, 'event_id'> = {
          from_status: currentLead.status,
          to_status: updates.status!,
          transition_reason: reason || 'Status updated',
          timestamp: Timestamp.now(),
          changed_by: changedBy,
          search_keywords: generateSearchKeywords(
            `${currentLead.status} to ${updates.status} ${currentLead.full_name}`
          ),
          lead_id: leadId,
          lead_name: updates.full_name || currentLead.full_name,
          lead_email: updates.email || currentLead.email,
          notes: `Status changed from ${currentLead.status} to ${updates.status}`,
          automated: false
        };

        batch.set(statusHistoryRef, { ...statusHistory, event_id: statusHistoryRef.id });
      }

      // Commit all changes
      await batch.commit();
      
      console.log('Lead updated successfully with audit trail');
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  // Add activity to lead
  static async addActivity(
    leadId: string,
    activityData: Omit<Activity, 'activity_id' | 'timestamp' | 'search_keywords' | 'lead_id' | 'lead_name' | 'lead_email' | 'created_by'>,
    leadName: string,
    leadEmail: string,
    createdBy: string
  ): Promise<string> {
    try {
      const activity: Omit<Activity, 'activity_id'> = {
        ...activityData,
        timestamp: Timestamp.now(),
        search_keywords: generateSearchKeywords(`${activityData.subject} ${activityData.notes || ''}`),
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        created_by: createdBy
      };

      console.log('Creating activity document:', activity);
      const docRef = await addDoc(collection(db, 'leads', leadId, 'activities'), activity);
      console.log('Activity document created with ID:', docRef.id);

      // Create audit log
      try {
        await this.createAuditLog(leadId, leadName, leadEmail, createdBy, 'subcollection_change', {
          subcollection_type: 'activities',
          subcollection_id: docRef.id,
          reason: `Activity added: ${activityData.subject}`
        });
      } catch (auditError) {
        console.warn('Failed to create audit log for activity:', auditError);
        // Don't fail the whole operation if audit log fails
      }

      return docRef.id;
    } catch (error) {
      console.error('Error adding activity:', error);
      console.error('Activity data:', activityData);
      console.error('Lead ID:', leadId);
      console.error('Lead name:', leadName);
      console.error('Lead email:', leadEmail);
      throw error;
    }
  }

  // Add proposal to lead
  static async addProposal(
    leadId: string,
    proposalData: Omit<Proposal, 'proposal_id' | 'sent_at' | 'search_keywords' | 'lead_id' | 'lead_name' | 'lead_email'>,
    leadName: string,
    leadEmail: string,
    createdBy: string
  ): Promise<string> {
    try {
      const proposal: Omit<Proposal, 'proposal_id'> = {
        ...proposalData,
        sent_at: Timestamp.now(),
        search_keywords: generateSearchKeywords(`${proposalData.title} ${proposalData.description || ''}`),
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        created_by: createdBy
      };

      const docRef = await addDoc(collection(db, 'leads', leadId, 'proposals'), proposal);

      // Create audit log
      await this.createAuditLog(leadId, leadName, leadEmail, createdBy, 'subcollection_change', {
        subcollection_type: 'proposals',
        subcollection_id: docRef.id,
        reason: `Proposal added: ${proposalData.title}`
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding proposal:', error);
      throw error;
    }
  }

  // Add contract to lead
  static async addContract(
    leadId: string,
    contractData: Omit<Contract, 'contract_id' | 'search_keywords' | 'lead_id' | 'lead_name' | 'lead_email'>,
    leadName: string,
    leadEmail: string,
    createdBy: string
  ): Promise<string> {
    try {
      const contract: Omit<Contract, 'contract_id'> = {
        ...contractData,
        search_keywords: generateSearchKeywords(`${contractData.title || 'Contract'} ${contractData.notes || ''}`),
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        created_by: createdBy
      };

      const docRef = await addDoc(collection(db, 'leads', leadId, 'contracts'), contract);

      // Create audit log
      await this.createAuditLog(leadId, leadName, leadEmail, createdBy, 'subcollection_change', {
        subcollection_type: 'contracts',
        subcollection_id: docRef.id,
        reason: `Contract added: ${contractData.title || 'New Contract'}`
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding contract:', error);
      throw error;
    }
  }

  // Create audit log entry
  static async createAuditLog(
    leadId: string,
    leadName: string,
    leadEmail: string,
    changedBy: string,
    changeType: AuditLog['change_type'],
    additionalData: Partial<AuditLog> = {}
  ): Promise<void> {
    try {
      const auditLogRef = doc(collection(db, 'leads', leadId, 'audit_log'));
      const auditLog: Omit<AuditLog, 'log_id'> = {
        changed_by: changedBy,
        fields_changed: [],
        timestamp: Timestamp.now(),
        search_keywords: generateSearchKeywords(`audit ${changeType} ${leadName}`),
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        change_type: changeType,
        reason: 'System generated audit log',
        automated: true,
        ...additionalData
      };

      await addDoc(collection(db, 'leads', leadId, 'audit_log'), { ...auditLog, log_id: auditLogRef.id });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error for audit log failures
    }
  }

  // Get lead with all subcollections
  static async getLeadWithSubcollections(leadId: string) {
    try {
      // Get all subcollections
      const [activities, proposals, contracts, statusHistory, auditLog] = await Promise.all([
        getDocs(collection(db, 'leads', leadId, 'activities')),
        getDocs(collection(db, 'leads', leadId, 'proposals')),
        getDocs(collection(db, 'leads', leadId, 'contracts')),
        getDocs(collection(db, 'leads', leadId, 'status_history')),
        getDocs(collection(db, 'leads', leadId, 'audit_log'))
      ]);

      return {
        activities: activities.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        proposals: proposals.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        contracts: contracts.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        statusHistory: statusHistory.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        auditLog: auditLog.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    } catch (error) {
      console.error('Error getting lead with subcollections:', error);
      // Return empty arrays if there's an error
      return {
        activities: [],
        proposals: [],
        contracts: [],
        statusHistory: [],
        auditLog: []
      };
    }
  }
}
