import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, getDocs } from 'firebase/firestore';

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
  console.log('⚠️  Emulator already connected or connection failed:', error.message);
}

async function testConnection() {
  try {
    console.log('🧪 Testing Firestore connection...');
    
    // Test write
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Connection test',
      timestamp: new Date()
    });
    console.log('✅ Write test successful:', testDoc.id);
    
    // Test read
    const snapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Read test successful:', snapshot.size, 'documents found');
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

testConnection();
