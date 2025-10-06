import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, doc, connectFirestoreEmulator } from 'firebase/firestore';

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
  console.log('✅ Connected to Firestore emulator');
} catch (error) {
  console.log('⚠️  Emulator already connected or not available:', error.message);
}

async function testDrillDownQuery() {
  try {
    console.log('🧪 Testing drill-down query...');
    
    // Test parameters
    const monthYear = '2024-01';
    const status = 'qualified';
    
    const [year, month] = monthYear.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Import the query functions
    const { query, where, orderBy, getDocs } = await import('firebase/firestore');
    
    // Build query
    const leadsQuery = query(
      collection(db, 'leads'),
      where('status', '==', status),
      where('created_at', '>=', Timestamp.fromDate(startDate)),
      where('created_at', '<=', Timestamp.fromDate(endDate)),
      orderBy('created_at', 'desc')
    );
    
    console.log('📊 Executing query...');
    const snapshot = await getDocs(leadsQuery);
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${leads.length} leads with status "${status}" in ${monthYear}`);
    
    if (leads.length > 0) {
      console.log('Sample lead:', {
        id: leads[0].id,
        full_name: leads[0].full_name,
        company: leads[0].company,
        status: leads[0].status,
        created_at: leads[0].created_at?.toDate?.() || leads[0].created_at
      });
    }
    
    return leads;
    
  } catch (error) {
    console.error('❌ Error testing drill-down query:', error);
    throw error;
  }
}

// Run the test
testDrillDownQuery()
  .then((leads) => {
    console.log(`🎉 Test completed successfully! Found ${leads.length} leads.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
