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
  console.log('✅ Connected to Firestore emulator for background seeding');
} catch (error) {
  console.log('⚠️  Emulator already connected or not available:', error.message);
}

// Sample data patterns
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley',
  'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel', 'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Donna',
  'Mark', 'Lisa', 'Donald', 'Nancy', 'Steven', 'Betty', 'Paul', 'Helen', 'Andrew', 'Sandra',
  'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey',
  'Carol', 'Sharon', 'Ruth', 'Kimberly', 'Michelle', 'Laura', 'Nancy', 'Betty', 'Dorothy', 'Sandra'
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
  'Enterprise Software', 'Startup Ventures', 'FinTech Innovations', 'HealthTech Systems', 'EdTech Solutions',
  'Automation Solutions', 'Data Science Corp', 'Cloud Services Inc', 'Mobile Apps Ltd', 'Web Design Studio',
  'Tech Consulting', 'Digital Agency', 'Software Solutions', 'IT Services', 'Tech Startup'
];

const titles = [
  'CEO', 'CTO', 'VP of Engineering', 'VP of Sales', 'VP of Marketing', 'VP of Operations', 'VP of Finance',
  'Director of Technology', 'Director of Sales', 'Director of Marketing', 'Director of Operations',
  'Engineering Manager', 'Sales Manager', 'Marketing Manager', 'Product Manager', 'Project Manager',
  'Senior Developer', 'Lead Developer', 'Software Engineer', 'Data Scientist', 'DevOps Engineer',
  'Business Analyst', 'Sales Representative', 'Marketing Specialist', 'Operations Manager', 'Finance Manager',
  'UX Designer', 'UI Designer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'
];

const sources = [
  'Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Partner',
  'LinkedIn', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'SEO', 'Webinar', 'Conference',
  'Industry Publication', 'Networking Event', 'Previous Client', 'Vendor Referral', 'Employee Referral',
  'Online Search', 'Trade Publication', 'Industry Forum', 'Client Referral', 'Partner Network'
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
    call: ['Initial contact call', 'Follow-up call', 'Discovery call', 'Proposal discussion', 'Contract negotiation'],
    email: ['Welcome email', 'Product information', 'Meeting request', 'Follow-up', 'Proposal sent'],
    meeting: ['Discovery meeting', 'Demo presentation', 'Proposal review', 'Stakeholder meeting', 'Technical discussion'],
    note: ['Research notes', 'Competitor analysis', 'Budget discussion', 'Timeline planning', 'Requirements gathering'],
    task: ['Send proposal', 'Schedule demo', 'Follow up on pricing', 'Check references', 'Prepare contract']
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
    title: `Proposal for ${getRandomItem(['Software Implementation', 'Digital Transformation', 'IT Consulting', 'System Integration', 'Cloud Migration'])}`,
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
    title: `Service Agreement - ${getRandomItem(['Annual Support', 'Implementation Project', 'Consulting Services', 'Software License', 'Maintenance Contract'])}`,
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

async function addBackgroundData(batchSize = 50, delayMs = 5000) {
  console.log(`🔄 Starting background data seeding (${batchSize} leads per batch, ${delayMs}ms delay)...`);
  
  let totalAdded = 0;
  const months = [
    { month: 1, year: 2024, name: 'January' },
    { month: 2, year: 2024, name: 'February' },
    { month: 3, year: 2024, name: 'March' },
    { month: 4, year: 2024, name: 'April' },
    { month: 5, year: 2024, name: 'May' },
    { month: 6, year: 2024, name: 'June' },
    { month: 7, year: 2024, name: 'July' },
    { month: 8, year: 2024, name: 'August' },
    { month: 9, year: 2024, name: 'September' },
    { month: 10, year: 2024, name: 'October' },
    { month: 11, year: 2024, name: 'November' },
    { month: 12, year: 2024, name: 'December' }
  ];

  for (const monthData of months) {
    console.log(`📅 Adding data for ${monthData.name} 2024...`);
    
    for (let i = 0; i < batchSize; i++) {
      try {
        const leadData = await generateLead(monthData.month, monthData.year);
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
        
        totalAdded++;
        if (totalAdded % 10 === 0) {
          console.log(`  ✅ Added ${totalAdded} leads so far...`);
        }
        
        // Small delay between leads to not overwhelm the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error adding lead ${i + 1} for ${monthData.name}:`, error);
      }
    }
    
    console.log(`✅ Completed ${monthData.name} 2024: ${batchSize} leads added`);
    
    // Delay between months
    if (monthData.month < 12) {
      console.log(`⏳ Waiting ${delayMs / 1000} seconds before next month...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`🎉 Background seeding completed! Total leads added: ${totalAdded}`);
}

// Run the script
addBackgroundData(50, 8000).then(() => {
  console.log('✅ Background data seeding completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error in background seeding:', error);
  process.exit(1);
});
