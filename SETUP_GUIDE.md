# Complete Setup Guide for Leads Management System

This guide will walk you through setting up the entire leads management system in Google Cloud Platform step by step.

## Prerequisites

- Google account with billing enabled
- Node.js 18+ installed
- Git installed
- Terminal/Command line access

## Phase 1: Google Cloud Project Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Project name: `leads-management-system`
   - Organization: Select your organization (if applicable)
   - Location: Select your preferred location
   - Click "Create"

3. **Enable Billing**
   - Go to "Billing" in the left sidebar
   - Click "Link a billing account"
   - Create a new billing account or link existing one
   - Add a payment method

### Step 2: Enable Required APIs

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" → "Library"
   - Search for and enable these APIs one by one:

2. **Enable Firebase APIs**
   ```
   - Firebase Authentication API
   - Cloud Firestore API
   - Cloud Functions API
   - Firebase Hosting API
   - Firebase Management API
   ```

3. **Enable Additional APIs**
   ```
   - Cloud Resource Manager API
   - Cloud Build API
   - Cloud Logging API
   - Cloud Monitoring API
   ```

### Step 3: Set Up Service Account

1. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `firebase-admin`
   - Description: `Service account for Firebase admin operations`
   - Click "Create and Continue"

2. **Assign Roles**
   - Add these roles:
     ```
     - Firebase Admin
     - Cloud Functions Admin
     - Firestore Service Agent
     - Service Account User
     - Cloud Build Editor
     ```

3. **Create and Download Key**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Download and save as `firebase-service-account.json`
   - **Keep this file secure!**

## Phase 2: Firebase Setup

### Step 4: Initialize Firebase Project

1. **Go to Firebase Console**
   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Click "Add project"

2. **Configure Firebase Project**
   - Project name: `leads-management-system`
   - Project ID: `leads-management-system-[random]` (note this ID)
   - Google Analytics: Enable (recommended)
   - Analytics account: Select or create new
   - Click "Create project"

3. **Wait for Project Creation**
   - This may take 1-2 minutes

### Step 5: Configure Authentication

1. **Enable Authentication**
   - In Firebase Console, go to "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab

2. **Enable Email/Password**
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

3. **Configure Authorized Domains**
   - Go to "Settings" tab
   - Add your domains:
     ```
     localhost (for development)
     your-domain.com (for production)
     ```

### Step 6: Set Up Firestore Database

1. **Create Firestore Database**
   - Go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (we'll secure it later)
   - Select location: Choose closest to your users
   - Click "Done"

2. **Configure Security Rules**
   - Go to "Rules" tab
   - Replace with our custom rules (already in `firestore.rules`)
   - Click "Publish"

### Step 7: Get Firebase Configuration

1. **Get Web App Config**
   - Go to "Project Settings" (gear icon)
   - Scroll down to "Your apps"
   - Click "Add app" → Web app (</>) icon
   - App nickname: `leads-management-web`
   - Check "Also set up Firebase Hosting"
   - Click "Register app"

2. **Copy Configuration**
   - Copy the Firebase config object
   - It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

3. **Update Configuration File**
   - Open `src/firebase/config.ts`
   - Replace the placeholder values with your actual config

## Phase 3: Local Development Setup

### Step 8: Install Dependencies

1. **Install Node.js Dependencies**
   ```bash
   cd /path/to/leads-management-system
   npm install
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

### Step 9: Configure Firebase CLI

1. **Initialize Firebase in Project**
   ```bash
   firebase init
   ```

2. **Select Services** (use arrow keys and space to select):
   ```
   ✓ Firestore: Configure security rules and indexes files
   ✓ Functions: Configure a Cloud Functions directory
   ✓ Hosting: Configure files for Firebase Hosting
   ```

3. **Configure Each Service**:

   **Firestore:**
   - Use existing project: `leads-management-system-[your-id]`
   - Rules file: `firestore.rules`
   - Indexes file: `firestore.indexes.json`

   **Functions:**
   - Language: TypeScript
   - ESLint: Yes
   - Install dependencies: Yes

   **Hosting:**
   - Public directory: `dist`
   - Single-page app: Yes
   - GitHub auto-builds: No

### Step 10: Set Up Environment Variables

1. **Create Environment File**
   ```bash
   touch .env.local
   ```

2. **Add Environment Variables**
   ```bash
   # .env.local
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Update Firebase Config**
   - Update `src/firebase/config.ts` to use environment variables:
   ```typescript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

## Phase 4: Deploy Cloud Functions

### Step 11: Deploy Cloud Functions

1. **Install Function Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

2. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

3. **Verify Deployment**
   - Go to Firebase Console → Functions
   - You should see your functions listed

### Step 12: Deploy Firestore Rules and Indexes

1. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Database Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Verify in Console**
   - Go to Firestore Database → Rules
   - Go to Firestore Database → Indexes

## Phase 5: Test the Application

### Step 13: Start Development Server

1. **Start the App**
   ```bash
   npm run dev
   ```

2. **Open in Browser**
   - Go to `http://localhost:3000`
   - You should see the leads management interface

### Step 14: Test Core Functionality

1. **Test Authentication**
   - Try to search (should prompt for authentication)
   - Create a test account
   - Verify login works

2. **Test Search**
   - Try different search modes
   - Test filtering
   - Verify results display

3. **Test Data Creation**
   - Create a test lead
   - Add activities, proposals, contracts
   - Verify data appears in search

## Phase 6: Production Deployment

### Step 15: Build for Production

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Test Production Build**
   ```bash
   npm run preview
   ```

### Step 16: Deploy to Firebase Hosting

1. **Deploy to Hosting**
   ```bash
   firebase deploy --only hosting
   ```

2. **Get Hosting URL**
   - Go to Firebase Console → Hosting
   - Copy your hosting URL
   - Test the live application

### Step 17: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - In Firebase Console → Hosting
   - Click "Add custom domain"
   - Enter your domain
   - Follow DNS configuration instructions

## Phase 7: Monitoring and Maintenance

### Step 18: Set Up Monitoring

1. **Enable Cloud Monitoring**
   - Go to Google Cloud Console → Monitoring
   - Enable monitoring for your project

2. **Set Up Alerts**
   - Create alerts for function errors
   - Set up database usage alerts
   - Monitor authentication failures

### Step 19: Set Up Logging

1. **View Logs**
   - Go to Google Cloud Console → Logging
   - Filter by resource type: Cloud Functions
   - Monitor function execution logs

2. **Set Up Log Retention**
   - Configure log retention policies
   - Set up log-based metrics

## Troubleshooting Common Issues

### Issue 1: Authentication Not Working

**Symptoms:** Users can't sign in or search doesn't work

**Solutions:**
1. Check Firebase config in `src/firebase/config.ts`
2. Verify Authentication is enabled in Firebase Console
3. Check authorized domains in Authentication settings
4. Verify API keys are correct

### Issue 2: Search Returns No Results

**Symptoms:** Search bar works but no results appear

**Solutions:**
1. Check if Firestore indexes are deployed: `firebase deploy --only firestore:indexes`
2. Verify Cloud Functions are deployed and working
3. Check browser console for errors
4. Verify data exists in Firestore

### Issue 3: Cloud Functions Not Triggering

**Symptoms:** Data changes don't trigger automatic indexing

**Solutions:**
1. Check function deployment: `firebase functions:log`
2. Verify Firestore rules allow function execution
3. Check function triggers in Firebase Console
4. Verify function code is correct

### Issue 4: Slow Search Performance

**Symptoms:** Search takes too long to return results

**Solutions:**
1. Check Firestore indexes are properly configured
2. Verify search queries are optimized
3. Check for missing indexes in Firebase Console
4. Monitor Firestore usage and quotas

### Issue 5: Build Errors

**Symptoms:** `npm run build` fails

**Solutions:**
1. Check TypeScript errors: `npm run type-check`
2. Fix linting errors: `npm run lint`
3. Verify all dependencies are installed
4. Check for missing environment variables

## Security Checklist

- [ ] Firestore security rules are deployed and tested
- [ ] Authentication is properly configured
- [ ] Service account keys are secured
- [ ] Environment variables are not committed to git
- [ ] HTTPS is enabled for production
- [ ] CORS is properly configured
- [ ] Input validation is working
- [ ] Rate limiting is in place

## Performance Optimization

- [ ] Firestore indexes are optimized
- [ ] Search queries are efficient
- [ ] Images are optimized
- [ ] Code splitting is implemented
- [ ] Caching is working
- [ ] CDN is configured
- [ ] Database queries are paginated

## Backup and Recovery

1. **Set Up Automated Backups**
   - Configure Firestore automated backups
   - Set up Cloud Functions backup
   - Document recovery procedures

2. **Test Recovery Process**
   - Practice restoring from backups
   - Document recovery steps
   - Train team on recovery procedures

## Cost Optimization

1. **Monitor Usage**
   - Set up billing alerts
   - Monitor Firestore reads/writes
   - Track Cloud Functions invocations

2. **Optimize Queries**
   - Use pagination to limit reads
   - Implement efficient search strategies
   - Cache frequently accessed data

## Next Steps

1. **Add More Features**
   - Email notifications
   - Advanced reporting
   - Data export/import
   - Mobile app

2. **Scale the System**
   - Implement caching layers
   - Add load balancing
   - Optimize database queries
   - Add monitoring dashboards

3. **Integrate with Other Services**
   - CRM systems
   - Email marketing platforms
   - Analytics tools
   - Third-party APIs

## Support and Resources

- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Google Cloud Documentation**: [cloud.google.com/docs](https://cloud.google.com/docs)
- **React Documentation**: [react.dev](https://react.dev)
- **TypeScript Documentation**: [typescriptlang.org](https://typescriptlang.org)

## Conclusion

You now have a fully functional leads management system with advanced search capabilities. The system is scalable, secure, and ready for production use. Remember to:

1. Monitor performance and costs
2. Keep dependencies updated
3. Regularly backup your data
4. Test new features thoroughly
5. Document any customizations

For additional support or questions, refer to the troubleshooting section or create an issue in the project repository.


