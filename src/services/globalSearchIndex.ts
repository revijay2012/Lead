import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  DocumentSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface GlobalSearchIndexEntry {
  entity: 'lead' | 'activity' | 'proposal' | 'contract';
  entity_id: string;
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  keywords: string[];
  type?: string;
  status?: string;
  title?: string;
  subject?: string;
  description?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GlobalSearchResult {
  id: string;
  entity: 'lead' | 'activity' | 'proposal' | 'contract';
  entity_id: string;
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  title?: string;
  subject?: string;
  description?: string;
  notes?: string;
  status?: string;
  type?: string;
  timestamp?: Date;
  data: any;
}

/**
 * ⚡ Global Search Strategy (All Entities)
 * Create a lightweight /search_index collection with all searchable entities flattened
 */
export async function searchGlobalIndex(
  searchTerm: string,
  entityTypes: string[] = ['lead', 'activity', 'proposal', 'contract'],
  filters: {
    lead_id?: string;
    type?: string;
    status?: string;
    date_from?: Date;
    date_to?: Date;
  } = {}
): Promise<{ results: GlobalSearchResult[]; lastDoc?: DocumentSnapshot }> {
  const constraints: any[] = [];
  
  // Filter by entity types
  if (entityTypes.length > 0) {
    constraints.push(where('entity', 'in', entityTypes));
  }
  
  // Add other filters
  if (filters.lead_id) {
    constraints.push(where('lead_id', '==', filters.lead_id));
  }
  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.date_from) {
    constraints.push(where('created_at', '>=', filters.date_from));
  }
  if (filters.date_to) {
    constraints.push(where('created_at', '<=', filters.date_to));
  }
  
  // Search in keywords array
  constraints.push(where('keywords', 'array-contains', searchTerm.toLowerCase()));
  
  try {
    const searchQuery = query(
      collection(db, 'search_index'),
      ...constraints,
      orderBy('created_at', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(searchQuery);
    
    const results: GlobalSearchResult[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        entity: data.entity,
        entity_id: data.entity_id,
        lead_id: data.lead_id,
        lead_name: data.lead_name,
        lead_email: data.lead_email,
        title: data.title,
        subject: data.subject,
        description: data.description,
        status: data.status,
        type: data.type,
        timestamp: data.created_at?.toDate(),
        data: data
      };
    });
    
    return {
      results,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error searching global index:', error);
    return { results: [] };
  }
}

/**
 * Add or update an entry in the global search index
 */
export async function updateGlobalSearchIndex(
  entity: 'lead' | 'activity' | 'proposal' | 'contract',
  entityId: string,
  data: any,
  leadId?: string
): Promise<void> {
  try {
    const keywords = generateSearchKeywords(data);
    
    const indexEntry: GlobalSearchIndexEntry = {
      entity,
      entity_id: entityId,
      lead_id: leadId || data.lead_id,
      lead_name: data.lead_name || data.full_name,
      lead_email: data.lead_email || data.email,
      keywords,
      type: data.type,
      status: data.status,
      title: data.title || data.subject,
      subject: data.subject,
      description: data.description || data.notes,
      notes: data.notes,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: new Date()
    };
    
    // Check if entry exists
    const existingQuery = query(
      collection(db, 'search_index'),
      where('entity', '==', entity),
      where('entity_id', '==', entityId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (existingSnapshot.empty) {
      // Create new entry
      await addDoc(collection(db, 'search_index'), indexEntry);
    } else {
      // Update existing entry
      const docId = existingSnapshot.docs[0].id;
      await updateDoc(doc(db, 'search_index', docId), indexEntry);
    }
  } catch (error) {
    console.error('Error updating global search index:', error);
  }
}

/**
 * Remove an entry from the global search index
 */
export async function removeFromGlobalSearchIndex(
  entity: 'lead' | 'activity' | 'proposal' | 'contract',
  entityId: string
): Promise<void> {
  try {
    const query_ref = query(
      collection(db, 'search_index'),
      where('entity', '==', entity),
      where('entity_id', '==', entityId)
    );
    
    const snapshot = await getDocs(query_ref);
    
    for (const doc_snap of snapshot.docs) {
      await updateDoc(doc(db, 'search_index', doc_snap.id), {
        deleted: true,
        updated_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error removing from global search index:', error);
  }
}

/**
 * Generate search keywords from text data
 */
function generateSearchKeywords(data: any): string[] {
  const keywords = new Set<string>();
  
  // Extract text fields
  const textFields = [
    data.full_name,
    data.first_name,
    data.last_name,
    data.email,
    data.company,
    data.title,
    data.subject,
    data.description,
    data.notes,
    data.terms
  ].filter(Boolean);
  
  // Process each text field
  textFields.forEach(text => {
    if (typeof text === 'string') {
      // Clean and split text into words
      const words = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2); // Only words longer than 2 characters
      
      words.forEach(word => {
        // Add full word
        keywords.add(word);
        
        // Add prefixes for longer words
        for (let i = 3; i <= Math.min(word.length, 8); i++) {
          keywords.add(word.slice(0, i));
        }
      });
    }
  });
  
  return Array.from(keywords);
}

/**
 * Search with multiple keywords (AND logic)
 */
export async function searchGlobalIndexMultipleKeywords(
  keywords: string[],
  entityTypes: string[] = ['lead', 'activity', 'proposal', 'contract']
): Promise<GlobalSearchResult[]> {
  try {
    const results: GlobalSearchResult[] = [];
    
    // For multiple keywords, we need to do separate queries and find intersections
    // This is a simplified approach - for production, consider using Algolia or similar
    for (const keyword of keywords) {
      const searchResult = await searchGlobalIndex(keyword, entityTypes);
      
      if (results.length === 0) {
        // First keyword - add all results
        results.push(...searchResult.results);
      } else {
        // Subsequent keywords - find intersections
        const keywordResults = searchResult.results.map(r => r.id);
        const filteredResults = results.filter(r => keywordResults.includes(r.id));
        results.splice(0, results.length, ...filteredResults);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error searching global index with multiple keywords:', error);
    return [];
  }
}

/**
 * Get search suggestions based on existing keywords
 */
export async function getSearchSuggestions(
  partialTerm: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const suggestionsQuery = query(
      collection(db, 'search_index'),
      where('keywords', 'array-contains', partialTerm.toLowerCase()),
      limit(limit * 10) // Get more to filter unique suggestions
    );
    
    const snapshot = await getDocs(suggestionsQuery);
    const suggestions = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const keywords = doc.data().keywords || [];
      keywords.forEach((keyword: string) => {
        if (keyword.startsWith(partialTerm.toLowerCase()) && keyword.length > partialTerm.length) {
          suggestions.add(keyword);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}
