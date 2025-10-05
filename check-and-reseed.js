// Check current data and reseed to ensure subcollections show properly
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator, writeBatch, doc } from 'firebase/firestore';

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

async function checkAndReseed() {
  try {
    console.log('\n🔍 Checking current data...');
    
    // Check a few specific leads
    const testLeadIds = [
      '08kCBk8vhBNCXOTddaU5', // Penelope Hernandez
      '06UXTI6x0HPTUEfGzM7O', // Eleanor Wright
      '0LjQcgzjGd3zxSoVkkOF'  // Luna Lee
    ];
    
    for (const leadId of testLeadIds) {
      console.log(`\n📋 Checking lead ${leadId}:`);
      
      try {
        const [activities, proposals, contracts] = await Promise.all([
          getDocs(collection(db, 'leads', leadId, 'activities')),
          getDocs(collection(db, 'leads', leadId, 'proposals')),
          getDocs(collection(db, 'leads', leadId, 'contracts'))
        ]);
        
        console.log(`  Activities: ${activities.size}`);
        console.log(`  Proposals: ${proposals.size}`);
        console.log(`  Contracts: ${contracts.size}`);
        
        // Show some sample data
        if (activities.size > 0) {
          const firstActivity = activities.docs[0].data();
          console.log(`  Sample Activity: ${firstActivity.subject} (${firstActivity.type})`);
        }
        
        if (proposals.size > 0) {
          const firstProposal = proposals.docs[0].data();
          console.log(`  Sample Proposal: ${firstProposal.title} (${firstProposal.status})`);
        }
        
        if (contracts.size > 0) {
          const firstContract = contracts.docs[0].data();
          console.log(`  Sample Contract: ${firstContract.title || 'Untitled'} (${firstContract.status})`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error checking lead ${leadId}:`, error.message);
      }
    }
    
    // If we don't have enough data, let's add some sample subcollections
    console.log('\n🌱 Adding sample subcollections if needed...');
    
    const sampleLeadId = '08kCBk8vhBNCXOTddaU5'; // Penelope Hernandez
    
    // Check if this lead has subcollections
    const [existingActivities, existingProposals, existingContracts] = await Promise.all([
      getDocs(collection(db, 'leads', sampleLeadId, 'activities')),
      getDocs(collection(db, 'leads', sampleLeadId, 'proposals')),
      getDocs(collection(db, 'leads', sampleLeadId, 'contracts'))
    ]);
    
    if (existingActivities.size === 0) {
      console.log('Adding sample activities...');
      const batch = writeBatch(db);
      
      const activities = [
        {
          type: 'call',
          subject: 'Initial consultation call',
          notes: 'Discussed project requirements and timeline',
          status: 'completed',
          priority: 'high',
          duration: 45,
          outcome: 'Positive response, interested in proposal',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          search_keywords: ['call', 'consultation', 'requirements', 'timeline'],
          lead_id: sampleLeadId,
          lead_name: 'Penelope Hernandez',
          lead_email: 'penelope.hernandez@epsilonsolutions.com',
          created_by: 'John Doe'
        },
        {
          type: 'email',
          subject: 'Follow-up email with proposal',
          notes: 'Sent detailed proposal document for review',
          status: 'completed',
          priority: 'medium',
          outcome: 'Proposal delivered successfully',
          timestamp: new Date('2024-01-16T14:30:00Z'),
          search_keywords: ['email', 'proposal', 'follow-up', 'review'],
          lead_id: sampleLeadId,
          lead_name: 'Penelope Hernandez',
          lead_email: 'penelope.hernandez@epsilonsolutions.com',
          created_by: 'Jane Smith'
        },
        {
          type: 'meeting',
          subject: 'Project kickoff meeting',
          notes: 'Finalized project scope and signed contract',
          status: 'completed',
          priority: 'high',
          duration: 60,
          outcome: 'Contract signed, project approved',
          timestamp: new Date('2024-01-20T09:00:00Z'),
          search_keywords: ['meeting', 'kickoff', 'scope', 'contract'],
          lead_id: sampleLeadId,
          lead_name: 'Penelope Hernandez',
          lead_email: 'penelope.hernandez@epsilonsolutions.com',
          created_by: 'Mike Johnson'
        }
      ];
      
      activities.forEach(activity => {
        const docRef = doc(collection(db, 'leads', sampleLeadId, 'activities'));
        batch.set(docRef, activity);
      });
      
      await batch.commit();
      console.log('✅ Added 3 sample activities');
    }
    
    if (existingProposals.size === 0) {
      console.log('Adding sample proposals...');
      const batch = writeBatch(db);
      
      const proposals = [
        {
          title: 'Epsilon Solutions Website Redesign',
          description: 'Complete website redesign with modern UI/UX',
          status: 'accepted',
          value: 25000,
          currency: 'USD',
          created_at: new Date('2024-01-16T14:30:00Z'),
          valid_until: new Date('2024-02-16T14:30:00Z'),
          search_keywords: ['website', 'redesign', 'ui', 'ux'],
          lead_id: sampleLeadId,
          lead_name: 'Penelope Hernandez',
          lead_email: 'penelope.hernandez@epsilonsolutions.com',
          created_by: 'Jane Smith'
        }
      ];
      
      proposals.forEach(proposal => {
        const docRef = doc(collection(db, 'leads', sampleLeadId, 'proposals'));
        batch.set(docRef, proposal);
      });
      
      await batch.commit();
      console.log('✅ Added 1 sample proposal');
    }
    
    if (existingContracts.size === 0) {
      console.log('Adding sample contracts...');
      const batch = writeBatch(db);
      
      const contracts = [
        {
          title: 'Epsilon Solutions Development Contract',
          type: 'development',
          status: 'active',
          start_date: new Date('2024-01-21T00:00:00Z'),
          end_date: new Date('2024-06-21T00:00:00Z'),
          value: 25000,
          currency: 'USD',
          terms: 'Payment in 3 installments: 40% upfront, 30% at milestone, 30% on completion',
          search_keywords: ['development', 'contract', 'payment', 'installments'],
          lead_id: sampleLeadId,
          lead_name: 'Penelope Hernandez',
          lead_email: 'penelope.hernandez@epsilonsolutions.com',
          created_by: 'Mike Johnson'
        }
      ];
      
      contracts.forEach(contract => {
        const docRef = doc(collection(db, 'leads', sampleLeadId, 'contracts'));
        batch.set(docRef, contract);
      });
      
      await batch.commit();
      console.log('✅ Added 1 sample contract');
    }
    
    console.log('\n✅ Data check and reseed completed!');
    console.log('Now try opening Penelope Hernandez in the form - you should see the subcollections.');
    
  } catch (error) {
    console.error('❌ Error checking and reseeding data:', error);
  }
}

checkAndReseed();
