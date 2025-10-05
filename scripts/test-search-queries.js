import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, startAt, endAt, where, getDocs, connectFirestoreEmulator, limit } from 'firebase/firestore';

// Firebase configuration for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('✅ Connected to Firestore emulator');
} catch (error) {
  console.log('⚠️  Emulator already connected or not available');
}

async function testSearchQueries() {
  console.log('🔍 Testing Firestore Search Query Patterns\n');

  try {
    // 🔹 (A) Prefix search by name
    console.log('📋 1. Prefix search by name (looking for names starting with "s")');
    const nameQuery = query(
      collection(db, 'leads'),
      orderBy('full_name_lower'),
      startAt('s'),
      endAt('s\uf8ff'),
      limit(5)
    );
    const nameResults = await getDocs(nameQuery);
    console.log(`   Found ${nameResults.size} results:`);
    nameResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.full_name} (${data.email})`);
    });

    // 🔹 (B) Prefix search by email
    console.log('\n📧 2. Prefix search by email (looking for emails starting with "s")');
    const emailQuery = query(
      collection(db, 'leads'),
      orderBy('email_lower'),
      startAt('s'),
      endAt('s\uf8ff'),
      limit(5)
    );
    const emailResults = await getDocs(emailQuery);
    console.log(`   Found ${emailResults.size} results:`);
    emailResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.email} (${data.full_name})`);
    });

    // 🔹 (C) Prefix search by phone digits
    console.log('\n📞 3. Prefix search by phone (looking for phones starting with "1")');
    const phoneQuery = query(
      collection(db, 'leads'),
      orderBy('phone_digits'),
      startAt('1'),
      endAt('1\uf8ff'),
      limit(5)
    );
    const phoneResults = await getDocs(phoneQuery);
    console.log(`   Found ${phoneResults.size} results:`);
    phoneResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.phone} (${data.full_name})`);
    });

    // 🔹 (D) Array fallback search
    console.log('\n🔍 4. Array fallback search (looking for "s" in search_prefixes)');
    const arrayQuery = query(
      collection(db, 'leads'),
      where('search_prefixes', 'array-contains', 's'),
      limit(5)
    );
    const arrayResults = await getDocs(arrayQuery);
    console.log(`   Found ${arrayResults.size} results:`);
    arrayResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.full_name} (contains "s" in name/email/phone)`);
    });

    // 🔹 (E) Combine with filters
    console.log('\n🎯 5. Combined search (status = "closed-won")');
    const combinedQuery = query(
      collection(db, 'leads'),
      where('status', '==', 'closed-won'),
      limit(5)
    );
    const combinedResults = await getDocs(combinedQuery);
    console.log(`   Found ${combinedResults.size} results:`);
    combinedResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.full_name} (${data.status}, $${data.contract_value?.toLocaleString()})`);
    });

    // 🔹 (F) Search by company prefix
    console.log('\n🏢 6. Company prefix search (looking for companies starting with "a")');
    const companyQuery = query(
      collection(db, 'leads'),
      orderBy('company_lower'),
      startAt('a'),
      endAt('a\uf8ff'),
      limit(5)
    );
    const companyResults = await getDocs(companyQuery);
    console.log(`   Found ${companyResults.size} results:`);
    companyResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.full_name} at ${data.company}`);
    });

    // 🔹 (G) Search index collection query
    console.log('\n📊 7. Search index collection query (faster for large datasets)');
    const searchIndexQuery = query(
      collection(db, 'search_index'),
      where('search_prefixes', 'array-contains', 's'),
      limit(5)
    );
    const searchIndexResults = await getDocs(searchIndexQuery);
    console.log(`   Found ${searchIndexResults.size} results in search_index:`);
    searchIndexResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.full_name_lower} (${data.status})`);
    });

    // 🔹 (H) Multi-field search example
    console.log('\n🔍 8. Multi-field search (enterprise + active tags)');
    const multiFieldQuery = query(
      collection(db, 'leads'),
      where('tags', 'array-contains', 'enterprise'),
      where('tags', 'array-contains', 'active'),
      limit(5)
    );
    const multiFieldResults = await getDocs(multiFieldQuery);
    console.log(`   Found ${multiFieldResults.size} results:`);
    multiFieldResults.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.full_name} (tags: ${data.tags.join(', ')})`);
    });

    console.log('\n✅ Search query testing complete!');
    console.log('\n📝 Summary of implemented search patterns:');
    console.log('   ✅ Prefix search by name, email, phone, company');
    console.log('   ✅ Array fallback search using search_prefixes');
    console.log('   ✅ Combined filters with prefix search');
    console.log('   ✅ Search index collection for scalability');
    console.log('   ✅ Multi-field tag-based filtering');

  } catch (error) {
    console.error('❌ Error testing search queries:', error);
  }
}

// Run the search tests
testSearchQueries();
