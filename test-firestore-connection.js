// Test script to verify Firestore connection and check data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

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

async function testFirestoreConnection() {
  try {
    console.log('\n🔍 Testing Firestore connection...');
    
    // Check existing leads
    const leadsRef = collection(db, 'leads');
    const leadsSnapshot = await getDocs(leadsRef);
    console.log(`📊 Found ${leadsSnapshot.size} leads in database`);
    
    if (leadsSnapshot.size > 0) {
      console.log('\n📋 First few leads:');
      leadsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   Name: ${data.full_name || data.first_name + ' ' + data.last_name}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Company: ${data.company || 'N/A'}`);
        console.log(`   Created: ${data.created_at ? (data.created_at.toDate ? data.created_at.toDate().toLocaleString() : new Date(data.created_at).toLocaleString()) : 'N/A'}`);
        console.log('');
      });
    }

    // Test adding a new lead
    console.log('🧪 Testing lead creation...');
    const testLead = {
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      full_name_lower: 'test user',
      email: 'test@example.com',
      email_lower: 'test@example.com',
      phone: '+1-555-0123',
      phone_digits: '15550123',
      company: 'Test Company',
      company_lower: 'test company',
      title: 'Test Title',
      status: 'new',
      stage: 'awareness',
      contract_value: 0,
      account_status: 'active',
      source: 'Test Source',
      created_at: new Date(),
      updated_at: new Date(),
      search_prefixes: ['test', 'user', 'test@example.com'],
      tags: [],
      notes: 'Test lead created by connection test',
      assigned_to: 'Test User',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      }
    };

    const docRef = await addDoc(leadsRef, testLead);
    console.log(`✅ Test lead created with ID: ${docRef.id}`);

    // Check activities for the first lead
    if (leadsSnapshot.size > 0) {
      const firstLead = leadsSnapshot.docs[0];
      console.log(`\n🔍 Checking activities for lead: ${firstLead.id}`);
      
      try {
        const activitiesRef = collection(db, 'leads', firstLead.id, 'activities');
        const activitiesSnapshot = await getDocs(activitiesRef);
        console.log(`📊 Found ${activitiesSnapshot.size} activities for this lead`);
        
        if (activitiesSnapshot.size > 0) {
          activitiesSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`${index + 1}. Activity ID: ${doc.id}`);
            console.log(`   Type: ${data.type}`);
            console.log(`   Subject: ${data.subject}`);
            console.log(`   Status: ${data.status}`);
            console.log(`   Created: ${data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : new Date(data.timestamp).toLocaleString()) : 'N/A'}`);
          });
        }
      } catch (error) {
        console.log('⚠️  Could not access activities:', error.message);
      }
    }

    console.log('\n✅ Firestore connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testFirestoreConnection();
