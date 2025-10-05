// Test script to verify proposal creation works
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, connectFirestoreEmulator, Timestamp } from 'firebase/firestore';

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

async function testProposalCreation() {
  try {
    console.log('\n🧪 Testing proposal creation...');
    
    // First, get a lead to add proposal to
    const leadsRef = collection(db, 'leads');
    const leadsSnapshot = await getDocs(leadsRef);
    
    if (leadsSnapshot.size === 0) {
      console.log('❌ No leads found. Please seed the database first.');
      return;
    }
    
    const firstLead = leadsSnapshot.docs[0];
    const leadData = firstLead.data();
    console.log(`📋 Using lead: ${leadData.full_name} (ID: ${firstLead.id})`);
    
    // Test proposal data matching the interface
    const proposalData = {
      title: 'Test Proposal',
      title_lower: 'test proposal',
      description: 'This is a test proposal description',
      description_lower: 'this is a test proposal description',
      status: 'draft',
      amount: 50000,
      currency: 'USD',
      valid_until: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
      terms: 'Standard terms and conditions',
      sent_at: Timestamp.now(),
      search_keywords: ['test', 'proposal', 'service'],
      lead_id: firstLead.id,
      lead_name: leadData.full_name,
      lead_email: leadData.email,
      created_by: 'Test User'
    };
    
    console.log('📝 Proposal data:', proposalData);
    
    // Try to add the proposal
    const proposalsRef = collection(db, 'leads', firstLead.id, 'proposals');
    const docRef = await addDoc(proposalsRef, proposalData);
    
    console.log(`✅ Proposal created successfully with ID: ${docRef.id}`);
    
    // Verify the proposal was created
    const proposalsSnapshot = await getDocs(proposalsRef);
    console.log(`📊 Total proposals for this lead: ${proposalsSnapshot.size}`);
    
    // List all proposals
    proposalsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Proposal ID: ${doc.id}`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: ${data.amount ? `$${data.amount}` : 'N/A'}`);
      console.log(`   Created: ${data.sent_at ? (data.sent_at.toDate ? data.sent_at.toDate().toLocaleString() : new Date(data.sent_at).toLocaleString()) : 'N/A'}`);
      console.log('');
    });
    
    console.log('✅ Proposal creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Proposal creation test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the test
testProposalCreation();
