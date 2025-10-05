// Check subcollections for a specific lead
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration matching the emulator
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

// Connect to emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('✅ Connected to Firestore emulator');
} catch (error) {
  console.log('⚠️  Emulator already connected or not available:', error.message);
}

async function checkLeadSubcollections() {
  try {
    const leadId = '08kCBk8vhBNCXOTddaU5';
    console.log(`\n🔍 Checking subcollections for lead: ${leadId}`);
    
    // Get the main lead document
    const leadRef = doc(db, 'leads', leadId);
    const leadDoc = await getDoc(leadRef);
    
    if (!leadDoc.exists()) {
      console.log('❌ Lead document not found');
      return;
    }
    
    const leadData = leadDoc.data();
    console.log(`📋 Lead: ${leadData.first_name} ${leadData.last_name} (${leadData.email})`);
    
    // Check activities subcollection
    console.log('\n🔍 Checking activities subcollection...');
    const activitiesRef = collection(db, 'leads', leadId, 'activities');
    const activitiesSnapshot = await getDocs(activitiesRef);
    console.log(`Found ${activitiesSnapshot.size} activities:`);
    
    activitiesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Activity ID: ${doc.id}`);
      console.log(`     Type: ${data.type}`);
      console.log(`     Subject: ${data.subject}`);
      console.log(`     Status: ${data.status || 'N/A'}`);
      console.log(`     Created: ${data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : new Date(data.timestamp).toLocaleString()) : 'N/A'}`);
      console.log('');
    });
    
    // Check proposals subcollection
    console.log('\n🔍 Checking proposals subcollection...');
    const proposalsRef = collection(db, 'leads', leadId, 'proposals');
    const proposalsSnapshot = await getDocs(proposalsRef);
    console.log(`Found ${proposalsSnapshot.size} proposals:`);
    
    proposalsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Proposal ID: ${doc.id}`);
      console.log(`     Title: ${data.title}`);
      console.log(`     Status: ${data.status}`);
      console.log(`     Amount: ${data.amount ? `$${data.amount}` : 'N/A'}`);
      console.log(`     Created: ${data.sent_at ? (data.sent_at.toDate ? data.sent_at.toDate().toLocaleString() : new Date(data.sent_at).toLocaleString()) : 'N/A'}`);
      console.log('');
    });
    
    // Check contracts subcollection
    console.log('\n🔍 Checking contracts subcollection...');
    const contractsRef = collection(db, 'leads', leadId, 'contracts');
    const contractsSnapshot = await getDocs(contractsRef);
    console.log(`Found ${contractsSnapshot.size} contracts:`);
    
    contractsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. Contract ID: ${doc.id}`);
      console.log(`     Title: ${data.title || 'N/A'}`);
      console.log(`     Status: ${data.status}`);
      console.log(`     Amount: ${data.amount ? `$${data.amount}` : 'N/A'}`);
      console.log(`     Start: ${data.start_date ? (data.start_date.toDate ? data.start_date.toDate().toLocaleString() : new Date(data.start_date).toLocaleString()) : 'N/A'}`);
      console.log('');
    });
    
    console.log('\n✅ Subcollection check completed');
    
  } catch (error) {
    console.error('❌ Error checking subcollections:', error);
    console.error('Error details:', error.message);
  }
}

checkLeadSubcollections();
