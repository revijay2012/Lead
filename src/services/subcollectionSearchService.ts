import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentSnapshot,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SubcollectionSearchResult {
  id: string;
  type: 'activity' | 'proposal' | 'contract';
  leadId: string;
  leadName: string;
  leadEmail: string;
  data: any;
  timestamp: Date;
  searchScore?: number;
}

export interface SubcollectionSearchFilters {
  type?: 'activity' | 'proposal' | 'contract' | 'all';
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  leadId?: string;
  createdBy?: string;
}

export interface SubcollectionSearchOptions {
  limit?: number;
  lastDoc?: DocumentSnapshot;
  sortBy?: 'timestamp' | 'created_at' | 'sent_at' | 'start_date';
  sortOrder?: 'asc' | 'desc';
}

class SubcollectionSearchService {
  
  /**
   * Search across all subcollections (activities, proposals, contracts)
   */
  async searchSubcollections(
    searchTerm: string,
    filters: SubcollectionSearchFilters = {},
    options: SubcollectionSearchOptions = {}
  ): Promise<{ results: SubcollectionSearchResult[]; lastDoc?: DocumentSnapshot }> {
    const { limit: resultLimit = 20 } = options;
    
    try {
      console.log('SubcollectionSearchService: Searching with term:', searchTerm);
      console.log('SubcollectionSearchService: Filters:', filters);
      
      const results: SubcollectionSearchResult[] = [];
      let lastDoc: DocumentSnapshot | undefined = options.lastDoc;
      
      // Search in each subcollection type
      const searchTypes = filters.type === 'all' || !filters.type 
        ? ['activities', 'proposals', 'contracts'] 
        : [filters.type + 's']; // Convert 'activity' to 'activities'
      
      for (const subcollectionType of searchTypes) {
        const subcollectionResults = await this.searchInSubcollection(
          subcollectionType as 'activities' | 'proposals' | 'contracts',
          searchTerm,
          filters,
          { ...options, limit: Math.ceil(resultLimit / searchTypes.length) }
        );
        
        results.push(...subcollectionResults.results);
        lastDoc = subcollectionResults.lastDoc;
      }
      
      // Sort results by relevance and timestamp
      results.sort((a, b) => {
        // First by search score (if available)
        if (a.searchScore && b.searchScore) {
          if (a.searchScore !== b.searchScore) {
            return b.searchScore - a.searchScore;
          }
        }
        
        // Then by timestamp (newest first)
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      // Limit final results
      const limitedResults = results.slice(0, resultLimit);
      
      console.log('SubcollectionSearchService: Found', limitedResults.length, 'results');
      
      return {
        results: limitedResults,
        lastDoc: limitedResults.length > 0 ? undefined : lastDoc // Only return lastDoc if we didn't get full results
      };
      
    } catch (error) {
      console.error('SubcollectionSearchService: Error searching subcollections:', error);
      return { results: [] };
    }
  }
  
  /**
   * Search within a specific subcollection type
   */
  private async searchInSubcollection(
    subcollectionType: 'activities' | 'proposals' | 'contracts',
    searchTerm: string,
    filters: SubcollectionSearchFilters,
    options: SubcollectionSearchOptions
  ): Promise<{ results: SubcollectionSearchResult[]; lastDoc?: DocumentSnapshot }> {
    
    const normalizedTerm = searchTerm.toLowerCase().trim();
    const results: SubcollectionSearchResult[] = [];
    
    try {
      // Get all leads first (we need to search across all leads)
      const leadsSnapshot = await getDocs(collection(db, 'leads'));
      
      console.log(`SubcollectionSearchService: Searching in ${subcollectionType} across ${leadsSnapshot.size} leads`);
      
      // Search in each lead's subcollection
      for (const leadDoc of leadsSnapshot.docs) {
        const leadData = leadDoc.data();
        const leadId = leadDoc.id;
        
        // Skip if filtering by specific lead and this isn't it
        if (filters.leadId && leadId !== filters.leadId) {
          continue;
        }
        
        try {
          // Build query for this lead's subcollection
          const subcollectionRef = collection(db, 'leads', leadId, subcollectionType);
          let q = query(subcollectionRef);
          
          // Add search constraints based on subcollection type
          const constraints = this.buildSearchConstraints(subcollectionType, normalizedTerm, filters);
          if (constraints.length > 0) {
            q = query(subcollectionRef, ...constraints);
          }
          
          // Add ordering
          const sortField = this.getSortField(subcollectionType, options.sortBy);
          const sortOrder = options.sortOrder || 'desc';
          q = query(q, orderBy(sortField, sortOrder));
          
          // Add limit
          if (options.limit) {
            q = query(q, limit(options.limit));
          }
          
          const subcollectionSnapshot = await getDocs(q);
          
          // Process results
          subcollectionSnapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Skip if doesn't match additional filters
            if (!this.matchesFilters(data, filters, subcollectionType)) {
              return;
            }
            
            // Calculate search score based on how well it matches
            const searchScore = this.calculateSearchScore(data, normalizedTerm, subcollectionType);
            
            // Only include if it has a decent search score
            if (searchScore > 0) {
              const result: SubcollectionSearchResult = {
                id: doc.id,
                type: subcollectionType.slice(0, -1) as 'activity' | 'proposal' | 'contract', // Remove 's'
                leadId: leadId,
                leadName: leadData.full_name || `${leadData.first_name} ${leadData.last_name}`,
                leadEmail: leadData.email,
                data: data,
                timestamp: this.getTimestamp(data, subcollectionType),
                searchScore: searchScore
              };
              
              results.push(result);
            }
          });
          
        } catch (error) {
          console.warn(`SubcollectionSearchService: Error searching ${subcollectionType} in lead ${leadId}:`, error);
        }
      }
      
      return { results };
      
    } catch (error) {
      console.error(`SubcollectionSearchService: Error searching ${subcollectionType}:`, error);
      return { results: [] };
    }
  }
  
  /**
   * Build search constraints for different subcollection types
   */
  private buildSearchConstraints(
    subcollectionType: string,
    searchTerm: string,
    filters: SubcollectionSearchFilters
  ): any[] {
    const constraints: any[] = [];
    
    // Add search term constraints
    if (searchTerm) {
      switch (subcollectionType) {
        case 'activities':
          // Search in subject, notes, and search_keywords
          constraints.push(where('search_keywords', 'array-contains-any', [searchTerm]));
          break;
        case 'proposals':
          // Search in title, description, and search_keywords
          constraints.push(where('search_keywords', 'array-contains-any', [searchTerm]));
          break;
        case 'contracts':
          // Search in title, terms, and search_keywords
          constraints.push(where('search_keywords', 'array-contains-any', [searchTerm]));
          break;
      }
    }
    
    // Add status filter
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    // Add created_by filter
    if (filters.createdBy) {
      constraints.push(where('created_by', '==', filters.createdBy));
    }
    
    // Add date range filters
    if (filters.dateFrom) {
      const timestampField = this.getTimestampField(subcollectionType);
      constraints.push(where(timestampField, '>=', Timestamp.fromDate(filters.dateFrom)));
    }
    
    if (filters.dateTo) {
      const timestampField = this.getTimestampField(subcollectionType);
      constraints.push(where(timestampField, '<=', Timestamp.fromDate(filters.dateTo)));
    }
    
    return constraints;
  }
  
  /**
   * Get the appropriate timestamp field for each subcollection type
   */
  private getTimestampField(subcollectionType: string): string {
    switch (subcollectionType) {
      case 'activities': return 'timestamp';
      case 'proposals': return 'created_at';
      case 'contracts': return 'start_date';
      default: return 'timestamp';
    }
  }
  
  /**
   * Get the appropriate sort field for each subcollection type
   */
  private getSortField(subcollectionType: string, sortBy?: string): string {
    if (sortBy) {
      return sortBy;
    }
    
    switch (subcollectionType) {
      case 'activities': return 'timestamp';
      case 'proposals': return 'created_at';
      case 'contracts': return 'start_date';
      default: return 'timestamp';
    }
  }
  
  /**
   * Get timestamp from subcollection data
   */
  private getTimestamp(data: any, subcollectionType: string): Date {
    const timestampField = this.getTimestampField(subcollectionType);
    const timestamp = data[timestampField];
    
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    } else if (timestamp) {
      return new Date(timestamp);
    }
    
    return new Date(); // Fallback to current date
  }
  
  /**
   * Check if data matches additional filters
   */
  private matchesFilters(data: any, filters: SubcollectionSearchFilters, subcollectionType: string): boolean {
    // Add any additional filtering logic here
    return true;
  }
  
  /**
   * Calculate search relevance score
   */
  private calculateSearchScore(data: any, searchTerm: string, subcollectionType: string): number {
    let score = 0;
    const term = searchTerm.toLowerCase();
    
    switch (subcollectionType) {
      case 'activities':
        // Check subject match (highest weight)
        if (data.subject && data.subject.toLowerCase().includes(term)) {
          score += 10;
        }
        // Check notes match
        if (data.notes && data.notes.toLowerCase().includes(term)) {
          score += 5;
        }
        // Check type match
        if (data.type && data.type.toLowerCase().includes(term)) {
          score += 3;
        }
        break;
        
      case 'proposals':
        // Check title match (highest weight)
        if (data.title && data.title.toLowerCase().includes(term)) {
          score += 10;
        }
        // Check description match
        if (data.description && data.description.toLowerCase().includes(term)) {
          score += 5;
        }
        // Check status match
        if (data.status && data.status.toLowerCase().includes(term)) {
          score += 3;
        }
        break;
        
      case 'contracts':
        // Check title match (highest weight)
        if (data.title && data.title.toLowerCase().includes(term)) {
          score += 10;
        }
        // Check terms match
        if (data.terms && data.terms.toLowerCase().includes(term)) {
          score += 5;
        }
        // Check type match
        if (data.type && data.type.toLowerCase().includes(term)) {
          score += 3;
        }
        break;
    }
    
    // Check search_keywords array
    if (data.search_keywords && Array.isArray(data.search_keywords)) {
      const keywordMatches = data.search_keywords.filter((keyword: string) => 
        keyword.toLowerCase().includes(term)
      ).length;
      score += keywordMatches * 2;
    }
    
    return score;
  }
  
  /**
   * Get search suggestions based on existing data
   */
  async getSearchSuggestions(searchTerm: string, limit: number = 10): Promise<string[]> {
    const suggestions = new Set<string>();
    const term = searchTerm.toLowerCase().trim();
    
    try {
      // Get sample data from each subcollection type
      const subcollectionTypes = ['activities', 'proposals', 'contracts'];
      
      for (const type of subcollectionTypes) {
        const leadsSnapshot = await getDocs(collection(db, 'leads'));
        
        for (const leadDoc of leadsSnapshot.docs.slice(0, 10)) { // Limit to first 10 leads for performance
          try {
            const subcollectionRef = collection(db, 'leads', leadDoc.id, type);
            const snapshot = await getDocs(query(subcollectionRef, limit(5))); // Get 5 items per lead
            
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              
              // Extract suggestions from relevant fields
              const fields = this.getSuggestionFields(type);
              fields.forEach(field => {
                if (data[field]) {
                  const value = data[field].toString().toLowerCase();
                  if (value.includes(term)) {
                    // Add the full value as suggestion
                    suggestions.add(data[field]);
                  }
                }
              });
            });
          } catch (error) {
            // Skip this lead if there's an error
          }
        }
      }
      
      return Array.from(suggestions).slice(0, limit);
      
    } catch (error) {
      console.error('SubcollectionSearchService: Error getting suggestions:', error);
      return [];
    }
  }
  
  /**
   * Get relevant fields for suggestions based on subcollection type
   */
  private getSuggestionFields(subcollectionType: string): string[] {
    switch (subcollectionType) {
      case 'activities':
        return ['subject', 'notes', 'type'];
      case 'proposals':
        return ['title', 'description', 'status'];
      case 'contracts':
        return ['title', 'terms', 'type'];
      default:
        return [];
    }
  }
}

export const subcollectionSearchService = new SubcollectionSearchService();
