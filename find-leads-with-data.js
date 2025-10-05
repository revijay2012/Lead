// Find leads that actually have subcollections
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

async function findLeadsWithSubcollections() {
  try {
    console.log('\n🔍 Finding leads with subcollections...');
    
    // Get all leads
    const leadsRef = collection(db, 'leads');
    const leadsSnapshot = await getDocs(leadsRef);
    
    console.log(`📊 Total leads: ${leadsSnapshot.size}`);
    
    const leadsWithData = [];
    
    // Check first 20 leads for subcollections
    const leadsToCheck = leadsSnapshot.docs.slice(0, 20);
    
    for (const leadDoc of leadsToCheck) {
      const leadData = leadDoc.data();
      const leadId = leadDoc.id;
      
      try {
        // Check each subcollection
        const [activities, proposals, contracts] = await Promise.all([
          getDocs(collection(db, 'leads', leadId, 'activities')),
          getDocs(collection(db, 'leads', leadId, 'proposals')),
          getDocs(collection(db, 'leads', leadId, 'contracts'))
        ]);
        
        const totalSubcollections = activities.size + proposals.size + contracts.size;
        
        if (totalSubcollections > 0) {
          leadsWithData.push({
            id: leadId,
            name: `${leadData.first_name} ${leadData.last_name}`,
            email: leadData.email,
            activities: activities.size,
            proposals: proposals.size,
            contracts: contracts.size,
            total: totalSubcollections
          });
        }
        
        console.log(`✅ Checked ${leadData.first_name} ${leadData.last_name}: ${totalSubcollections} subcollections`);
        
      } catch (error) {
        console.log(`❌ Error checking ${leadData.first_name}:`, error.message);
      }
    }
    
    console.log(`\n📋 Leads with subcollections (${leadsWithData.length} found):`);
    leadsWithData.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name} (${lead.email})`);
      console.log(`   ID: ${lead.id}`);
      console.log(`   Activities: ${lead.activities}, Proposals: ${lead.proposals}, Contracts: ${lead.contracts}`);
      console.log(`   Total: ${lead.total} subcollections`);
      console.log('');
    });
    
    if (leadsWithData.length === 0) {
      console.log('❌ No leads found with subcollections in the first 20 leads.');
      console.log('Let me check the specific lead we know has data...');
      
      // Check the specific lead we know has data
      const specificLeadId = '08kCBk8vhBNCXOTddaU5';
      try {
        const [activities, proposals, contracts] = await Promise.all([
          getDocs(collection(db, 'leads', specificLeadId, 'activities')),
          getDocs(collection(db, 'leads', specificLeadId, 'proposals')),
          getDocs(collection(db, 'leads', specificLeadId, 'contracts'))
        ]);
        
        console.log(`\n🔍 Specific lead ${specificLeadId}:`);
        console.log(`Activities: ${activities.size}`);
        console.log(`Proposals: ${proposals.size}`);
        console.log(`Contracts: ${contracts.size}`);
        
        if (activities.size > 0 || proposals.size > 0 || contracts.size > 0) {
          const leadRef = collection(db, 'leads');
          const leadDoc = await getDocs(leadRef);
          const leadData = leadDoc.docs.find(doc => doc.id === specificLeadId)?.data();
          
          if (leadData) {
            console.log(`Lead: ${leadData.first_name} ${leadData.last_name} (${leadData.email})`);
          }
        }
      } catch (error) {
        console.log('❌ Error checking specific lead:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding leads with subcollections:', error);
  }
}

findLeadsWithSubcollections();
