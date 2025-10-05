// Test script to verify activity creation works
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

async function testActivityCreation() {
  try {
    console.log('\n🧪 Testing activity creation...');
    
    // First, get a lead to add activity to
    const leadsRef = collection(db, 'leads');
    const leadsSnapshot = await getDocs(leadsRef);
    
    if (leadsSnapshot.size === 0) {
      console.log('❌ No leads found. Please seed the database first.');
      return;
    }
    
    const firstLead = leadsSnapshot.docs[0];
    const leadData = firstLead.data();
    console.log(`📋 Using lead: ${leadData.full_name} (ID: ${firstLead.id})`);
    
    // Test activity data
    const activityData = {
      type: 'call',
      subject: 'Test Call',
      subject_lower: 'test call',
      notes: 'This is a test call activity',
      notes_lower: 'this is a test call activity',
      duration: 30,
      status: 'completed',
      priority: 'medium',
      outcome: 'Successful test call',
      timestamp: Timestamp.now(),
      search_keywords: ['test', 'call', 'activity'],
      lead_id: firstLead.id,
      lead_name: leadData.full_name,
      lead_email: leadData.email,
      created_by: 'Test User'
    };
    
    console.log('📝 Activity data:', activityData);
    
    // Try to add the activity
    const activitiesRef = collection(db, 'leads', firstLead.id, 'activities');
    const docRef = await addDoc(activitiesRef, activityData);
    
    console.log(`✅ Activity created successfully with ID: ${docRef.id}`);
    
    // Verify the activity was created
    const activitiesSnapshot = await getDocs(activitiesRef);
    console.log(`📊 Total activities for this lead: ${activitiesSnapshot.size}`);
    
    // List all activities
    activitiesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Activity ID: ${doc.id}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Subject: ${data.subject}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Created: ${data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : new Date(data.timestamp).toLocaleString()) : 'N/A'}`);
      console.log('');
    });
    
    console.log('✅ Activity creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Activity creation test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the test
testActivityCreation();
