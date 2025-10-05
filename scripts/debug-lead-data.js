const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection,
  getDocs,
  connectFirestoreEmulator 
} = require('firebase/firestore');

// Firebase configuration for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8082);
  console.log('Connected to Firestore emulator');
} catch (error) {
  console.log('Emulator already connected or not available');
}

async function debugLeadData() {
  console.log('🔍 Debugging Lead Data Structure\n');

  try {
    // Check leads collection
    const leadsSnapshot = await getDocs(collection(db, 'leads'));
    console.log(`📊 Found ${leadsSnapshot.size} leads in collection`);
    
    if (leadsSnapshot.size > 0) {
      const firstLead = leadsSnapshot.docs[0];
      const leadData = firstLead.data();
      const leadId = firstLead.id;
      
      console.log(`\n📋 First Lead Details:`);
      console.log(`   ID: ${leadId}`);
      console.log(`   Name: ${leadData.full_name || leadData.first_name + ' ' + leadData.last_name}`);
      console.log(`   Email: ${leadData.email}`);
      console.log(`   Status: ${leadData.status}`);
      
      // Check subcollections
      console.log(`\n🔍 Checking Subcollections for Lead: ${leadId}`);
      
      // Check activities
      const activitiesSnapshot = await getDocs(collection(db, 'leads', leadId, 'activities'));
      console.log(`   Activities: ${activitiesSnapshot.size} documents`);
      if (activitiesSnapshot.size > 0) {
        const firstActivity = activitiesSnapshot.docs[0].data();
        console.log(`   First Activity: ${firstActivity.subject || firstActivity.title} (${firstActivity.type})`);
      }
      
      // Check proposals
      const proposalsSnapshot = await getDocs(collection(db, 'leads', leadId, 'proposals'));
      console.log(`   Proposals: ${proposalsSnapshot.size} documents`);
      if (proposalsSnapshot.size > 0) {
        const firstProposal = proposalsSnapshot.docs[0].data();
        console.log(`   First Proposal: ${firstProposal.title} (${firstProposal.status})`);
      }
      
      // Check contracts
      const contractsSnapshot = await getDocs(collection(db, 'leads', leadId, 'contracts'));
      console.log(`   Contracts: ${contractsSnapshot.size} documents`);
      if (contractsSnapshot.size > 0) {
        const firstContract = contractsSnapshot.docs[0].data();
        console.log(`   First Contract: ${firstContract.title} (${firstContract.status})`);
      }
      
      // Check search_index
      const searchIndexSnapshot = await getDocs(collection(db, 'search_index'));
      console.log(`\n📊 Search Index: ${searchIndexSnapshot.size} documents`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging lead data:', error);
  }
}

// Run the debug
debugLeadData();

