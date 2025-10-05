# Local Development Without Google Cloud Project

This guide shows you how to run the leads management system completely locally using Firebase Emulators, without needing a Google Cloud project or billing account.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- No Google Cloud account required!

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
# Install project dependencies
npm install

# Install Firebase CLI globally
npm install -g firebase-tools
```

### Step 2: Initialize Firebase Emulators

```bash
# Initialize Firebase (choose emulators only)
firebase init

# When prompted, select:
# ✓ Emulators: Set up local emulators for Firebase products
# ✓ Firestore: Firestore emulator
# ✓ Functions: Cloud Functions emulator
# ✓ Authentication: Authentication emulator
# ✓ Hosting: Hosting emulator

# Choose default ports and settings
```

### Step 3: Start the Emulators

```bash
# Start all emulators
firebase emulators:start

# This will start:
# - Firestore: http://localhost:8080
# - Functions: http://localhost:5001
# - Auth: http://localhost:9099
# - Hosting: http://localhost:5000
# - Emulator UI: http://localhost:4000
```

### Step 4: Start the React App

```bash
# In a new terminal
npm run dev
```

### Step 5: Access the Application

- **React App**: http://localhost:3000
- **Firebase Emulator UI**: http://localhost:4000
- **Firestore Data**: http://localhost:4000/firestore
- **Authentication**: http://localhost:4000/auth

## Detailed Setup

### Configure Firebase for Local Development

The Firebase config is already set up for emulators in `src/firebase/config.ts`:

```typescript
// This automatically connects to emulators in development
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}
```

### Set Up Sample Data

Create a script to populate the emulator with sample data:

```bash
# Create sample data script
touch scripts/seed-data.js
```

Add this content to `scripts/seed-data.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, collection, addDoc } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require('firebase/auth');

// Initialize Firebase
const app = initializeApp({
  projectId: 'demo-project',
  authDomain: 'demo-project.firebaseapp.com',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456'
});

const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099');

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Create test user
    const userCredential = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log('✅ Test user created:', userCredential.user.email);
    
    // Sample leads data
    const leads = [
      {
        lead_id: 'L-20241201-001',
        first_name: 'John',
        last_name: 'Doe',
        full_name_lower: 'john doe',
        email: 'john.doe@example.com',
        email_lower: 'john.doe@example.com',
        phone: '+1-555-0123',
        phone_digits: '15550123',
        status: 'new',
        account_status: 'active',
        source: 'website',
        created_at: new Date(),
        updated_at: new Date(),
        search_prefixes: ['john', 'doe', 'john doe', 'j', 'jo', 'joh', 'd', 'do'],
        tags: ['customer', 'website'],
        company: 'Acme Corp',
        title: 'CEO'
      },
      {
        lead_id: 'L-20241201-002',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name_lower: 'jane smith',
        email: 'jane.smith@company.com',
        email_lower: 'jane.smith@company.com',
        phone: '+1-555-0456',
        phone_digits: '15550456',
        status: 'contacted',
        account_status: 'active',
        source: 'referral',
        created_at: new Date(),
        updated_at: new Date(),
        search_prefixes: ['jane', 'smith', 'jane smith', 'j', 'ja', 'jan', 's', 'sm', 'smi'],
        tags: ['referral', 'high_value'],
        company: 'Tech Solutions Inc',
        title: 'CTO'
      },
      {
        lead_id: 'L-20241201-003',
        first_name: 'Bob',
        last_name: 'Johnson',
        full_name_lower: 'bob johnson',
        email: 'bob.johnson@startup.io',
        email_lower: 'bob.johnson@startup.io',
        phone: '+1-555-0789',
        phone_digits: '15550789',
        status: 'qualified',
        account_status: 'active',
        source: 'social_media',
        created_at: new Date(),
        updated_at: new Date(),
        search_prefixes: ['bob', 'johnson', 'bob johnson', 'b', 'bo', 'j', 'jo', 'joh'],
        tags: ['startup', 'social_media'],
        company: 'StartupXYZ',
        title: 'Founder'
      }
    ];
    
    // Add leads
    for (const lead of leads) {
      await addDoc(collection(db, 'leads'), lead);
      console.log(`✅ Added lead: ${lead.first_name} ${lead.last_name}`);
      
      // Add sample activities
      const activities = [
        {
          activity_id: `ACT-${Date.now()}-1`,
          type: 'call',
          subject: 'Initial contact call',
          subject_lower: 'initial contact call',
          notes: 'Had a great conversation about their needs. Very interested in our services.',
          notes_lower: 'had a great conversation about their needs. very interested in our services.',
          search_keywords: ['call', 'initial', 'contact', 'conversation', 'needs', 'services'],
          timestamp: new Date(),
          lead_id: lead.lead_id,
          lead_name: `${lead.first_name} ${lead.last_name}`,
          created_by: userCredential.user.uid,
          duration: 30,
          outcome: 'positive'
        },
        {
          activity_id: `ACT-${Date.now()}-2`,
          type: 'email',
          subject: 'Follow-up email with proposal',
          subject_lower: 'follow-up email with proposal',
          notes: 'Sent detailed proposal with pricing and timeline.',
          notes_lower: 'sent detailed proposal with pricing and timeline.',
          search_keywords: ['email', 'follow-up', 'proposal', 'pricing', 'timeline'],
          timestamp: new Date(),
          lead_id: lead.lead_id,
          lead_name: `${lead.first_name} ${lead.last_name}`,
          created_by: userCredential.user.uid
        }
      ];
      
      for (const activity of activities) {
        await addDoc(collection(db, 'leads', lead.lead_id, 'activities'), activity);
      }
      
      // Add sample proposal
      const proposal = {
        proposal_id: `PROP-${Date.now()}`,
        title: `Proposal for ${lead.company}`,
        title_lower: `proposal for ${lead.company}`.toLowerCase(),
        status: 'sent',
        sent_at: new Date(),
        search_keywords: ['proposal', lead.company.toLowerCase(), 'services', 'pricing'],
        lead_id: lead.lead_id,
        lead_name: `${lead.first_name} ${lead.last_name}`,
        created_by: userCredential.user.uid,
        amount: 5000 + Math.random() * 10000,
        currency: 'USD',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
      
      await addDoc(collection(db, 'leads', lead.lead_id, 'proposals'), proposal);
      
      // Add sample contract
      const contract = {
        contract_id: `CONT-${Date.now()}`,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        search_keywords: ['contract', 'agreement', lead.company.toLowerCase()],
        lead_id: lead.lead_id,
        lead_name: `${lead.first_name} ${lead.last_name}`,
        created_by: userCredential.user.uid,
        amount: 5000 + Math.random() * 10000,
        currency: 'USD',
        auto_renew: true
      };
      
      await addDoc(collection(db, 'leads', lead.lead_id, 'contracts'), contract);
    }
    
    console.log('🎉 Sample data seeded successfully!');
    console.log('📧 Test login: test@example.com / password123');
    console.log('🌐 App URL: http://localhost:3000');
    console.log('🔧 Emulator UI: http://localhost:4000');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedData();
```

### Add Seed Script to package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx,ts,tsx",
    "type-check": "tsc --noEmit",
    "seed": "node scripts/seed-data.js",
    "emulators": "firebase emulators:start",
    "dev:full": "concurrently \"npm run emulators\" \"npm run dev\""
  }
}
```

### Install Concurrently for Running Both

```bash
npm install --save-dev concurrently
```

## Running the Complete Local Setup

### Option 1: Manual (Two Terminals)

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start React app
npm run dev

# Terminal 3: Seed data (run once)
npm run seed
```

### Option 2: Automated (One Command)

```bash
# Install concurrently first
npm install --save-dev concurrently

# Run everything at once
npm run dev:full

# In another terminal, seed data
npm run seed
```

## Testing the Application

1. **Open the app**: http://localhost:3000
2. **Login**: Use `test@example.com` / `password123`
3. **Test search**: Try searching for "John", "Jane", "Bob"
4. **Test filters**: Use the filter panel to filter by status, source, etc.
5. **View details**: Click on any result to see the detail drawer

## Emulator UI Features

Visit http://localhost:4000 to:

- **View Firestore Data**: See all your leads, activities, proposals, contracts
- **Manage Authentication**: View users, test auth flows
- **Monitor Functions**: See function logs and executions
- **Export/Import Data**: Save your test data for later use

## Advantages of Local Development

✅ **No Google Cloud costs**  
✅ **No billing account required**  
✅ **Fast development cycle**  
✅ **Offline development**  
✅ **Easy data reset**  
✅ **No API quotas**  
✅ **Perfect for testing**  

## Troubleshooting

### Emulators Won't Start

```bash
# Check if ports are available
lsof -i :8080  # Firestore
lsof -i :5001  # Functions
lsof -i :9099  # Auth
lsof -i :5000  # Hosting

# Kill processes if needed
kill -9 <PID>
```

### Data Not Appearing

1. Check emulator UI: http://localhost:4000/firestore
2. Verify data was seeded: `npm run seed`
3. Check browser console for errors
4. Ensure you're logged in with test account

### Search Not Working

1. Check if Cloud Functions are running
2. Verify Firestore indexes are created
3. Check browser console for errors
4. Try refreshing the page

## Production Deployment

When you're ready to deploy to production:

1. Create a Google Cloud project
2. Set up Firebase project
3. Deploy Cloud Functions: `firebase deploy --only functions`
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`
5. Deploy hosting: `firebase deploy --only hosting`

## Next Steps

- Add more sample data
- Test different search scenarios
- Customize the UI
- Add new features
- Prepare for production deployment

This local setup gives you a fully functional leads management system without any Google Cloud costs or complexity!


