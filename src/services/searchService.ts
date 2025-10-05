import {
  getLeadsByPrefix,
  SearchResult,
  SearchFilters
} from './firestoreSearch';
import { 
  searchAcrossAllSubcollections,
  SubcollectionSearchResult 
} from './subcollectionSearch';
import { 
  searchGlobalIndex,
  GlobalSearchResult 
} from './globalSearchIndex';
import { SearchMode } from '../contexts/SearchContext';

export interface SearchResponse {
  results: SearchResult[];
  hasMore: boolean;
  lastDoc?: any;
}

class SearchService {
  async search(
    mode: SearchMode,
    term: string,
    options: {
      filters?: SearchFilters;
      lastDoc?: any;
      leadId?: string;
    } = {}
  ): Promise<SearchResponse> {
    const { filters = {}, lastDoc, leadId } = options;

    try {
      switch (mode) {
        case 'leads':
          const leadResults = await getLeadsByPrefix(term, filters, lastDoc);
          return {
            results: leadResults.results,
            hasMore: !!leadResults.lastDoc,
            lastDoc: leadResults.lastDoc
          };
        
        case 'activities':
          const activityResults = await searchAcrossAllSubcollections('activities', term, {
            lead_id: leadId,
            type: filters.type,
            status: filters.status
          }, lastDoc);
          return {
            results: this.convertSubcollectionResults(activityResults.results),
            hasMore: !!activityResults.lastDoc,
            lastDoc: activityResults.lastDoc
          };
        
        case 'proposals':
          const proposalResults = await searchAcrossAllSubcollections('proposals', term, {
            lead_id: leadId,
            type: filters.type,
            status: filters.status
          }, lastDoc);
          return {
            results: this.convertSubcollectionResults(proposalResults.results),
            hasMore: !!proposalResults.lastDoc,
            lastDoc: proposalResults.lastDoc
          };
        
        case 'contracts':
          const contractResults = await searchAcrossAllSubcollections('contracts', term, {
            lead_id: leadId,
            type: filters.type,
            status: filters.status
          }, lastDoc);
          return {
            results: this.convertSubcollectionResults(contractResults.results),
            hasMore: !!contractResults.lastDoc,
            lastDoc: contractResults.lastDoc
          };
        
            case 'global':
            default:
              const entityTypes = ['lead', 'activity', 'proposal', 'contract'];
              const globalResults = await searchGlobalIndex(term, entityTypes, {
                lead_id: leadId,
                type: filters.type,
                status: filters.status,
                date_from: filters.date_range?.start?.toDate ? filters.date_range.start.toDate() : filters.date_range?.start,
                date_to: filters.date_range?.end?.toDate ? filters.date_range.end.toDate() : filters.date_range?.end
              });
          return {
            results: this.convertGlobalResults(globalResults.results),
            hasMore: !!globalResults.lastDoc,
            lastDoc: globalResults.lastDoc
          };
      }
    } catch (error) {
      console.error(`Search failed for mode ${mode}:`, error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert subcollection results to SearchResult format
  private convertSubcollectionResults(results: SubcollectionSearchResult[]): SearchResult[] {
    return results.map(result => ({
      id: result.id,
      type: result.type,
      title: result.data.subject || result.data.title || result.data.description || 'Untitled',
      subtitle: result.lead_name || result.lead_email || '',
      status: result.data.status || result.data.type || 'unknown',
      timestamp: result.timestamp ? this.dateToTimestamp(result.timestamp) : new Date() as any,
      lead_id: result.lead_id,
      lead_name: result.lead_name,
      data: result.data
    }));
  }

  // Convert global search results to SearchResult format
  private convertGlobalResults(results: GlobalSearchResult[]): SearchResult[] {
    return results.map(result => ({
      id: result.id,
      type: result.entity,
      title: result.title || result.subject || result.lead_name || 'Untitled',
      subtitle: result.lead_name || result.description || result.notes || '',
      status: result.status || result.type || 'unknown',
      timestamp: result.timestamp ? this.dateToTimestamp(result.timestamp) : new Date() as any,
      lead_id: result.lead_id,
      lead_name: result.lead_name,
      data: result.data
    }));
  }

  async loadMore(
    mode: SearchMode,
    term: string,
    lastDoc: any,
    options: {
      filters?: SearchFilters;
      leadId?: string;
    } = {}
  ): Promise<SearchResponse> {
    return this.search(mode, term, { ...options, lastDoc });
  }

  // Helper method to convert Date to Timestamp-like object
  private dateToTimestamp(date: Date): any {
    return {
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    };
  }
}

export const searchService = new SearchService();

