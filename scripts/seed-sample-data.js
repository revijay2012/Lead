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
  'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const companies = [
  'TechCorp Solutions', 'Global Innovations Inc', 'Digital Dynamics', 'Future Systems', 'CloudTech Enterprises',
  'DataVision Corp', 'Innovation Labs', 'Smart Solutions', 'NextGen Technologies', 'CyberCore Systems',
  'Quantum Computing', 'AI Solutions Ltd', 'Blockchain Innovations', 'RoboTech Industries', 'Virtual Reality Corp',
  'Machine Learning Inc', 'Big Data Analytics', 'Cloud Infrastructure', 'Mobile Solutions', 'Web Development Co'
];

const titles = [
  'CEO', 'CTO', 'VP of Engineering', 'VP of Sales', 'VP of Marketing', 'Director of Technology', 'Director of Sales',
  'Engineering Manager', 'Sales Manager', 'Marketing Manager', 'Product Manager', 'Project Manager',
  'Senior Developer', 'Lead Developer', 'Software Engineer', 'Data Scientist', 'DevOps Engineer',
  'Business Analyst', 'Sales Representative', 'Marketing Specialist'
];

const sources = [
  'Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Partner',
  'LinkedIn', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'SEO', 'Webinar', 'Conference'
];

const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const activityTypes = ['call', 'email', 'meeting', 'note', 'task'];
const proposalStatuses = ['draft', 'sent', 'reviewed', 'accepted', 'rejected'];

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateSearchPrefixes(data) {
  const prefixes = new Set();
  const fields = [
    data.first_name, data.last_name, data.email, data.company, data.phone,
    data.title, data.source, data.status
  ].filter(Boolean);

  fields.forEach(field => {
    const text = field.toLowerCase();
    for (let i = 1; i <= text.length; i++) {
      prefixes.add(text.substring(0, i));
    }
  });

  return Array.from(prefixes);
}

async function generateLead(month = 1, year = 2024) {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const company = getRandomItem(companies);
  const title = getRandomItem(titles);
  const source = getRandomItem(sources);
  const status = getRandomItem(statuses);
  
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}.com`;
  const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  const createdDate = getRandomDate(
    new Date(year, month - 1, 1),
    new Date(year, month, 0)
  );

  const leadData = {
    lead_id: `L-${year}${month.toString().padStart(2, '0')}-${Math.floor(Math.random() * 900) + 100}`,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    email: email,
    phone: phone,
    company: company,
    title: title,
    source: source,
    status: status,
    estimated_value: Math.floor(Math.random() * 200000) + 5000,
    created_at: Timestamp.fromDate(createdDate),
    updated_at: Timestamp.fromDate(createdDate),
    created_by: 'system',
    notes: `Lead generated for ${company} - ${title}`,
    // Search optimization fields
    first_name_lower: firstName.toLowerCase(),
    last_name_lower: lastName.toLowerCase(),
    full_name_lower: `${firstName} ${lastName}`.toLowerCase(),
    email_lower: email.toLowerCase(),
    company_lower: company.toLowerCase(),
    search_prefixes: []
  };

  // Generate search prefixes
  leadData.search_prefixes = generateSearchPrefixes(leadData);

  return leadData;
}

async function generateActivity(leadId, leadName, leadEmail) {
  const type = getRandomItem(activityTypes);
  const subjects = {
    call: ['Initial contact call', 'Follow-up call', 'Discovery call', 'Proposal discussion'],
    email: ['Welcome email', 'Product information', 'Meeting request', 'Follow-up'],
    meeting: ['Discovery meeting', 'Demo presentation', 'Proposal review', 'Stakeholder meeting'],
    note: ['Research notes', 'Competitor analysis', 'Budget discussion', 'Timeline planning'],
    task: ['Send proposal', 'Schedule demo', 'Follow up on pricing', 'Check references']
  };

  const subject = getRandomItem(subjects[type]);
  const notes = `Activity: ${subject}. ${type === 'call' ? 'Duration: 30 minutes.' : type === 'meeting' ? 'Duration: 1 hour.' : 'Completed successfully.'}`;

  return {
    subject: subject,
    subject_lower: subject.toLowerCase(),
    type: type,
    status: getRandomItem(['completed', 'pending', 'in-progress']),
    notes: notes,
    notes_lower: notes.toLowerCase(),
    created_at: Timestamp.now(),
    created_by: 'system',
    lead_id: leadId,
    lead_name: leadName,
    lead_email: leadEmail
  };
}

async function generateProposal(leadId, leadName, leadEmail) {
  const value = Math.floor(Math.random() * 150000) + 10000;
  const status = getRandomItem(proposalStatuses);
  
  return {
    title: `Proposal for ${getRandomItem(['Software Implementation', 'Digital Transformation', 'IT Consulting', 'System Integration'])}`,
    value: value,
    status: status,
    sent_at: Timestamp.now(),
    created_at: Timestamp.now(),
    created_by: 'system',
    lead_id: leadId,
    lead_name: leadName,
    lead_email: leadEmail,
    notes: `Proposal value: $${value.toLocaleString()}. Status: ${status}`
  };
}

async function generateContract(leadId, leadName, leadEmail) {
  const value = Math.floor(Math.random() * 200000) + 50000;
  const startDate = getRandomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year contract
  
  return {
    title: `Service Agreement - ${getRandomItem(['Annual Support', 'Implementation Project', 'Consulting Services', 'Software License'])}`,
    value: value,
    start_date: Timestamp.fromDate(startDate),
    end_date: Timestamp.fromDate(endDate),
    status: 'active',
    created_at: Timestamp.now(),
    created_by: 'system',
    lead_id: leadId,
    lead_name: leadName,
    lead_email: leadEmail,
    notes: `Contract value: $${value.toLocaleString()}. Duration: 12 months.`
  };
}

async function addSampleData(count = 100) {
  console.log(`🚀 Adding ${count} sample leads...`);
  
  for (let i = 0; i < count; i++) {
    try {
      const leadData = await generateLead();
      const leadRef = await addDoc(collection(db, 'leads'), leadData);
      
      const activities = [];
      const proposals = [];
      const contracts = [];
      
      // Add 2-5 activities
      const activityCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < activityCount; j++) {
        const activity = await generateActivity(leadData.lead_id, leadData.full_name, leadData.email);
        const activityRef = await addDoc(collection(db, `leads/${leadRef.id}/activities`), activity);
        activities.push(activityRef.id);
      }
      
      // Add proposals for qualified+ leads
      if (['qualified', 'proposal', 'negotiation', 'closed-won'].includes(leadData.status)) {
        const proposalCount = Math.floor(Math.random() * 3) + 1;
        for (let k = 0; k < proposalCount; k++) {
          const proposal = await generateProposal(leadData.lead_id, leadData.full_name, leadData.email);
          const proposalRef = await addDoc(collection(db, `leads/${leadRef.id}/proposals`), proposal);
          proposals.push(proposalRef.id);
        }
      }
      
      // Add contracts for closed-won leads
      if (leadData.status === 'closed-won') {
        const contractCount = Math.floor(Math.random() * 2) + 1;
        for (let l = 0; l < contractCount; l++) {
          const contract = await generateContract(leadData.lead_id, leadData.full_name, leadData.email);
          const contractRef = await addDoc(collection(db, `leads/${leadRef.id}/contracts`), contract);
          contracts.push(contractRef.id);
        }
      }
      
      console.log(`✅ Added lead: ${leadData.full_name} (${leadData.status}) - $${leadData.estimated_value.toLocaleString()}`);
      if (activities.length > 0) console.log(`  📝 Added ${activities.length} activities`);
      if (proposals.length > 0) console.log(`  📋 Added ${proposals.length} proposals`);
      if (contracts.length > 0) console.log(`  📄 Added ${contracts.length} contracts`);
      
    } catch (error) {
      console.error(`❌ Error adding lead ${i + 1}:`, error);
    }
  }
  
  console.log(`✅ Completed sample data: ${count} leads added`);
}

// Run the script
addSampleData(100).then(() => {
  console.log('🎉 Sample data seeding completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error seeding sample data:', error);
  process.exit(1);
});
