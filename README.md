# LEADS Management System

A comprehensive lead management system built with React, TypeScript, and Firebase Firestore. Features advanced search capabilities, real-time data management, and a modern user interface.

## 🚀 Features

- **Lead Management**: Create, read, update, and view leads
- **Advanced Search**: Search by name, email, phone, company with real-time filtering
- **Firebase Integration**: Real-time data synchronization with Firestore
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Optimized Performance**: Lazy loading and code splitting

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/revijay2012/Leads.git
cd Leads
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## 🚀 Quick Start

The easiest way to get started is using the provided startup script:

```bash
./start.sh
```

This script will:
- Clean up any existing processes
- Start Firebase emulators
- Seed the database with sample data
- Start the React development server

## 📋 Available Scripts

- `npm run dev` - Start development server with emulators and data seeding
- `npm run start` - Same as dev (alias)
- `npm run dev:app` - Start only the React development server
- `npm run emulators` - Start Firebase emulators only
- `npm run seed:search` - Seed database with search-optimized data
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔥 Firebase Emulators

The project uses Firebase emulators for local development:

- **Firestore**: http://localhost:8080
- **Firebase UI**: http://localhost:4002
- **Authentication**: http://localhost:9098
- **Functions**: http://localhost:5002

## 🔍 Search Features

The system includes advanced search capabilities:

- **Prefix Search**: Search by name, email, phone, or company
- **Real-time Filtering**: Filter by status, source, and tags
- **Optimized Queries**: Uses Firestore's search_prefixes for fast partial matching
- **Debounced Input**: 300ms debounce for optimal performance

## 📊 Data Structure

### Lead Document
```typescript
interface Lead {
  lead_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  stage: LeadStage;
  contract_value: number;
  search_prefixes: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
  // ... additional fields
}
```

### Search Optimization
- `full_name_lower`: Lowercase name for case-insensitive search
- `email_lower`: Lowercase email for case-insensitive search
- `phone_digits`: Digits-only phone for number search
- `search_prefixes`: Array of prefixes for partial text matching

## 🎨 UI Components

- **LeadsList**: Display all leads with pagination
- **SearchBar**: Advanced search with filters
- **LeadForm**: Create and edit leads
- **ResultDetailDrawer**: View lead details
- **TestConnection**: Debug Firebase connection

## 🔧 Configuration

### Firebase Configuration
The app automatically connects to Firebase emulators in development mode. Configuration is in `src/firebase/config.ts`.

### Environment Variables
Create a `.env` file for production configuration:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to your preferred hosting service:
- Vercel
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Vijayaraghavan Devaraj**
- GitHub: [@revijay2012](https://github.com/revijay2012)

## 🙏 Acknowledgments

- Firebase team for excellent documentation
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Lucide for beautiful icons