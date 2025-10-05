const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  collectionGroup,
  query, 
  where, 
  orderBy, 
  startAt, 
  endAt, 
  limit,
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

async function testSubcollectionSearch() {
  console.log('🔍 Testing Subcollection Search Patterns\n');

  try {
    // 🔹 (A) Search Within One Lead's Subcollection
    console.log('📋 1. Search Within One Lead\'s Activities (prefix search)');
    
    // First, get a lead ID
    const leadsSnapshot = await getDocs(collection(db, 'leads'));
    if (leadsSnapshot.empty) {
      console.log('❌ No leads found. Please seed data first.');
      return;
    }
    
    const firstLead = leadsSnapshot.docs[0];
    const leadId = firstLead.id;
    console.log(`   Searching activities for lead: ${firstLead.data().full_name} (${leadId})`);
    
    // Search activities within this lead
    const activitiesQuery = query(
      collection(db, 'leads', leadId, 'activities'),
      orderBy('subject_lower'),
      startAt('call'),
      endAt('call\uf8ff')
    );
    
    const activitiesSnapshot = await getDocs(activitiesQuery);
    console.log(`   Found ${activitiesSnapshot.size} activities with "call" in subject:`);
    activitiesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.subject} (${data.type})`);
    });

    // 🔹 (B) Search Across All Leads — collectionGroup()
    console.log('\n📧 2. Global Search Across All Activities (collectionGroup)');
    
    const globalActivitiesQuery = query(
      collectionGroup(db, 'activities'),
      where('search_keywords', 'array-contains', 'call'),
      limit(5)
    );
    
    const globalSnapshot = await getDocs(globalActivitiesQuery);
    console.log(`   Found ${globalSnapshot.size} activities across all leads with "call" keyword:`);
    globalSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.subject} (Lead: ${data.lead_name})`);
    });

    // 🔹 (C) Search by Reference to Parent Lead
    console.log('\n📞 3. Search Activities by Lead Email');
    
    const leadEmail = firstLead.data().email;
    const emailQuery = query(
      collectionGroup(db, 'activities'),
      where('lead_email', '==', leadEmail)
    );
    
    const emailSnapshot = await getDocs(emailQuery);
    console.log(`   Found ${emailSnapshot.size} activities for lead with email ${leadEmail}:`);
    emailSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.subject} (${data.type})`);
    });

    // 🔹 (D) Search Proposals
    console.log('\n📄 4. Search Proposals (prefix search on title)');
    
    const proposalsQuery = query(
      collectionGroup(db, 'proposals'),
      orderBy('title_lower'),
      startAt('service'),
      endAt('service\uf8ff'),
      limit(5)
    );
    
    const proposalsSnapshot = await getDocs(proposalsQuery);
    console.log(`   Found ${proposalsSnapshot.size} proposals with "service" in title:`);
    proposalsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.title} (${data.status}, Lead: ${data.lead_name})`);
    });

    // 🔹 (E) Search Contracts
    console.log('\n📋 5. Search Contracts (array-contains on keywords)');
    
    const contractsQuery = query(
      collectionGroup(db, 'contracts'),
      where('search_keywords', 'array-contains', 'agreement'),
      limit(5)
    );
    
    const contractsSnapshot = await getDocs(contractsQuery);
    console.log(`   Found ${contractsSnapshot.size} contracts with "agreement" keyword:`);
    contractsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.title} (${data.status}, Lead: ${data.lead_name})`);
    });

    // 🔹 (F) Multi-field Search Example
    console.log('\n🎯 6. Multi-field Search (type + keywords)');
    
    const multiFieldQuery = query(
      collectionGroup(db, 'activities'),
      where('type', '==', 'call'),
      where('search_keywords', 'array-contains', 'follow'),
      limit(5)
    );
    
    const multiFieldSnapshot = await getDocs(multiFieldQuery);
    console.log(`   Found ${multiFieldSnapshot.size} call activities with "follow" keyword:`);
    multiFieldSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.subject} (Lead: ${data.lead_name})`);
    });

    // 🔹 (G) Search Index Collection
    console.log('\n📊 7. Search Index Collection Query');
    
    const searchIndexQuery = query(
      collection(db, 'search_index'),
      where('keywords', 'array-contains', 'demo'),
      limit(5)
    );
    
    const searchIndexSnapshot = await getDocs(searchIndexQuery);
    console.log(`   Found ${searchIndexSnapshot.size} entries in search_index with "demo" keyword:`);
    searchIndexSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.entity}: ${data.lead_name || data.title || data.subject}`);
    });

    console.log('\n✅ Subcollection search tests completed!');
    
  } catch (error) {
    console.error('❌ Error running subcollection search tests:', error);
    
    // Provide helpful error messages
    if (error.code === 'failed-precondition') {
      console.log('\n💡 This error usually means you need to create composite indexes in Firestore.');
      console.log('   Go to Firebase Console → Firestore → Indexes → Composite Indexes');
      console.log('   Create indexes for the fields you\'re querying.');
    }
  }
}

// Run the tests
testSubcollectionSearch();
