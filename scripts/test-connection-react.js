import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'demo-no-project',
  authDomain: 'demo-no-project.firebaseapp.com',
  storageBucket: 'demo-no-project.appspot.com'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('✅ Connected to Firestore emulator for React test');
} catch (error) {
  console.log('⚠️  Emulator already connected or not available:', error.message);
}

async function testReactConnection() {
  try {
    console.log('🧪 Testing React-style connection...');
    
    // Test a simple query
    const leadsQuery = query(collection(db, 'leads'), where('status', '==', 'qualified'));
    const snapshot = await getDocs(leadsQuery);
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${leads.length} qualified leads total`);
    
    if (leads.length > 0) {
      console.log('Sample qualified lead:', {
        id: leads[0].id,
        full_name: leads[0].full_name,
        company: leads[0].company,
        status: leads[0].status
      });
    }
    
    return leads;
    
  } catch (error) {
    console.error('❌ Error testing React connection:', error);
    throw error;
  }
}

// Run the test
testReactConnection()
  .then((leads) => {
    console.log(`🎉 React connection test completed! Found ${leads.length} qualified leads.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 React connection test failed:', error);
    process.exit(1);
  });
