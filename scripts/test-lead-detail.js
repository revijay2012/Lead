const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection,
  doc,
  getDoc,
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

// Simulate the getLeadById function
async function getLeadById(leadId) {
  const docRef = doc(db, 'leads', leadId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { lead_id: leadId, ...docSnap.data() };
  }
  
  return null;
}

// Simulate the getActivitiesByLeadId function
async function getActivitiesByLeadId(leadId) {
  const activitiesRef = collection(db, 'leads', leadId, 'activities');
  const snapshot = await getDocs(activitiesRef);
  return snapshot.docs.map(doc => ({ activity_id: doc.id, ...doc.data() }));
}

// Simulate the getProposalsByLeadId function
async function getProposalsByLeadId(leadId) {
  const proposalsRef = collection(db, 'leads', leadId, 'proposals');
  const snapshot = await getDocs(proposalsRef);
  return snapshot.docs.map(doc => ({ proposal_id: doc.id, ...doc.data() }));
}

// Simulate the getContractsByLeadId function
async function getContractsByLeadId(leadId) {
  const contractsRef = collection(db, 'leads', leadId, 'contracts');
  const snapshot = await getDocs(contractsRef);
  return snapshot.docs.map(doc => ({ contract_id: doc.id, ...doc.data() }));
}

async function testLeadDetailLoading() {
  console.log('🔍 Testing Lead Detail Loading (Simulating LeadDetailView)\n');

  try {
    // Get a lead ID
    const leadsSnapshot = await getDocs(collection(db, 'leads'));
    if (leadsSnapshot.empty) {
      console.log('❌ No leads found. Please seed data first.');
      return;
    }
    
    const firstLead = leadsSnapshot.docs[0];
    const leadId = firstLead.id;
    console.log(`📋 Testing with Lead ID: ${leadId}`);
    console.log(`   Lead Name: ${firstLead.data().full_name}`);
    
    // Test the exact same functions that LeadDetailView uses
    console.log('\n🔄 Loading lead data (same as LeadDetailView)...');
    
    const [leadData, activitiesData, proposalsData, contractsData] = await Promise.all([
      getLeadById(leadId),
      getActivitiesByLeadId(leadId),
      getProposalsByLeadId(leadId),
      getContractsByLeadId(leadId)
    ]);

    console.log('\n📊 Results:');
    console.log(`   Lead Data: ${leadData ? '✅ Found' : '❌ Not found'}`);
    if (leadData) {
      console.log(`   Lead Name: ${leadData.full_name}`);
      console.log(`   Lead Email: ${leadData.email}`);
      console.log(`   Lead Status: ${leadData.status}`);
    }
    
    console.log(`   Activities: ${activitiesData.length} found`);
    activitiesData.forEach((activity, index) => {
      console.log(`     ${index + 1}. ${activity.subject || activity.title} (${activity.type})`);
    });
    
    console.log(`   Proposals: ${proposalsData.length} found`);
    proposalsData.forEach((proposal, index) => {
      console.log(`     ${index + 1}. ${proposal.title} (${proposal.status})`);
    });
    
    console.log(`   Contracts: ${contractsData.length} found`);
    contractsData.forEach((contract, index) => {
      console.log(`     ${index + 1}. ${contract.title} (${contract.status})`);
    });
    
    // Test if the data would cause any issues
    if (!leadData) {
      console.log('\n❌ ISSUE: Lead data is null - this would cause blank view!');
    } else if (activitiesData.length === 0 && proposalsData.length === 0 && contractsData.length === 0) {
      console.log('\n⚠️  WARNING: No subcollections found - view might appear empty');
    } else {
      console.log('\n✅ All data loaded successfully - LeadDetailView should work');
    }
    
  } catch (error) {
    console.error('❌ Error testing lead detail loading:', error);
  }
}

// Run the test
testLeadDetailLoading();

