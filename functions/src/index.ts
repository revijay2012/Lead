import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Utility functions for text processing
function generateSearchPrefixes(text: string): string[] {
  if (!text) return [];
  
  const normalized = text.toLowerCase().trim();
  const prefixes: string[] = [];
  
  // Add full text
  prefixes.push(normalized);
  
  // Add word-based prefixes
  const words = normalized.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= words.length; j++) {
      const phrase = words.slice(i, j).join(' ');
      if (phrase.length > 0) {
        prefixes.push(phrase);
      }
    }
  }
  
  // Add character-based prefixes (minimum 2 characters)
  for (let i = 2; i <= normalized.length; i++) {
    prefixes.push(normalized.substring(0, i));
  }
  
  // Remove duplicates and limit to 500
  return [...new Set(prefixes)].slice(0, 500);
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  const normalized = text.toLowerCase();
  
  // Split by common delimiters and filter out short words
  const words = normalized
    .split(/[\s\-_.,;:!?()[\]{}'"]+/)
    .filter(word => word.length >= 2)
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  
  // Add n-grams (2-word phrases)
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  
  return [...new Set([...words, ...bigrams])].slice(0, 100);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

// Cloud Function: Generate lead prefixes and normalized fields
export const generateLeadPrefixes = functions.firestore
  .document('leads/{leadId}')
  .onWrite(async (change, context) => {
    const leadId = context.params.leadId;
    const data = change.after.data();
    
    if (!data) {
      // Document was deleted, clean up search index
      await cleanupSearchIndex(leadId);
      return;
    }
    
    const before = change.before.data();
    
    // Only process if relevant fields changed
    const fieldsToCheck = ['first_name', 'last_name', 'email', 'phone'];
    const hasRelevantChanges = !before || fieldsToCheck.some(field => 
      data[field] !== before[field]
    );
    
    if (!hasRelevantChanges) return;
    
    try {
      const updates: any = {};
      
      // Generate full name and normalize
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      updates.full_name_lower = fullName.toLowerCase();
      updates.email_lower = (data.email || '').toLowerCase();
      updates.phone_digits = normalizePhone(data.phone || '');
      
      // Generate search prefixes
      const namePrefixes = generateSearchPrefixes(fullName);
      const emailPrefixes = generateSearchPrefixes(data.email || '');
      const phonePrefixes = generateSearchPrefixes(data.phone || '');
      
      updates.search_prefixes = [...new Set([...namePrefixes, ...emailPrefixes, ...phonePrefixes])];
      updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
      
      // Update the document
      await db.collection('leads').doc(leadId).update(updates);
      
      // Update global search index
      await updateGlobalSearchIndex('lead', leadId, {
        ...data,
        ...updates
      });
      
    } catch (error) {
      console.error('Error generating lead prefixes:', error);
    }
  });

// Cloud Function: Generate subcollection keywords
export const generateSubcollectionKeywords = functions.firestore
  .document('leads/{leadId}/{subcollection}/{docId}')
  .onWrite(async (change, context) => {
    const { leadId, subcollection, docId } = context.params;
    const data = change.after.data();
    
    if (!data) {
      // Document was deleted, clean up search index
      await cleanupSearchIndex(leadId, subcollection, docId);
      return;
    }
    
    try {
      const updates: any = {};
      let searchableText = '';
      
      // Extract searchable text based on subcollection type
      switch (subcollection) {
        case 'activities':
          searchableText = `${data.subject || ''} ${data.notes || ''}`.trim();
          updates.subject_lower = (data.subject || '').toLowerCase();
          updates.notes_lower = (data.notes || '').toLowerCase();
          break;
        case 'proposals':
          searchableText = `${data.title || ''} ${data.notes || ''}`.trim();
          updates.title_lower = (data.title || '').toLowerCase();
          break;
        case 'contracts':
          searchableText = `${data.notes || ''}`.trim();
          break;
        case 'audit_log':
          searchableText = data.fields_changed?.map((f: any) => f.field).join(' ') || '';
          break;
      }
      
      // Generate keywords
      updates.search_keywords = extractKeywords(searchableText);
      
      // Update the document
      await db.collection('leads').doc(leadId)
        .collection(subcollection).doc(docId).update(updates);
      
      // Update global search index
      await updateGlobalSearchIndex(subcollection as any, docId, {
        ...data,
        ...updates,
        lead_id: leadId
      });
      
    } catch (error) {
      console.error('Error generating subcollection keywords:', error);
    }
  });

// Helper function: Update global search index
async function updateGlobalSearchIndex(
  entityType: string,
  entityId: string,
  data: any
) {
  try {
    const searchEntry = {
      entity_type: entityType,
      entity_id: entityId,
      lead_id: data.lead_id || entityId,
      lead_name: data.lead_name || data.full_name_lower || '',
      keywords: data.search_keywords || data.search_prefixes || [],
      status: data.status || '',
      created_at: data.created_at || admin.firestore.FieldValue.serverTimestamp(),
      last_updated_at: admin.firestore.FieldValue.serverTimestamp(),
      title: data.title_lower || data.subject_lower || '',
      subject: data.subject_lower || '',
      notes: data.notes_lower || '',
      email: data.email_lower || '',
      phone: data.phone_digits || ''
    };
    
    await db.collection('search_index').doc(`${entityType}_${entityId}`).set(searchEntry);
  } catch (error) {
    console.error('Error updating search index:', error);
  }
}

// Helper function: Clean up search index
async function cleanupSearchIndex(
  leadId: string,
  subcollection?: string,
  docId?: string
) {
  try {
    if (subcollection && docId) {
      // Delete specific subcollection entry
      await db.collection('search_index').doc(`${subcollection}_${docId}`).delete();
    } else {
      // Delete all entries for this lead
      const batch = db.batch();
      const searchQuery = db.collection('search_index')
        .where('lead_id', '==', leadId);
      
      const snapshot = await searchQuery.get();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Error cleaning up search index:', error);
  }
}

// Cloud Function: Cleanup search index on delete
export const cleanupSearchIndexOnDelete = functions.firestore
  .document('leads/{leadId}')
  .onDelete(async (snap, context) => {
    const leadId = context.params.leadId;
    await cleanupSearchIndex(leadId);
  });

// Cloud Function: Batch update search index (for migration)
export const batchUpdateSearchIndex = functions.https.onCall(async (data, context) => {
  // This function can be called to rebuild the entire search index
  // Useful for migration or fixing corrupted data
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  try {
    const batch = db.batch();
    let count = 0;
    
    // Process leads
    const leadsSnapshot = await db.collection('leads').get();
    for (const doc of leadsSnapshot.docs) {
      const searchEntry = {
        entity_type: 'lead',
        entity_id: doc.id,
        lead_id: doc.id,
        lead_name: doc.data().full_name_lower || '',
        keywords: doc.data().search_prefixes || [],
        status: doc.data().status || '',
        created_at: doc.data().created_at,
        last_updated_at: admin.firestore.FieldValue.serverTimestamp(),
        email: doc.data().email_lower || '',
        phone: doc.data().phone_digits || ''
      };
      
      batch.set(db.collection('search_index').doc(`lead_${doc.id}`), searchEntry);
      count++;
    }
    
    // Process subcollections
    const subcollections = ['activities', 'proposals', 'contracts', 'audit_log'];
    for (const subcollection of subcollections) {
      const snapshot = await db.collectionGroup(subcollection).get();
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const searchEntry = {
          entity_type: subcollection,
          entity_id: doc.id,
          lead_id: data.lead_id || '',
          lead_name: data.lead_name || '',
          keywords: data.search_keywords || [],
          status: data.status || '',
          created_at: data.timestamp || data.created_at,
          last_updated_at: admin.firestore.FieldValue.serverTimestamp(),
          title: data.title_lower || data.subject_lower || '',
          subject: data.subject_lower || '',
          notes: data.notes_lower || ''
        };
        
        batch.set(db.collection('search_index').doc(`${subcollection}_${doc.id}`), searchEntry);
        count++;
      }
    }
    
    await batch.commit();
    
    return { success: true, processed: count };
  } catch (error) {
    console.error('Error in batch update:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update search index');
  }
});


