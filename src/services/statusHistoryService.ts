import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { StatusHistory, LeadStatus } from '../types/firestore';

export class StatusHistoryService {
  
  /**
   * Generate a unique event ID
   */
  private static generateEventId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Generate a random 3-digit number for uniqueness
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `EVT-${year}${month}${day}-${randomNum}`;
  }
  
  /**
   * Generate search keywords for status history
   */
  private static generateSearchKeywords(
    previousStatus: string,
    toStatus: string,
    reason: string,
    changedBy: string,
    comments?: string
  ): string[] {
    const keywords = new Set<string>();
    
    // Add status keywords
    keywords.add(previousStatus.toLowerCase());
    keywords.add(toStatus.toLowerCase());
    
    // Add reason keywords (split by words)
    if (reason) {
      const reasonWords = reason.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      reasonWords.forEach(word => keywords.add(word));
    }
    
    // Add changed by keywords
    if (changedBy) {
      const changedByWords = changedBy.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      changedByWords.forEach(word => keywords.add(word));
    }
    
    // Add comments keywords
    if (comments) {
      const commentsWords = comments.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      commentsWords.forEach(word => keywords.add(word));
    }
    
    // Add transition keywords
    keywords.add('status');
    keywords.add('change');
    keywords.add('transition');
    keywords.add('update');
    
    return Array.from(keywords);
  }
  
  /**
   * Record a status change event
   */
  static async recordStatusChange(
    leadId: string,
    leadName: string,
    leadEmail: string,
    previousStatus: LeadStatus,
    toStatus: LeadStatus,
    changedBy: string,
    reason: string,
    options: {
      autoTriggered?: boolean;
      notes?: string;
      comments?: string;
      previousData?: any;
      newData?: any;
    } = {}
  ): Promise<string> {
    try {
      console.log('StatusHistoryService: Recording status change:', {
        leadId,
        previousStatus,
        toStatus,
        changedBy,
        reason
      });
      
      // Generate unique event ID
      const eventId = this.generateEventId();
      
      // Create status history entry
      const statusHistoryData: Omit<StatusHistory, 'event_id'> = {
        previous_status: previousStatus,
        to_status: toStatus,
        changed_by: changedBy,
        changed_at: Timestamp.now(),
        reason: reason,
        auto_triggered: options.autoTriggered || false,
        search_keywords: this.generateSearchKeywords(
          previousStatus,
          toStatus,
          reason,
          changedBy,
          options.comments
        ),
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        notes: options.notes,
        comments: options.comments,
        previous_data: options.previousData,
        new_data: options.newData
      };
      
      // Add to Firestore
      const docRef = await addDoc(
        collection(db, 'leads', leadId, 'status_history'),
        statusHistoryData
      );
      
      console.log('StatusHistoryService: Status change recorded with event ID:', eventId);
      console.log('StatusHistoryService: Firestore document ID:', docRef.id);
      
      return eventId;
      
    } catch (error) {
      console.error('StatusHistoryService: Error recording status change:', error);
      throw error;
    }
  }
  
  /**
   * Get status history for a lead
   */
  static async getStatusHistory(
    leadId: string,
    options: {
      limit?: number;
      orderBy?: 'changed_at' | 'event_id';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<StatusHistory[]> {
    try {
      const {
        limit: resultLimit = 50,
        orderBy: orderByField = 'changed_at',
        orderDirection = 'desc'
      } = options;
      
      console.log('StatusHistoryService: Getting status history for lead:', leadId);
      
      const q = query(
        collection(db, 'leads', leadId, 'status_history'),
        orderBy(orderByField, orderDirection),
        limit(resultLimit)
      );
      
      const snapshot = await getDocs(q);
      
      const statusHistory = snapshot.docs.map(doc => ({
        event_id: doc.data().event_id || doc.id,
        ...doc.data()
      })) as StatusHistory[];
      
      console.log('StatusHistoryService: Retrieved', statusHistory.length, 'status history entries');
      
      return statusHistory;
      
    } catch (error) {
      console.error('StatusHistoryService: Error getting status history:', error);
      return [];
    }
  }
  
  /**
   * Get status history across all leads (for admin/analytics)
   */
  static async getGlobalStatusHistory(
    options: {
      limit?: number;
      status?: LeadStatus;
      changedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<StatusHistory[]> {
    try {
      const { limit: resultLimit = 100 } = options;
      
      console.log('StatusHistoryService: Getting global status history');
      
      // Get all leads first
      const leadsSnapshot = await getDocs(collection(db, 'leads'));
      
      const allStatusHistory: StatusHistory[] = [];
      
      // Get status history from each lead
      for (const leadDoc of leadsSnapshot.docs) {
        try {
          const leadStatusHistory = await this.getStatusHistory(leadDoc.id, {
            limit: 20 // Limit per lead to avoid memory issues
          });
          
            // Filter based on options
            const filteredHistory = leadStatusHistory.filter(entry => {
              if (options.status && entry.to_status !== options.status) return false;
              if (options.changedBy && entry.changed_by !== options.changedBy) return false;
              if (options.dateFrom && entry.changed_at.toDate() < options.dateFrom) return false;
              if (options.dateTo && entry.changed_at.toDate() > options.dateTo) return false;
              return true;
            });
          
          allStatusHistory.push(...filteredHistory);
        } catch (error) {
          console.warn('StatusHistoryService: Error getting status history for lead', leadDoc.id, error);
        }
      }
      
      // Sort by changed_at and limit
      allStatusHistory.sort((a, b) => b.changed_at.toMillis() - a.changed_at.toMillis());
      
      const limitedHistory = allStatusHistory.slice(0, resultLimit);
      
      console.log('StatusHistoryService: Retrieved', limitedHistory.length, 'global status history entries');
      
      return limitedHistory;
      
    } catch (error) {
      console.error('StatusHistoryService: Error getting global status history:', error);
      return [];
    }
  }
  
  /**
   * Get status change statistics
   */
  static async getStatusChangeStats(
    options: {
      dateFrom?: Date;
      dateTo?: Date;
      changedBy?: string;
    } = {}
  ): Promise<{
    totalChanges: number;
    changesByStatus: Record<LeadStatus, number>;
    changesByUser: Record<string, number>;
    autoTriggeredCount: number;
  }> {
    try {
      const globalHistory = await this.getGlobalStatusHistory({
        limit: 1000, // Get more data for stats
        ...options
      });
      
      const stats = {
        totalChanges: globalHistory.length,
        changesByStatus: {} as Record<LeadStatus, number>,
        changesByUser: {} as Record<string, number>,
        autoTriggeredCount: 0
      };
      
      // Initialize counters
      const allStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
      allStatuses.forEach(status => {
        stats.changesByStatus[status] = 0;
      });
      
      // Count changes
      globalHistory.forEach(entry => {
        // Count by to status
        stats.changesByStatus[entry.to_status]++;
        
        // Count by user
        stats.changesByUser[entry.changed_by] = (stats.changesByUser[entry.changed_by] || 0) + 1;
        
        // Count auto-triggered
        if (entry.auto_triggered) {
          stats.autoTriggeredCount++;
        }
      });
      
      console.log('StatusHistoryService: Generated status change statistics:', stats);
      
      return stats;
      
    } catch (error) {
      console.error('StatusHistoryService: Error generating status change stats:', error);
      return {
        totalChanges: 0,
        changesByStatus: {} as Record<LeadStatus, number>,
        changesByUser: {},
        autoTriggeredCount: 0
      };
    }
  }
  
  /**
   * Search status history
   */
  static async searchStatusHistory(
    searchTerm: string,
    options: {
      leadId?: string;
      limit?: number;
    } = {}
  ): Promise<StatusHistory[]> {
    try {
      const { leadId, limit: resultLimit = 50 } = options;
      const normalizedTerm = searchTerm.toLowerCase().trim();
      
      console.log('StatusHistoryService: Searching status history with term:', normalizedTerm);
      
      if (leadId) {
        // Search within specific lead
        const allHistory = await this.getStatusHistory(leadId, { limit: 200 });
        
        const filteredHistory = allHistory.filter(entry => 
          entry.reason.toLowerCase().includes(normalizedTerm) ||
          entry.changed_by.toLowerCase().includes(normalizedTerm) ||
          entry.previous_status.toLowerCase().includes(normalizedTerm) ||
          entry.to_status.toLowerCase().includes(normalizedTerm) ||
          entry.search_keywords.some(keyword => keyword.includes(normalizedTerm))
        );
        
        return filteredHistory.slice(0, resultLimit);
        
      } else {
        // Search across all leads
        const globalHistory = await this.getGlobalStatusHistory({ limit: 500 });
        
        const filteredHistory = globalHistory.filter(entry => 
          entry.reason.toLowerCase().includes(normalizedTerm) ||
          entry.changed_by.toLowerCase().includes(normalizedTerm) ||
          entry.previous_status.toLowerCase().includes(normalizedTerm) ||
          entry.to_status.toLowerCase().includes(normalizedTerm) ||
          entry.search_keywords.some(keyword => keyword.includes(normalizedTerm))
        );
        
        return filteredHistory.slice(0, resultLimit);
      }
      
    } catch (error) {
      console.error('StatusHistoryService: Error searching status history:', error);
      return [];
    }
  }
}
