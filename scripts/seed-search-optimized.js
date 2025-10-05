import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, connectFirestoreEmulator, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration for emulator
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

// Connect to Firestore emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('Connected to Firestore emulator');
} catch (error) {
  console.log('Emulator already connected or not available');
}

// Sample data generators
const firstNames = [
  'Sophia', 'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William',
  'Amelia', 'James', 'Isabella', 'Benjamin', 'Mia', 'Lucas', 'Evelyn', 'Henry', 'Harper', 'Alexander',
  'Camila', 'Mason', 'Gianna', 'Michael', 'Abigail', 'Ethan', 'Luna', 'Daniel', 'Ella', 'Jacob',
  'Elizabeth', 'Logan', 'Sofia', 'Jackson', 'Emily', 'Levi', 'Avery', 'Sebastian', 'Mila', 'Mateo',
  'Scarlett', 'Jack', 'Eleanor', 'Owen', 'Madison', 'Theodore', 'Layla', 'Aiden', 'Penelope', 'Samuel'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const companies = [
  'Acme Corp', 'Tech Solutions Inc', 'Global Dynamics', 'Innovation Labs', 'Alpha Systems',
  'Beta Technologies', 'Gamma Corp', 'Delta Enterprises', 'Epsilon Solutions', 'Zeta Systems',
  'Eta Industries', 'Theta Technologies', 'Iota Systems', 'Kappa Corp', 'Lambda Solutions',
  'Mu Technologies', 'Nu Systems', 'Xi Corp', 'Omicron Solutions', 'Pi Systems', 'Rho Technologies',
  'Sigma Corp', 'Tau Systems', 'Upsilon Solutions', 'Phi Technologies', 'Chi Systems',
  'Psi Corp', 'Omega Solutions', 'Alpha Dynamics', 'Beta Innovations'
];

const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const stages = ['awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase'];

// Subcollection generators
function generateStatusHistory(currentStatus) {
  const statusHistory = [
    { status: 'new', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), notes: 'Lead created' }
  ];
  
  if (currentStatus !== 'new') {
    statusHistory.push({
      status: currentStatus,
      timestamp: new Date(),
      notes: `Status updated to ${currentStatus}`
    });
  }
  
  return statusHistory[0];
}

function generateActivity() {
  const activityTypes = ['call', 'email', 'meeting', 'note', 'task'];
  const subjects = [
    'Initial contact made',
    'Follow-up call scheduled',
    'Product demo completed',
    'Proposal sent',
    'Contract negotiation',
    'Meeting notes',
    'Task assigned',
    'Status update'
  ];
  
  const subject = getRandomElement(subjects);
  const notes = `Activity details for ${subject.toLowerCase()}`;
  const type = getRandomElement(activityTypes);
  
  const activity = {
    type: type,
    subject: subject,
    subject_lower: subject.toLowerCase(),
    notes: notes,
    notes_lower: notes.toLowerCase(),
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    assigned_to: getRandomElement(['John Doe', 'Jane Smith', 'Mike Johnson'])
  };

  // Generate search keywords from subject and notes
  activity.search_keywords = generateSearchKeywords(subject + ' ' + notes);
  
  return activity;
}

function generateProposal() {
  const proposalTypes = ['service', 'product', 'consulting', 'maintenance'];
  const type = getRandomElement(proposalTypes);
  const title = `${type} Proposal`;
  const description = `Detailed proposal for ${type} services`;
  
  const proposal = {
    title: title,
    title_lower: title.toLowerCase(),
    description: description,
    description_lower: description.toLowerCase(),
    value: Math.floor(Math.random() * 50000) + 10000,
    status: getRandomElement(['draft', 'sent', 'accepted', 'rejected']),
    created_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  // Generate search keywords
  proposal.search_keywords = generateSearchKeywords(title + ' ' + description);
  
  return proposal;
}

function generateContract() {
  const type = getRandomElement(['service', 'product', 'maintenance']);
  const title = `${type} Agreement`;
  const terms = 'Standard service agreement terms and conditions';
  
  const contract = {
    title: title,
    title_lower: title.toLowerCase(),
    type: type,
    status: getRandomElement(['active', 'pending', 'expired']),
    start_date: new Date(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    value: Math.floor(Math.random() * 100000) + 25000,
    terms: terms,
    terms_lower: terms.toLowerCase()
  };

  // Generate search keywords
  contract.search_keywords = generateSearchKeywords(title + ' ' + terms);
  
  return contract;
}

function generateAuditLog(leadData) {
  return {
    action: 'lead_created',
    details: `Lead ${leadData.first_name} ${leadData.last_name} was created`,
    timestamp: new Date(),
    user: getRandomElement(['system', 'admin', 'user'])
  };
}

function generateVersion(leadData) {
  return {
    version: '1.0',
    changes: 'Initial lead creation',
    timestamp: new Date(),
    data: {
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      email: leadData.email,
      status: leadData.status
    }
  };
}

// Generate random data
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateLeadId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `L-${year}${month}${day}-${random}`;
}

// 🔧 4. Prefix Generator (Core Algorithm)
function generatePrefixes(str, maxLen = 15) {
  if (!str) return [];
  str = str.toLowerCase().replace(/[^a-z0-9@.]/g, '');
  const tokens = [];
  for (let i = 1; i <= Math.min(str.length, maxLen); i++) {
    tokens.push(str.slice(0, i));
  }
  return tokens;
}

// Generate search keywords for subcollections
function generateSearchKeywords(text) {
  if (!text) return [];
  
  // Clean and split text into words
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Only words longer than 2 characters
  
  // Generate prefixes for each word
  const keywords = new Set();
  
  words.forEach(word => {
    // Add full word
    keywords.add(word);
    
    // Add prefixes for longer words
    for (let i = 3; i <= Math.min(word.length, 8); i++) {
      keywords.add(word.slice(0, i));
    }
  });
  
  return Array.from(keywords);
}

// Build search prefixes for a lead
function buildSearchPrefixes(leadData) {
  const first = (leadData.first_name || '').toLowerCase();
  const last = (leadData.last_name || '').toLowerCase();
  const full = `${first} ${last}`.trim();
  const email = (leadData.email || '').toLowerCase();
  const phone = (leadData.phone || '').replace(/\D/g, '');

  const prefixes = new Set([
    ...generatePrefixes(first),
    ...generatePrefixes(last),
    ...generatePrefixes(full),
    ...generatePrefixes(email),
    ...generatePrefixes(phone)
  ]);

  // Add company prefixes too
  const company = (leadData.company || '').toLowerCase();
  prefixes.add(...generatePrefixes(company));

  return Array.from(prefixes);
}

function generateLead() {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const company = getRandomElement(companies);
  const status = getRandomElement(statuses);
  const stage = getRandomElement(stages);
  const contractValue = Math.floor(Math.random() * 500000) + 10000;
  
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`;
  const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  const leadData = {
    lead_id: generateLeadId(),
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    email: email,
    phone: phone,
    company: company,
    title: getRandomElement(['CEO', 'CTO', 'VP Sales', 'Director', 'Manager', 'Engineer', 'Analyst', 'Consultant']),
    status: status,
    stage: stage,
    contract_value: contractValue,
    created_at: new Date(),
    updated_at: new Date(),
    source: getRandomElement(['website', 'referral', 'cold_call', 'trade_show', 'social_media', 'email_campaign', 'linkedin', 'google_ads']),
    tags: getRandomElement([
      ['enterprise', 'premium', 'active'],
      ['startup', 'growth', 'innovative'],
      ['enterprise', 'established', 'renewal'],
      ['startup', 'innovative', 'fast-growing'],
      ['enterprise', 'global', 'strategic'],
      ['mid-market', 'expansion', 'digital'],
      ['enterprise', 'security', 'compliance']
    ]),
    notes: `Initial contact with ${firstName} from ${company}. ${getRandomElement([
      'Very interested in our premium package.',
      'Looking for enterprise solution with security focus.',
      'Budget approved for Q1 implementation.',
      'Decision maker identified - technical evaluation in progress.',
      'Competitor evaluation phase - strong interest shown.',
      'Pilot program discussion underway.',
      'Custom solution requirements identified.'
    ])}`,
    address: {
      street: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main', 'Oak', 'Pine', 'Elm', 'Cedar', 'Maple'])} St`,
      city: getRandomElement(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']),
      state: getRandomElement(['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC']),
      zip: `${Math.floor(Math.random() * 90000) + 10000}`,
      country: 'USA'
    }
  };

  // 🧠 3. Add normalized fields for easy range queries
  leadData.first_name_lower = firstName.toLowerCase();
  leadData.last_name_lower = lastName.toLowerCase();
  leadData.full_name_lower = leadData.full_name.toLowerCase();
  leadData.email_lower = email.toLowerCase();
  leadData.phone_digits = phone.replace(/\D/g, '');
  leadData.company_lower = company.toLowerCase();

  // 🔧 Build search prefixes
  leadData.search_prefixes = buildSearchPrefixes(leadData);

  return leadData;
}

// Generate search index document (optional separate collection)
function generateSearchIndex(leadData) {
  return {
    lead_id: leadData.lead_id,
    full_name_lower: leadData.full_name_lower,
    email_lower: leadData.email_lower,
    phone_digits: leadData.phone_digits,
    company_lower: leadData.company_lower,
    search_prefixes: leadData.search_prefixes,
    status: leadData.status,
    stage: leadData.stage,
    contract_value: leadData.contract_value,
    tags: leadData.tags,
    created_at: leadData.created_at,
    updated_at: leadData.updated_at
  };
}

// Main function to load search-optimized data
async function loadSearchOptimizedData() {
  console.log('🚀 Starting to load search-optimized lead data...');
  console.log('🔍 Implementing prefix-based partial text search architecture');
  
  const batchSize = 50;
  const totalRecords = 500; // Increased for better search testing
  
  try {
    for (let batch = 0; batch < Math.ceil(totalRecords / batchSize); batch++) {
      console.log(`Processing batch ${batch + 1}/${Math.ceil(totalRecords / batchSize)}...`);
      
      const batchPromises = [];
      for (let i = 0; i < batchSize && (batch * batchSize + i) < totalRecords; i++) {
        const leadData = generateLead();
        
        // Create the main lead document
        const leadDocRef = doc(collection(db, 'leads'));
        batchPromises.push(setDoc(leadDocRef, leadData).then(async () => {
          const leadId = leadDocRef.id;
          
          // Create subcollections
          const subcollectionPromises = [];
          
          // Status History
          subcollectionPromises.push(
            addDoc(collection(leadDocRef, 'status_history'), generateStatusHistory(leadData.status))
          );
          
          // Activities (2-3 activities per lead)
          const numActivities = Math.floor(Math.random() * 2) + 2;
          for (let j = 0; j < numActivities; j++) {
            const activity = generateActivity();
            // Add parent lead information for global search
            activity.lead_id = leadId;
            activity.lead_name = leadData.full_name;
            activity.lead_email = leadData.email;
            subcollectionPromises.push(
              addDoc(collection(leadDocRef, 'activities'), activity)
            );
          }
          
          // Proposals (1-2 proposals per lead)
          const numProposals = Math.floor(Math.random() * 2) + 1;
          for (let j = 0; j < numProposals; j++) {
            const proposal = generateProposal();
            // Add parent lead information for global search
            proposal.lead_id = leadId;
            proposal.lead_name = leadData.full_name;
            proposal.lead_email = leadData.email;
            subcollectionPromises.push(
              addDoc(collection(leadDocRef, 'proposals'), proposal)
            );
          }
          
          // Contracts (1 contract per lead)
          const contract = generateContract();
          // Add parent lead information for global search
          contract.lead_id = leadId;
          contract.lead_name = leadData.full_name;
          contract.lead_email = leadData.email;
          subcollectionPromises.push(
            addDoc(collection(leadDocRef, 'contracts'), contract)
          );
          
          // Audit Log
          subcollectionPromises.push(
            addDoc(collection(leadDocRef, 'audit_log'), generateAuditLog(leadData))
          );
          
          // Versions
          subcollectionPromises.push(
            addDoc(collection(leadDocRef, 'versions'), generateVersion(leadData))
          );
          
          await Promise.all(subcollectionPromises);
          
          // 🧩 8. Create search index document (optional separate collection for large datasets)
          const searchIndexData = generateSearchIndex(leadData);
          return setDoc(doc(collection(db, 'search_index'), leadId), searchIndexData);
        }));
      }
      
      await Promise.all(batchPromises);
      console.log(`✅ Batch ${batch + 1} completed (${Math.min(batchSize, totalRecords - batch * batchSize)} search-optimized leads with subcollections loaded)`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Successfully loaded search-optimized lead data with subcollections!');
    console.log('\n📊 Data structure implemented:');
    console.log('  - Main leads collection with 500 documents');
    console.log('  - Subcollections: status_history, activities, proposals, contracts, audit_log, versions');
    console.log('  - Search index collection with 500 documents');
    console.log('  - Normalized fields: full_name_lower, email_lower, phone_digits, company_lower');
    console.log('  - Search prefixes array for partial text matching');
    console.log('  - Optimized for prefix-based range queries');
    
    console.log('\n🔎 Query patterns available:');
    console.log('  - Prefix search: .orderBy().startAt().endAt()');
    console.log('  - Array fallback: .where("search_prefixes", "array-contains")');
    console.log('  - Combined filters: status + prefix search');
    console.log('  - Search index collection for large-scale queries');
    
    console.log('\n🌐 View in Firebase Emulator UI: http://127.0.0.1:4002/firestore');
    
  } catch (error) {
    console.error('❌ Error loading search-optimized data:', error);
  }
}

// Run the script
loadSearchOptimizedData();
