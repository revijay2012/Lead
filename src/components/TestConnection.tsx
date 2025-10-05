import { useState, useEffect } from 'react';
import { collection, getDocs, connectFirestoreEmulator, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export function TestConnection() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [leadCount, setLeadCount] = useState<number>(0);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Ensure emulator connection
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        setStatus('✅ Connected to Firestore emulator');
      } catch (error) {
        setStatus('⚠️  Emulator already connected or not available');
      }

      // Test data access - same query as LeadsList
      const leadsRef = collection(db, 'leads');
      const q = query(leadsRef, orderBy('created_at', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      setLeadCount(snapshot.size);
      setStatus(`✅ Connection successful! Found ${snapshot.size} leads (showing first 50)`);
      
      if (snapshot.size > 0) {
        const firstLead = snapshot.docs[0].data();
        console.log('First lead:', firstLead.full_name);
        setStatus(`✅ Connection successful! Found ${snapshot.size} leads. First: ${firstLead.full_name}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">Firebase Connection Test</h3>
      <p className="text-blue-700">{status}</p>
      {leadCount > 0 && (
        <p className="text-blue-600 mt-2">📊 Total leads in database: {leadCount}</p>
      )}
      <button 
        onClick={testConnection}
        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Retest Connection
      </button>
    </div>
  );
}
