import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-no-project.firebaseapp.com",
  projectId: "demo-no-project",
  storageBucket: "demo-no-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('✅ Connected to Firestore emulator');
} catch (error) {
  console.log('⚠️  Emulator already connected or not available');
}

async function clearAllData() {
  try {
    console.log('🗑️  Clearing all existing data...');
    
    // Get all leads
    const leadsSnapshot = await getDocs(collection(db, 'leads'));
    console.log(`Found ${leadsSnapshot.size} leads to delete`);
    
    // Delete all leads and their subcollections
    for (const leadDoc of leadsSnapshot.docs) {
      const leadId = leadDoc.id;
      
      // Delete subcollections first
      const subcollections = ['status_history', 'activities', 'proposals', 'contracts', 'audit_log', 'versions'];
      
      for (const subcollection of subcollections) {
        try {
          const subcollectionSnapshot = await getDocs(collection(db, 'leads', leadId, subcollection));
          for (const subDoc of subcollectionSnapshot.docs) {
            await deleteDoc(subDoc.ref);
          }
        } catch (error) {
          // Subcollection might not exist, continue
        }
      }
      
      // Delete the main lead document
      await deleteDoc(leadDoc.ref);
    }
    
    console.log('✅ All data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// Run the clear function
clearAllData();
