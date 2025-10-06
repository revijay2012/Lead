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

// Sample data patterns
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley',
  'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel', 'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Donna',
  'Mark', 'Lisa', 'Donald', 'Nancy', 'Steven', 'Betty', 'Paul', 'Helen', 'Andrew', 'Sandra',
  'Joshua', 'Donna', 'Kenneth', 'Carol', 'Kevin', 'Ruth', 'Brian', 'Sharon', 'George', 'Michelle',
  'Edward', 'Laura', 'Ronald', 'Sarah', 'Timothy', 'Kimberly', 'Jason', 'Deborah', 'Jeffrey', 'Dorothy'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const companies = [
  'TechCorp Solutions', 'Global Innovations Inc', 'Digital Dynamics', 'Future Systems', 'CloudTech Enterprises',
  'DataVision Corp', 'Innovation Labs', 'Smart Solutions', 'NextGen Technologies', 'CyberCore Systems',
  'Quantum Computing', 'AI Solutions Ltd', 'Blockchain Innovations', 'RoboTech Industries', 'Virtual Reality Corp',
  'Machine Learning Inc', 'Big Data Analytics', 'Cloud Infrastructure', 'Mobile Solutions', 'Web Development Co',
  'Software Engineering', 'IT Consulting', 'Digital Marketing', 'E-commerce Solutions', 'Business Intelligence',
  'Enterprise Software', 'Startup Ventures', 'FinTech Innovations', 'HealthTech Systems', 'EdTech Solutions'
];

const titles = [
  'CEO', 'CTO', 'VP of Engineering', 'VP of Sales', 'VP of Marketing', 'VP of Operations', 'VP of Finance',
  'Director of Technology', 'Director of Sales', 'Director of Marketing', 'Director of Operations',
  'Engineering Manager', 'Sales Manager', 'Marketing Manager', 'Product Manager', 'Project Manager',
  'Senior Developer', 'Lead Developer', 'Software Engineer', 'Data Scientist', 'DevOps Engineer',
  'Business Analyst', 'Sales Representative', 'Marketing Specialist', 'Operations Manager', 'Finance Manager'
];

const sources = [
  'Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Partner',
  'LinkedIn', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'SEO', 'Webinar', 'Conference',
  'Industry Publication', 'Networking Event', 'Previous Client', 'Vendor Referral', 'Employee Referral'
];

const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];

const statusProbabilities = {
  'new': 0.4,
  'contacted': 0.3,
  'qualified': 0.15,
  'proposal': 0.08,
  'negotiation': 0.04,
  'closed-won': 0.02,
  'closed-lost': 0.01
};

// Subcollection data patterns
const activityTypes = ['call', 'email', 'meeting', 'note', 'task'];
const activitySubjects = [
  'Initial contact call', 'Follow-up email', 'Product demo meeting', 'Proposal discussion', 'Contract negotiation',
  'Technical requirements review', 'Budget discussion', 'Implementation planning', 'Stakeholder meeting', 'Status update call',
  'Objection handling', 'Reference check', 'Final presentation', 'Contract signing', 'Project kickoff'
];

const activityNotes = [
  'Discussed project requirements and timeline', 'Client showed strong interest in our solution',
  'Need to follow up on pricing questions', 'Technical team will review requirements',
  'Waiting for budget approval from management', 'Client requested additional information',
  'Scheduled next meeting for next week', 'Proposal sent and awaiting response',
  'Contract terms under review', 'Implementation timeline discussed'
];

const proposalStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
const contractStatuses = ['active', 'expired', 'pending', 'cancelled'];

const proposalTitles = [
  'Enterprise Software Implementation', 'Cloud Migration Services', 'Digital Transformation Project',
  'Custom Development Solution', 'IT Infrastructure Upgrade', 'Data Analytics Platform',
  'Mobile Application Development', 'Security Assessment & Implementation', 'Process Automation',
  'Integration Services', 'Consulting Services', 'Support & Maintenance'
];

// Generate search prefixes for better search performance
function generateSearchPrefixes(text) {
  if (!text) return [];
  const prefixes = new Set();
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalizedText.split(/\s+/).filter(word => word.length > 0);

  words.forEach(word => {
    for (let i = 1; i <= word.length; i++) {
      prefixes.add(word.substring(0, i));
    }
  });
  return Array.from(prefixes);
}

// Generate a random date within a given range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate a random phone number
function generatePhoneNumber() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

// Generate a random email
function generateEmail(firstName, lastName, company) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];
  const companyDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const domain = Math.random() < 0.3 ? companyDomain : domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Generate contract value based on status
function generateContractValue(status) {
  const baseValues = {
    'new': [5000, 25000],
    'contacted': [8000, 35000],
    'qualified': [15000, 75000],
    'proposal': [25000, 150000],
    'negotiation': [40000, 250000],
    'closed-won': [50000, 500000],
    'closed-lost': [10000, 100000]
  };
  
  const [min, max] = baseValues[status] || [5000, 25000];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate activity data
function generateActivity(leadId, leadName, leadEmail, createdDate) {
  const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  const subject = activitySubjects[Math.floor(Math.random() * activitySubjects.length)];
  const notes = activityNotes[Math.floor(Math.random() * activityNotes.length)];
  const outcome = Math.random() < 0.7 ? 'completed' : 'pending';
  
  // Generate activity date within 30 days of lead creation
  const activityDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
  
  const searchKeywords = [
    activityType, subject.toLowerCase(), notes.toLowerCase(),
    leadName.toLowerCase(), leadEmail.toLowerCase()
  ].join(' ').split(' ').filter(word => word.length > 2);
  
  return {
    activity_id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lead_id: leadId,
    lead_name: leadName,
    lead_email: leadEmail,
    type: activityType,
    subject: subject,
    subject_lower: subject.toLowerCase(),
    notes: notes,
    notes_lower: notes.toLowerCase(),
    outcome: outcome,
    timestamp: Timestamp.fromDate(activityDate),
    created_by: 'Current User',
    search_keywords: searchKeywords
  };
}

// Generate proposal data
function generateProposal(leadId, leadName, leadEmail, createdDate, contractValue) {
  const title = proposalTitles[Math.floor(Math.random() * proposalTitles.length)];
  const status = proposalStatuses[Math.floor(Math.random() * proposalStatuses.length)];
  const value = Math.floor(contractValue * (0.8 + Math.random() * 0.4)); // 80-120% of contract value
  
  // Generate proposal date after lead creation
  const proposalDate = new Date(createdDate.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000);
  
  const searchKeywords = [
    'proposal', title.toLowerCase(), status,
    leadName.toLowerCase(), leadEmail.toLowerCase()
  ].join(' ').split(' ').filter(word => word.length > 2);
  
  return {
    proposal_id: `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lead_id: leadId,
    lead_name: leadName,
    lead_email: leadEmail,
    title: title,
    description: `Comprehensive proposal for ${title} including implementation timeline and cost breakdown`,
    value: value,
    status: status,
    sent_at: Timestamp.fromDate(proposalDate),
    created_at: Timestamp.fromDate(proposalDate),
    search_keywords: searchKeywords
  };
}

// Generate contract data
function generateContract(leadId, leadName, leadEmail, createdDate, contractValue) {
  const title = proposalTitles[Math.floor(Math.random() * proposalTitles.length)];
  const status = contractStatuses[Math.floor(Math.random() * contractStatuses.length)];
  const value = contractValue;
  
  // Generate contract date after proposal
  const contractDate = new Date(createdDate.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000);
  
  const searchKeywords = [
    'contract', title.toLowerCase(), status,
    leadName.toLowerCase(), leadEmail.toLowerCase()
  ].join(' ').split(' ').filter(word => word.length > 2);
  
  return {
    contract_id: `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lead_id: leadId,
    lead_name: leadName,
    lead_email: leadEmail,
    title: title,
    description: `Service contract for ${title} with terms and conditions`,
    value: value,
    status: status,
    start_date: Timestamp.fromDate(contractDate),
    end_date: Timestamp.fromDate(new Date(contractDate.getTime() + 365 * 24 * 60 * 60 * 1000)), // 1 year contract
    created_at: Timestamp.fromDate(contractDate),
    search_keywords: searchKeywords
  };
}

// Generate a single lead
function generateLead(date) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const title = titles[Math.floor(Math.random() * titles.length)];
  const source = sources[Math.floor(Math.random() * sources.length)];
  
  // Weighted random status selection
  const random = Math.random();
  let cumulative = 0;
  let selectedStatus = 'new';
  for (const [status, probability] of Object.entries(statusProbabilities)) {
    cumulative += probability;
    if (random <= cumulative) {
      selectedStatus = status;
      break;
    }
  }
  
  const fullName = `${firstName} ${lastName}`;
  const email = generateEmail(firstName, lastName, company);
  const phone = generatePhoneNumber();
  const phoneDigits = phone.replace(/\D/g, '');
  const contractValue = generateContractValue(selectedStatus);
  
  // Generate search prefixes
  const searchPrefixes = [
    ...generateSearchPrefixes(fullName),
    ...generateSearchPrefixes(email),
    ...generateSearchPrefixes(phone),
    ...generateSearchPrefixes(company)
  ];
  
  const leadData = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    full_name_lower: fullName.toLowerCase(),
    email: email,
    email_lower: email.toLowerCase(),
    phone: phone,
    phone_digits: phoneDigits,
    company: company,
    company_lower: company.toLowerCase(),
    title: title,
    status: selectedStatus,
    stage: 'awareness',
    contract_value: contractValue,
    account_status: 'active',
    source: source,
    created_at: Timestamp.fromDate(date),
    updated_at: Timestamp.fromDate(date),
    search_prefixes: searchPrefixes,
    tags: ['sample', '2024'],
    notes: `Sample lead generated for 2024 data seeding. Status: ${selectedStatus}, Value: $${contractValue.toLocaleString()}`,
    assigned_to: 'Current User',
    address: {
      street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'][Math.floor(Math.random() * 10)],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'][Math.floor(Math.random() * 10)],
      zip: Math.floor(Math.random() * 90000) + 10000,
      country: 'USA'
    }
  };
  
  // Add converted_at for closed-won leads
  if (selectedStatus === 'closed-won') {
    leadData.converted_at = Timestamp.fromDate(new Date(date.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000));
  }
  
  return leadData;
}

// Add subcollections to a lead
async function addSubcollections(leadDocId, leadData) {
  const leadName = leadData.full_name;
  const leadEmail = leadData.email;
  const createdDate = leadData.created_at.toDate();
  const contractValue = leadData.contract_value;
  const status = leadData.status;
  
  try {
    // Generate activities (2-5 per lead)
    const activityCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < activityCount; i++) {
      const activityData = generateActivity(leadDocId, leadName, leadEmail, createdDate);
      await addDoc(collection(db, 'leads', leadDocId, 'activities'), activityData);
    }
    console.log(`  📝 Added ${activityCount} activities`);
    
    // Generate proposals (for qualified+ leads)
    if (['qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].includes(status)) {
      const proposalCount = Math.floor(Math.random() * 3) + 1; // 1-3 proposals
      for (let i = 0; i < proposalCount; i++) {
        const proposalData = generateProposal(leadDocId, leadName, leadEmail, createdDate, contractValue);
        await addDoc(collection(db, 'leads', leadDocId, 'proposals'), proposalData);
      }
      console.log(`  📋 Added ${proposalCount} proposals`);
    }
    
    // Generate contracts (for closed-won leads)
    if (status === 'closed-won') {
      const contractCount = Math.floor(Math.random() * 2) + 1; // 1-2 contracts
      for (let i = 0; i < contractCount; i++) {
        const contractData = generateContract(leadDocId, leadName, leadEmail, createdDate, contractValue);
        await addDoc(collection(db, 'leads', leadDocId, 'contracts'), contractData);
      }
      console.log(`  📄 Added ${contractCount} contracts`);
    }
    
  } catch (error) {
    console.error(`Error adding subcollections for lead ${leadName}:`, error);
  }
}

// Generate leads for a specific month
async function generateLeadsForMonth(year, month, count = 50) {
  console.log(`Generating ${count} leads for ${year}-${String(month).padStart(2, '0')}`);
  
  const leads = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  for (let i = 0; i < count; i++) {
    const randomDateInMonth = randomDate(startDate, endDate);
    const leadData = generateLead(randomDateInMonth);
    leads.push(leadData);
  }
  
  // Add leads to Firestore with subcollections
  const leadsRef = collection(db, 'leads');
  for (const leadData of leads) {
    try {
      const leadDocRef = await addDoc(leadsRef, leadData);
      console.log(`✅ Added lead: ${leadData.full_name} (${leadData.status}) - $${leadData.contract_value.toLocaleString()}`);
      
      // Add subcollections
      await addSubcollections(leadDocRef.id, leadData);
      
    } catch (error) {
      console.error(`Error adding lead ${leadData.full_name}:`, error);
    }
  }
  
  return leads.length;
}

// Main seeding function
async function seed2024Data() {
  try {
    console.log('🚀 Starting 2024 lead data seeding...');
    
    const year = 2024;
    let totalLeads = 0;
    
    // Generate different amounts of leads per month (realistic variation)
    const monthlyTargets = {
      1: 45,   // January
      2: 52,   // February
      3: 58,   // March
      4: 48,   // April
      5: 55,   // May
      6: 62,   // June
      7: 38,   // July (summer slowdown)
      8: 42,   // August (summer slowdown)
      9: 68,   // September (back to school)
      10: 72,  // October (Q4 push)
      11: 65,  // November
      12: 58   // December (holiday season)
    };
    
    for (let month = 1; month <= 12; month++) {
      const count = monthlyTargets[month];
      const added = await generateLeadsForMonth(year, month, count);
      totalLeads += added;
      console.log(`✅ Completed ${year}-${String(month).padStart(2, '0')}: ${added} leads added`);
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 2024 data seeding completed!`);
    console.log(`📊 Total leads generated: ${totalLeads}`);
    console.log(`📅 Period: ${year}-01-01 to ${year}-12-31`);
    console.log(`💼 Companies: ${companies.length} unique companies`);
    console.log(`👥 Names: ${firstNames.length * lastNames.length} possible combinations`);
    console.log(`📈 Status distribution: ${JSON.stringify(statusProbabilities, null, 2)}`);
    console.log(`\n📝 Subcollections generated:`);
    console.log(`  • Activities: 2-5 per lead (calls, emails, meetings, notes, tasks)`);
    console.log(`  • Proposals: 1-3 per qualified+ lead (draft, sent, accepted, rejected, expired)`);
    console.log(`  • Contracts: 1-2 per closed-won lead (active, expired, pending, cancelled)`);
    console.log(`\n🔍 Search features:`);
    console.log(`  • Full-text search across all fields`);
    console.log(`  • Search prefixes for partial matching`);
    console.log(`  • Subcollection search capabilities`);
    console.log(`  • Drill-down reporting by month/year and status`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

// Run the seeding
seed2024Data();
