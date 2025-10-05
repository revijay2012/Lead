
import { 
  collection, 
  collectionGroup, 
  query, 
  where, 
  orderBy, 
  startAt, 
  endAt, 
  limit, 
  getDocs, 
  DocumentSnapshot,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SubcollectionSearchResult {
  id: string;
  type: 'activity' | 'proposal' | 'contract';
  lead_id: string;
  lead_name: string;
  lead_email: string;
  data: any;
  timestamp?: Date;
}

export interface SubcollectionSearchFilters {
  lead_id?: string;
  type?: string;
  status?: string;
  date_from?: Date;
  date_to?: Date;
}

/**
 * 🔹 (A) Search Within One Lead's Subcollection
 * Example: Show all activities under one lead containing keyword "call"
 */
export async function searchWithinLeadSubcollection(
  leadId: string,
  subcollection: 'activities' | 'proposals' | 'contracts',
  searchTerm: string,
  filters: SubcollectionSearchFilters = {}
): Promise<SubcollectionSearchResult[]> {
  const constraints: QueryConstraint[] = [];
  
  // Add filters
  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.date_from) {
    constraints.push(where('timestamp', '>=', filters.date_from));
  }
  if (filters.date_to) {
    constraints.push(where('timestamp', '<=', filters.date_to));
  }

  try {
    // Strategy 1: Prefix search on subject_lower/title_lower
    let results: SubcollectionSearchResult[] = [];
    
    if (subcollection === 'activities') {
      const activityQuery = query(
        collection(db, 'leads', leadId, 'activities'),
        orderBy('subject_lower'),
        startAt(searchTerm.toLowerCase()),
        endAt(searchTerm.toLowerCase() + '\uf8ff'),
        ...constraints
      );
      
      const snapshot = await getDocs(activityQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'activity' as const,
        lead_id: leadId,
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } else if (subcollection === 'proposals') {
      const proposalQuery = query(
        collection(db, 'leads', leadId, 'proposals'),
        orderBy('title_lower'),
        startAt(searchTerm.toLowerCase()),
        endAt(searchTerm.toLowerCase() + '\uf8ff'),
        ...constraints
      );
      
      const snapshot = await getDocs(proposalQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'proposal' as const,
        lead_id: leadId,
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().created_at?.toDate()
      }));
    } else if (subcollection === 'contracts') {
      const contractQuery = query(
        collection(db, 'leads', leadId, 'contracts'),
        orderBy('title_lower'),
        startAt(searchTerm.toLowerCase()),
        endAt(searchTerm.toLowerCase() + '\uf8ff'),
        ...constraints
      );
      
      const snapshot = await getDocs(contractQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'contract' as const,
        lead_id: leadId,
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().start_date?.toDate()
      }));
    }

    // Strategy 2: If no results, try array-contains on search_keywords
    if (results.length === 0) {
      const fallbackQuery = query(
        collection(db, 'leads', leadId, subcollection),
        where('search_keywords', 'array-contains', searchTerm.toLowerCase()),
        ...constraints
      );
      
      const snapshot = await getDocs(fallbackQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: subcollection.slice(0, -1) as 'activity' | 'proposal' | 'contract',
        lead_id: leadId,
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().timestamp?.toDate() || doc.data().created_at?.toDate() || doc.data().start_date?.toDate()
      }));
    }

    return results;
  } catch (error) {
    console.error('Error searching within lead subcollection:', error);
    return [];
  }
}

/**
 * 🔹 (B) Search Across All Leads — collectionGroup()
 * If you want to search activities across all leads (global search)
 */
export async function searchAcrossAllSubcollections(
  subcollection: 'activities' | 'proposals' | 'contracts',
  searchTerm: string,
  filters: SubcollectionSearchFilters = {},
  lastDoc?: DocumentSnapshot
): Promise<{ results: SubcollectionSearchResult[]; lastDoc?: DocumentSnapshot }> {
  const constraints: QueryConstraint[] = [];
  
  // Add filters
  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.lead_id) {
    constraints.push(where('lead_id', '==', filters.lead_id));
  }
  if (filters.date_from) {
    constraints.push(where('timestamp', '>=', filters.date_from));
  }
  if (filters.date_to) {
    constraints.push(where('timestamp', '<=', filters.date_to));
  }

  try {
    let results: SubcollectionSearchResult[] = [];
    
    // Strategy 1: Prefix search on normalized fields
    if (subcollection === 'activities') {
      const activityQuery = query(
        collectionGroup(db, 'activities'),
        orderBy('subject_lower'),
        startAt(searchTerm.toLowerCase()),
        endAt(searchTerm.toLowerCase() + '\uf8ff'),
        ...constraints,
        limit(20)
      );
      
      const snapshot = await getDocs(activityQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'activity' as const,
        lead_id: doc.data().lead_id || '',
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } else if (subcollection === 'proposals') {
      const proposalQuery = query(
        collectionGroup(db, 'proposals'),
        orderBy('title_lower'),
        startAt(searchTerm.toLowerCase()),
        endAt(searchTerm.toLowerCase() + '\uf8ff'),
        ...constraints,
        limit(20)
      );
      
      const snapshot = await getDocs(proposalQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'proposal' as const,
        lead_id: doc.data().lead_id || '',
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().created_at?.toDate()
      }));
    } else if (subcollection === 'contracts') {
      const contractQuery = query(
        collectionGroup(db, 'contracts'),
        orderBy('title_lower'),
        startAt(searchTerm.toLowerCase()),
        endAt(searchTerm.toLowerCase() + '\uf8ff'),
        ...constraints,
        limit(20)
      );
      
      const snapshot = await getDocs(contractQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'contract' as const,
        lead_id: doc.data().lead_id || '',
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().start_date?.toDate()
      }));
    }

    // Strategy 2: If no results, try array-contains on search_keywords
    if (results.length === 0) {
      const fallbackQuery = query(
        collectionGroup(db, subcollection),
        where('search_keywords', 'array-contains', searchTerm.toLowerCase()),
        ...constraints,
        limit(20)
      );
      
      const snapshot = await getDocs(fallbackQuery);
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        type: subcollection.slice(0, -1) as 'activity' | 'proposal' | 'contract',
        lead_id: doc.data().lead_id || '',
        lead_name: doc.data().lead_name || '',
        lead_email: doc.data().lead_email || '',
        data: doc.data(),
        timestamp: doc.data().timestamp?.toDate() || doc.data().created_at?.toDate() || doc.data().start_date?.toDate()
      }));
    }

    return {
      results,
      lastDoc: results.length > 0 ? undefined : lastDoc // Simplified for now
    };
  } catch (error) {
    console.error('Error searching across subcollections:', error);
    return { results: [] };
  }
}

/**
 * 🔹 (C) Search by Reference to Parent Lead
 * If you need to show subcollection results with parent lead info
 */
export async function searchSubcollectionsByLeadEmail(
  leadEmail: string,
  subcollection: 'activities' | 'proposals' | 'contracts'
): Promise<SubcollectionSearchResult[]> {
  try {
    const query_ref = query(
      collectionGroup(db, subcollection),
      where('lead_email', '==', leadEmail)
    );
    
    const snapshot = await getDocs(query_ref);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      type: subcollection.slice(0, -1) as 'activity' | 'proposal' | 'contract',
      lead_id: doc.data().lead_id || '',
      lead_name: doc.data().lead_name || '',
      lead_email: doc.data().lead_email || '',
      data: doc.data(),
      timestamp: doc.data().timestamp?.toDate() || doc.data().created_at?.toDate() || doc.data().start_date?.toDate()
    }));
  } catch (error) {
    console.error('Error searching subcollections by lead email:', error);
    return [];
  }
}

/**
 * 🔹 (D) Multi-field Search Example
 * Search by multiple criteria across subcollections
 */
export async function searchSubcollectionsByMultipleFields(
  subcollection: 'activities' | 'proposals' | 'contracts',
  searchTerm: string,
  type?: string,
  status?: string
): Promise<SubcollectionSearchResult[]> {
  const constraints: QueryConstraint[] = [];
  
  if (type) {
    constraints.push(where('type', '==', type));
  }
  if (status) {
    constraints.push(where('status', '==', status));
  }
  constraints.push(where('search_keywords', 'array-contains', searchTerm.toLowerCase()));
  
  try {
    const query_ref = query(
      collectionGroup(db, subcollection),
      ...constraints,
      limit(50)
    );
    
    const snapshot = await getDocs(query_ref);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      type: subcollection.slice(0, -1) as 'activity' | 'proposal' | 'contract',
      lead_id: doc.data().lead_id || '',
      lead_name: doc.data().lead_name || '',
      lead_email: doc.data().lead_email || '',
      data: doc.data(),
      timestamp: doc.data().timestamp?.toDate() || doc.data().created_at?.toDate() || doc.data().start_date?.toDate()
    }));
  } catch (error) {
    console.error('Error searching subcollections by multiple fields:', error);
    return [];
  }
}

