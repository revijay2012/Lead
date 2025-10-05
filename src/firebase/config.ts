import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  // Configuration for local development with emulators
  apiKey: "demo-api-key",
  authDomain: "demo-no-project.firebaseapp.com",
  projectId: "demo-no-project",
  storageBucket: "demo-no-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Connect to emulators immediately
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9098');
  connectFunctionsEmulator(functions, 'localhost', 5002);
  console.log('✅ Connected to Firebase emulators');
} catch (error) {
  console.log('⚠️  Emulators already connected or not available:', error.message);
}

export default app;
