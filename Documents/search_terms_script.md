# Search Terms Script Documentation

## Script for Building Search Prefixes

```typescript
function buildSearchPrefixes(firstName: string, lastName: string, email: string, phone: string): string[] {
  const prefixes = new Set<string>();
  
  // Add first name prefixes
  if (firstName) {
    const firstLower = firstName.toLowerCase();
    for (let i = 1; i <= firstLower.length; i++) {
      prefixes.add(firstLower.substring(0, i));
    }
  }
  
  // Add last name prefixes
  if (lastName) {
    const lastLower = lastName.toLowerCase();
    for (let i = 1; i <= lastLower.length; i++) {
      prefixes.add(lastLower.substring(0, i));
    }
  }
  
  // Add email prefixes
  if (email) {
    const emailLower = email.toLowerCase();
    for (let i = 1; i <= emailLower.length; i++) {
      prefixes.add(emailLower.substring(0, i));
    }
  }
  
  // Add phone number prefixes
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, ''); // Remove non-digits
    for (let i = 1; i <= phoneDigits.length; i++) {
      prefixes.add(phoneDigits.substring(0, i));
    }
  }
  
  return Array.from(prefixes);
}
```

## Search Query Implementation

```typescript
// Firestore query using search_prefixes array
const searchQuery = query(
  collection(db, 'leads'),
  where('search_prefixes', 'array-contains-any', [searchTerm.toLowerCase()]),
  orderBy('created_at', 'desc'),
  limit(20)
);

const results = await getDocs(searchQuery);
```
