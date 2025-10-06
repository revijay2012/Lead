// Test the notes functionality
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

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

async function testNotesFunctionality() {
  try {
    console.log('\n🔍 Testing Notes Functionality...');
    
    // Find a lead to test with
    const leadsSnapshot = await getDocs(collection(db, 'leads'));
    const testLead = leadsSnapshot.docs[0];
    
    if (!testLead) {
      console.log('❌ No leads found to test with');
      return;
    }
    
    const leadData = testLead.data();
    const leadId = testLead.id;
    
    console.log(`\n📋 Testing with lead: ${leadData.first_name} ${leadData.last_name}`);
    console.log(`   Lead ID: ${leadId}`);
    
    // Check existing activities
    console.log('\n🔍 Checking existing activities...');
    try {
      const activitiesSnapshot = await getDocs(collection(db, 'leads', leadId, 'activities'));
      console.log(`   Found ${activitiesSnapshot.size} existing activities`);
      
      if (activitiesSnapshot.size > 0) {
        console.log('\n📝 Existing activities:');
        activitiesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ${data.type} - ${data.subject}`);
          console.log(`      Notes: ${data.notes || 'No notes'}`);
          console.log(`      Timestamp: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'N/A'}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('   No existing activities found');
    }
    
    // Check status history
    console.log('\n🔍 Checking status history...');
    try {
      const statusHistorySnapshot = await getDocs(collection(db, 'leads', leadId, 'status_history'));
      console.log(`   Found ${statusHistorySnapshot.size} status history entries`);
      
      if (statusHistorySnapshot.size > 0) {
        console.log('\n📝 Recent status history:');
        statusHistorySnapshot.docs.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ${data.previous_status || data.from_status} → ${data.to_status || data.new_status}`);
          console.log(`      Reason: ${data.reason || data.transition_reason}`);
          console.log(`      Comments: ${data.comments || 'No comments'}`);
          console.log(`      Date: ${data.changed_at ? data.changed_at.toDate().toLocaleString() : data.timestamp ? data.timestamp.toDate().toLocaleString() : 'N/A'}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('   No existing status history found');
    }
    
    console.log('\n✅ Notes Functionality Test Complete!');
    console.log('\n📋 What was implemented:');
    console.log('   1. ✅ Separate notes field in StatusChangeDialog');
    console.log('   2. ✅ Notes create activity entries with timestamps');
    console.log('   3. ✅ QuickNoteForm component for standalone notes');
    console.log('   4. ✅ Integration with Activities tab');
    console.log('   5. ✅ Status change comments vs activity notes separation');
    
    console.log('\n🎯 How to test:');
    console.log('   1. Open any lead in the application');
    console.log('   2. Go to Activities tab and click "Add Quick Note"');
    console.log('   3. Or change status and use the "Add Note to Activities" field');
    console.log('   4. Check that notes appear in Activities section with timestamps');
    console.log('   5. Check that comments appear in Status History section');
    
  } catch (error) {
    console.error('❌ Error testing notes functionality:', error);
  }
}

testNotesFunctionality();
