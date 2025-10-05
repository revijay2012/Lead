import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  collectionGroup,
  QueryConstraint,
  DocumentSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  deleteDoc,
  addDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Lead,
  Activity,
  Proposal,
  Contract,
  SearchResult,
  SearchFilters,
  LeadStatus,
  AccountStatus,
  LeadFormData,
  ActivityFormData,
  ProposalFormData,
  ContractFormData
} from '../types/firestore';

// Export types
export type { SearchResult, SearchFilters } from '../types/firestore';

// Utility function to normalize search terms
export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

// Utility function to clean phone number for search
export function cleanPhoneForSearch(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

// Generate search prefixes for a lead
export function generateSearchPrefixes(firstName: string, lastName: string, email: string, phone: string, company: string): string[] {
  const prefixes = new Set<string>();
  
  // Add name prefixes
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  for (let i = 1; i <= fullName.length; i++) {
    prefixes.add(fullName.substring(0, i));
  }
  
  // Add email prefixes
  const emailLower = email.toLowerCase();
  for (let i = 1; i <= emailLower.length; i++) {
    prefixes.add(emailLower.substring(0, i));
  }
  
  // Add phone prefixes
  const phoneDigits = cleanPhoneForSearch(phone);
  for (let i = 3; i <= phoneDigits.length; i++) {
    prefixes.add(phoneDigits.substring(0, i));
  }
  
  // Add company prefixes
  if (company) {
    const companyLower = company.toLowerCase();
    for (let i = 1; i <= companyLower.length; i++) {
      prefixes.add(companyLower.substring(0, i));
    }
  }
  
  return Array.from(prefixes);
}

// Generate keywords for search
export function generateKeywords(text1: string, text2?: string): string[] {
  const keywords = new Set<string>();
  
  const processText = (text: string) => {
    if (!text) return;
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        keywords.add(word);
        // Add prefixes
        for (let i = 3; i <= word.length; i++) {
          keywords.add(word.substring(0, i));
        }
      }
    });
  };
  
  processText(text1);
  if (text2) processText(text2);
  
  return Array.from(keywords);
}

// Lead Search Functions
export async function getLeadsByPrefix(
  term: string,
  filters: SearchFilters = {},
  lastDoc?: DocumentSnapshot
): Promise<{ results: SearchResult[]; lastDoc?: DocumentSnapshot }> {
  const normalizedTerm = normalizeSearchTerm(term);
  const constraints: QueryConstraint[] = [];
  
  // Add filters
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.source) {
    constraints.push(where('source', '==', filters.source));
  }
  if (filters.assigned_to) {
    constraints.push(where('assigned_to', '==', filters.assigned_to));
  }
  if (filters.tags && filters.tags.length > 0) {
    constraints.push(where('tags', 'array-contains-any', filters.tags));
  }
  if (filters.date_range) {
    constraints.push(where('created_at', '>=', filters.date_range.start));
    constraints.push(where('created_at', '<=', filters.date_range.end));
  }
  
  // Add pagination
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  // Add limit
  constraints.push(limit(25));
  
  // Try different search strategies
  let results: SearchResult[] = [];
  let querySnapshot: any;
  
  // Strategy 1: Prefix search on full_name_lower
  try {
    const nameQuery = query(
      collection(db, 'leads'),
      orderBy('full_name_lower'),
      where('full_name_lower', '>=', normalizedTerm),
      where('full_name_lower', '<=', normalizedTerm + '\uf8ff'),
      ...constraints
    );
    querySnapshot = await getDocs(nameQuery);
    results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'lead' as const,
      title: `${doc.data().first_name} ${doc.data().last_name}`,
      subtitle: doc.data().email,
      status: doc.data().status,
      timestamp: doc.data().created_at,
      lead_id: doc.id,
      lead_name: `${doc.data().first_name} ${doc.data().last_name}`,
      data: doc.data()
    }));
  } catch (error) {
    console.log('Name prefix search failed, trying array-contains fallback');
  }
  
  // Strategy 2: If no results, try email prefix search
  if (results.length === 0) {
    try {
      const emailQuery = query(
        collection(db, 'leads'),
        orderBy('email_lower'),
        where('email_lower', '>=', normalizedTerm),
        where('email_lower', '<=', normalizedTerm + '\uf8ff'),
        ...constraints
      );
      querySnapshot = await getDocs(emailQuery);
      results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'lead' as const,
        title: `${doc.data().first_name} ${doc.data().last_name}`,
        subtitle: doc.data().email,
        status: doc.data().status,
        timestamp: doc.data().created_at,
        lead_id: doc.id,
        lead_name: `${doc.data().first_name} ${doc.data().last_name}`,
        data: doc.data()
      }));
    } catch (error) {
      console.log('Email prefix search failed, trying phone search');
    }
  }
  
  // Strategy 3: If still no results, try phone digits search
  if (results.length === 0) {
    const phoneDigits = cleanPhoneForSearch(term);
    if (phoneDigits.length >= 3) {
      try {
        const phoneQuery = query(
          collection(db, 'leads'),
          orderBy('phone_digits'),
          where('phone_digits', '>=', phoneDigits),
          where('phone_digits', '<=', phoneDigits + '\uf8ff'),
          ...constraints
        );
        querySnapshot = await getDocs(phoneQuery);
        results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'lead' as const,
          title: `${doc.data().first_name} ${doc.data().last_name}`,
          subtitle: doc.data().email,
          status: doc.data().status,
          timestamp: doc.data().created_at,
          lead_id: doc.id,
          lead_name: `${doc.data().first_name} ${doc.data().last_name}`,
          data: doc.data()
        }));
      } catch (error) {
        console.log('Phone search failed, trying array-contains fallback');
      }
    }
  }
  
  // Strategy 4: Fallback to array-contains on search_prefixes
  if (results.length === 0) {
    try {
      const fallbackQuery = query(
        collection(db, 'leads'),
        where('search_prefixes', 'array-contains', normalizedTerm),
        ...constraints
      );
      querySnapshot = await getDocs(fallbackQuery);
      results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'lead' as const,
        title: `${doc.data().first_name} ${doc.data().last_name}`,
        subtitle: doc.data().email,
        status: doc.data().status,
        timestamp: doc.data().created_at,
        lead_id: doc.id,
        lead_name: `${doc.data().first_name} ${doc.data().last_name}`,
        data: doc.data()
      }));
    } catch (error) {
      console.error('All search strategies failed:', error);
    }
  }
  
  return {
    results,
    lastDoc: querySnapshot?.docs[querySnapshot.docs.length - 1]
  };
}

// Activity Search Functions
export async function getActivitiesByKeyword(
  term: string,
  leadId?: string,
  lastDoc?: DocumentSnapshot
): Promise<{ results: SearchResult[]; lastDoc?: DocumentSnapshot }> {
  const normalizedTerm = normalizeSearchTerm(term);
  const constraints: QueryConstraint[] = [
    where('search_keywords', 'array-contains', normalizedTerm),
    limit(25)
  ];
  
  if (leadId) {
    constraints.unshift(where('lead_id', '==', leadId));
  }
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(collectionGroup(db, 'activities'), ...constraints);
  const querySnapshot = await getDocs(q);
  
  const results = querySnapshot.docs.map(doc => ({
    id: doc.id,
    type: 'activity' as const,
    title: doc.data().subject || 'Activity',
    subtitle: doc.data().lead_name || '',
    status: doc.data().type,
    timestamp: doc.data().timestamp,
    lead_id: doc.data().lead_id,
    lead_name: doc.data().lead_name,
    data: doc.data()
  }));
  
  return {
    results,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
  };
}

// Proposal Search Functions
export async function getProposalsByTitle(
  term: string,
  leadId?: string,
  lastDoc?: DocumentSnapshot
): Promise<{ results: SearchResult[]; lastDoc?: DocumentSnapshot }> {
  const normalizedTerm = normalizeSearchTerm(term);
  const constraints: QueryConstraint[] = [];
  
  if (leadId) {
    constraints.push(where('lead_id', '==', leadId));
  }
  
  // Try prefix search first
  try {
    const prefixQuery = query(
      collectionGroup(db, 'proposals'),
      orderBy('title_lower'),
      where('title_lower', '>=', normalizedTerm),
      where('title_lower', '<=', normalizedTerm + '\uf8ff'),
      ...constraints,
      limit(25)
    );
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(prefixQuery);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'proposal' as const,
      title: doc.data().title || 'Proposal',
      subtitle: doc.data().lead_name || '',
      status: doc.data().status,
      timestamp: doc.data().sent_at,
      lead_id: doc.data().lead_id,
      lead_name: doc.data().lead_name,
      data: doc.data()
    }));
    
    return {
      results,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    // Fallback to keyword search
    const keywordQuery = query(
      collectionGroup(db, 'proposals'),
      where('search_keywords', 'array-contains', normalizedTerm),
      ...constraints,
      limit(25)
    );
    
    const querySnapshot = await getDocs(keywordQuery);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'proposal' as const,
      title: doc.data().title || 'Proposal',
      subtitle: doc.data().lead_name || '',
      status: doc.data().status,
      timestamp: doc.data().sent_at,
      lead_id: doc.data().lead_id,
      lead_name: doc.data().lead_name,
      data: doc.data()
    }));
    
    return {
      results,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  }
}

// Contract Search Functions
export async function getContractsExpiringWithin(
  days: number,
  leadId?: string,
  lastDoc?: DocumentSnapshot
): Promise<{ results: SearchResult[]; lastDoc?: DocumentSnapshot }> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureTimestamp = Timestamp.fromDate(futureDate);
  
  const constraints: QueryConstraint[] = [
    where('end_date', '<=', futureTimestamp),
    where('status', '==', 'active'),
    limit(25)
  ];
  
  if (leadId) {
    constraints.unshift(where('lead_id', '==', leadId));
  }
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(collectionGroup(db, 'contracts'), ...constraints);
  const querySnapshot = await getDocs(q);
  
  const results = querySnapshot.docs.map(doc => ({
    id: doc.id,
    type: 'contract' as const,
    title: `Contract - ${doc.data().lead_name}`,
    subtitle: `Expires: ${doc.data().end_date.toDate().toLocaleDateString()}`,
    status: doc.data().status,
    timestamp: doc.data().end_date,
    lead_id: doc.data().lead_id,
    lead_name: doc.data().lead_name,
    data: doc.data()
  }));
  
  return {
    results,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
  };
}

// Global Search Function
export async function getGlobalSearchResults(
  term: string,
  entityTypes: string[] = ['lead', 'activity', 'proposal', 'contract'],
  lastDoc?: DocumentSnapshot
): Promise<{ results: SearchResult[]; lastDoc?: DocumentSnapshot }> {
  const normalizedTerm = normalizeSearchTerm(term);
  const constraints: QueryConstraint[] = [
    where('keywords', 'array-contains', normalizedTerm),
    where('entity_type', 'in', entityTypes),
    orderBy('last_updated_at', 'desc'),
    limit(25)
  ];
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(collection(db, 'search_index'), ...constraints);
  const querySnapshot = await getDocs(q);
  
  const results = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.entity_id,
      type: data.entity_type,
      title: data.title || data.lead_name || 'Untitled',
      subtitle: data.lead_name || data.subject || data.email || '',
      status: data.status,
      timestamp: data.last_updated_at,
      lead_id: data.lead_id,
      lead_name: data.lead_name,
      data: data
    };
  });
  
  return {
    results,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
  };
}

// Get single document by ID
export async function getLeadById(leadId: string): Promise<Lead | null> {
  const docRef = doc(db, 'leads', leadId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { lead_id: leadId, ...docSnap.data() } as Lead;
  }
  
  return null;
}

export async function getActivityById(leadId: string, activityId: string): Promise<Activity | null> {
  const docRef = doc(db, 'leads', leadId, 'activities', activityId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { activity_id: activityId, ...docSnap.data() } as Activity;
  }
  
  return null;
}

export async function getProposalById(leadId: string, proposalId: string): Promise<Proposal | null> {
  const docRef = doc(db, 'leads', leadId, 'proposals', proposalId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { proposal_id: proposalId, ...docSnap.data() } as Proposal;
  }
  
  return null;
}

export async function getContractById(leadId: string, contractId: string): Promise<Contract | null> {
  const docRef = doc(db, 'leads', leadId, 'contracts', contractId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { contract_id: contractId, ...docSnap.data() } as Contract;
  }
  
  return null;
}

// Get subcollection data
export async function getActivitiesByLeadId(leadId: string): Promise<Activity[]> {
  const activitiesRef = collection(db, 'leads', leadId, 'activities');
  const snapshot = await getDocs(activitiesRef);
  return snapshot.docs.map(doc => ({ activity_id: doc.id, ...doc.data() } as Activity));
}

export async function getProposalsByLeadId(leadId: string): Promise<Proposal[]> {
  const proposalsRef = collection(db, 'leads', leadId, 'proposals');
  const snapshot = await getDocs(proposalsRef);
  return snapshot.docs.map(doc => ({ proposal_id: doc.id, ...doc.data() } as Proposal));
}

export async function getContractsByLeadId(leadId: string): Promise<Contract[]> {
  const contractsRef = collection(db, 'leads', leadId, 'contracts');
  const snapshot = await getDocs(contractsRef);
  return snapshot.docs.map(doc => ({ contract_id: doc.id, ...doc.data() } as Contract));
}

// Delete functions
export async function deleteLead(leadId: string): Promise<void> {
  const leadRef = doc(db, 'leads', leadId);
  await deleteDoc(leadRef);
}

export async function deleteActivity(leadId: string, activityId: string): Promise<void> {
  const activityRef = doc(db, 'leads', leadId, 'activities', activityId);
  await deleteDoc(activityRef);
}

export async function deleteProposal(leadId: string, proposalId: string): Promise<void> {
  const proposalRef = doc(db, 'leads', leadId, 'proposals', proposalId);
  await deleteDoc(proposalRef);
}

export async function deleteContract(leadId: string, contractId: string): Promise<void> {
  const contractRef = doc(db, 'leads', leadId, 'contracts', contractId);
  await deleteDoc(contractRef);
}

// Search by specific filters
export async function searchByStatus(
  status: LeadStatus | AccountStatus,
  entityType: 'lead' | 'activity' | 'proposal' | 'contract' = 'lead',
  lastDoc?: DocumentSnapshot
): Promise<{ results: SearchResult[]; lastDoc?: DocumentSnapshot }> {
  const constraints: QueryConstraint[] = [
    where('status', '==', status),
    limit(25)
  ];
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  let q;
  if (entityType === 'lead') {
    q = query(collection(db, 'leads'), ...constraints);
  } else {
    q = query(collectionGroup(db, entityType + 's'), ...constraints);
  }
  
  const querySnapshot = await getDocs(q);
  
  const results = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      type: entityType,
      title: data.title || data.subject || `${data.first_name} ${data.last_name}` || 'Untitled',
      subtitle: data.lead_name || data.email || '',
      status: data.status,
      timestamp: data.created_at || data.timestamp || data.sent_at,
      lead_id: data.lead_id || doc.id,
      lead_name: data.lead_name || `${data.first_name} ${data.last_name}`,
      data: data
    };
  });
  
  return {
    results,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
  };
}


// Create/Update functions
export async function createLead(leadData: LeadFormData): Promise<Lead> {
  const newLeadRef = collection(db, 'leads');
  const docRef = await addDoc(newLeadRef, {
    ...leadData,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
    full_name_lower: `${leadData.first_name.toLowerCase()} ${leadData.last_name.toLowerCase()}`,
    email_lower: leadData.email.toLowerCase(),
    phone_digits: cleanPhoneForSearch(leadData.phone),
    search_prefixes: generateSearchPrefixes(leadData.first_name, leadData.last_name, leadData.email, leadData.phone, leadData.company)
  });
  return { lead_id: docRef.id, ...leadData } as Lead;
}

export async function updateLead(leadId: string, leadData: Partial<LeadFormData>): Promise<void> {
  const leadRef = doc(db, 'leads', leadId);
  await updateDoc(leadRef, {
    ...leadData,
    updated_at: Timestamp.now(),
    ...(leadData.first_name || leadData.last_name) && { full_name_lower: `${(leadData.first_name || '').toLowerCase()} ${(leadData.last_name || '').toLowerCase()}` },
    ...(leadData.email) && { email_lower: leadData.email.toLowerCase() },
    ...(leadData.phone) && { phone_digits: cleanPhoneForSearch(leadData.phone) },
    search_prefixes: generateSearchPrefixes(leadData.first_name, leadData.last_name, leadData.email, leadData.phone, leadData.company)
  });
}

export async function createActivity(leadId: string, activityData: ActivityFormData): Promise<Activity> {
  const newActivityRef = collection(db, 'leads', leadId, 'activities');
  const docRef = await addDoc(newActivityRef, {
    ...activityData,
    timestamp: Timestamp.now(),
    lead_id: leadId,
    subject_lower: activityData.subject.toLowerCase(),
    search_keywords: generateKeywords(activityData.subject, activityData.notes)
  });
  return { activity_id: docRef.id, ...activityData } as Activity;
}

export async function updateActivity(leadId: string, activityId: string, activityData: Partial<ActivityFormData>): Promise<void> {
  const activityRef = doc(db, 'leads', leadId, 'activities', activityId);
  await updateDoc(activityRef, {
    ...activityData,
    ...(activityData.subject) && { subject_lower: activityData.subject.toLowerCase() },
    search_keywords: generateKeywords(activityData.subject, activityData.notes)
  });
}

export async function createProposal(leadId: string, proposalData: ProposalFormData): Promise<Proposal> {
  const newProposalRef = collection(db, 'leads', leadId, 'proposals');
  const docRef = await addDoc(newProposalRef, {
    ...proposalData,
    created_at: Timestamp.now(),
    sent_at: proposalData.sent_at || Timestamp.now(),
    lead_id: leadId,
    title_lower: proposalData.title.toLowerCase(),
    search_keywords: generateKeywords(proposalData.title, proposalData.description)
  });
  return { proposal_id: docRef.id, ...proposalData } as Proposal;
}

export async function updateProposal(leadId: string, proposalId: string, proposalData: Partial<ProposalFormData>): Promise<void> {
  const proposalRef = doc(db, 'leads', leadId, 'proposals', proposalId);
  await updateDoc(proposalRef, {
    ...proposalData,
    ...(proposalData.title) && { title_lower: proposalData.title.toLowerCase() },
    search_keywords: generateKeywords(proposalData.title, proposalData.description)
  });
}

export async function createContract(leadId: string, contractData: ContractFormData): Promise<Contract> {
  const newContractRef = collection(db, 'leads', leadId, 'contracts');
  const docRef = await addDoc(newContractRef, {
    ...contractData,
    created_at: Timestamp.now(),
    lead_id: leadId,
    title_lower: contractData.title.toLowerCase(),
    search_keywords: generateKeywords(contractData.title, contractData.description)
  });
  return { contract_id: docRef.id, ...contractData } as Contract;
}

export async function updateContract(leadId: string, contractId: string, contractData: Partial<ContractFormData>): Promise<void> {
  const contractRef = doc(db, 'leads', leadId, 'contracts', contractId);
  await updateDoc(contractRef, {
    ...contractData,
    ...(contractData.title) && { title_lower: contractData.title.toLowerCase() },
    search_keywords: generateKeywords(contractData.title, contractData.description)
  });
}