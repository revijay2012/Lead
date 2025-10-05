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
    
    try {
      // Strategy 1: Try prefix search on full_name_lower
      let q = query(
        collection(db, 'leads'),
        orderBy('full_name_lower'),
        startAt(normalizedTerm),
        endAt(normalizedTerm + '\uf8ff'),
        limit(20)
      );

      // Add status filter if provided
      if (filters.status) {
        q = query(
          collection(db, 'leads'),
          where('status', '==', filters.status),
          orderBy('full_name_lower'),
          startAt(normalizedTerm),
          endAt(normalizedTerm + '\uf8ff'),
          limit(20)
        );
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => {
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
