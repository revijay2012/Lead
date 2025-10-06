import { collection, query, where, orderBy, startAt, endAt, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SearchResult, SearchFilters, Timestamp } from '../types/firestore';
import { SearchMode } from '../contexts/SearchContext';

export interface SimpleSearchResponse {
  results: SearchResult[];
  hasMore: boolean;
  lastDoc?: any;
}

class SimpleSearchService {
  async search(
    mode: SearchMode,
    term: string,
    options: {
      filters?: SearchFilters;
      lastDoc?: any;
      leadId?: string;
    } = {}
  ): Promise<SimpleSearchResponse> {
    const { filters = {}, lastDoc } = options;

    try {
      switch (mode) {
        case 'leads':
        case 'global':
        default:
          return await this.searchLeads(term, filters, lastDoc);
        
        case 'activities':
        case 'proposals':
        case 'contracts':
          // For now, return empty results for subcollections
          return {
            results: [],
            hasMore: false,
            lastDoc: null
          };
      }
    } catch (error) {
      console.error(`Search failed for mode ${mode}:`, error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async searchLeads(
    term: string,
    filters: SearchFilters,
    lastDoc?: any
  ): Promise<SimpleSearchResponse> {
    if (!term.trim()) {
      return { results: [], hasMore: false };
    }

    const normalizedTerm = term.toLowerCase().trim();
    const searchTerms = normalizedTerm.split(' ').filter(t => t.length > 0);
    
    try {
      let results: SearchResult[] = [];
      
      // Strategy 1: Try search_prefixes array (most comprehensive)
      try {
        let constraints = [
          where('search_prefixes', 'array-contains', normalizedTerm)
        ];

        // Add status filter if provided
        if (filters.status) {
          constraints.push(where('status', '==', filters.status));
        }

        // Add date filters if provided
        if (filters.created_date_from) {
          constraints.push(where('created_at', '>=', Timestamp.fromDate(filters.created_date_from)));
        }
        if (filters.created_date_to) {
          constraints.push(where('created_at', '<=', Timestamp.fromDate(filters.created_date_to)));
        }
        if (filters.updated_date_from) {
          constraints.push(where('updated_at', '>=', Timestamp.fromDate(filters.updated_date_from)));
        }
        if (filters.updated_date_to) {
          constraints.push(where('updated_at', '<=', Timestamp.fromDate(filters.updated_date_to)));
        }

        // Add source filter if provided
        if (filters.source) {
          constraints.push(where('source', '==', filters.source));
        }

        let q = query(
          collection(db, 'leads'),
          ...constraints,
          limit(20)
        );

        const snapshot = await getDocs(q);
        results = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'lead' as const,
            title: data.full_name || `${data.first_name} ${data.last_name}`,
            subtitle: data.email,
            status: data.status,
            timestamp: data.created_at || Timestamp.now(),
            lead_id: doc.id,
            lead_name: data.full_name || `${data.first_name} ${data.last_name}`,
            data: data
          } as SearchResult;
        });
      } catch (prefixError) {
        console.log('Prefix search failed, trying fallback methods:', prefixError);
      }

      // Strategy 2: If no results or prefix search failed, try first name and last name
      if (results.length === 0) {
        const searchPromises = [];
        
        // Search by first name
        if (searchTerms.length > 0) {
          searchPromises.push(
            query(
              collection(db, 'leads'),
              where('first_name_lower', '>=', searchTerms[0]),
              where('first_name_lower', '<=', searchTerms[0] + '\uf8ff'),
              limit(10)
            )
          );
        }
        
        // Search by last name
        if (searchTerms.length > 0) {
          searchPromises.push(
            query(
              collection(db, 'leads'),
              where('last_name_lower', '>=', searchTerms[0]),
              where('last_name_lower', '<=', searchTerms[0] + '\uf8ff'),
              limit(10)
            )
          );
        }

        // Search by full name
        searchPromises.push(
          query(
            collection(db, 'leads'),
            where('full_name_lower', '>=', normalizedTerm),
            where('full_name_lower', '<=', normalizedTerm + '\uf8ff'),
            limit(10)
          )
        );

        // Search by email
        if (normalizedTerm.includes('@')) {
          searchPromises.push(
            query(
              collection(db, 'leads'),
              where('email_lower', '>=', normalizedTerm),
              where('email_lower', '<=', normalizedTerm + '\uf8ff'),
              limit(10)
            )
          );
        }

        // Execute all searches
        const snapshots = await Promise.all(
          searchPromises.map(q => getDocs(q).catch(() => ({ docs: [] })))
        );

        // Combine results and remove duplicates
        const allResults = new Map();
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            if (!allResults.has(doc.id)) {
              const data = doc.data();
              allResults.set(doc.id, {
                id: doc.id,
                type: 'lead' as const,
                title: data.full_name || `${data.first_name} ${data.last_name}`,
                subtitle: data.email,
                status: data.status,
                timestamp: data.created_at || Timestamp.now(),
                lead_id: doc.id,
                lead_name: data.full_name || `${data.first_name} ${data.last_name}`,
                data: data
              } as SearchResult);
            }
          });
        });

        results = Array.from(allResults.values());
      }

      // If no results from prefix search, try array-contains on search_prefixes
      if (results.length === 0) {
        const fallbackQuery = query(
          collection(db, 'leads'),
          where('search_prefixes', 'array-contains', normalizedTerm),
          limit(20)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        results = fallbackSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'lead' as const,
            title: data.full_name || `${data.first_name} ${data.last_name}`,
            subtitle: data.email,
            status: data.status,
            timestamp: data.created_at || Timestamp.now(),
            lead_id: doc.id,
            lead_name: data.full_name || `${data.first_name} ${data.last_name}`,
            data: data
          } as SearchResult;
        });
      }

      return {
        results,
        hasMore: results.length === 20, // Simple pagination check
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };

    } catch (error) {
      console.error('Error searching leads:', error);
      // Return empty results on error rather than throwing
      return {
        results: [],
        hasMore: false,
        lastDoc: null
      };
    }
  }

  async loadMore(
    mode: SearchMode,
    term: string,
    lastDoc: any,
    options: {
      filters?: SearchFilters;
      leadId?: string;
    } = {}
  ): Promise<SimpleSearchResponse> {
    return this.search(mode, term, { ...options, lastDoc });
  }
}

export const simpleSearchService = new SimpleSearchService();
