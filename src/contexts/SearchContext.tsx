import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { SearchResult, SearchFilters, LeadStatus, AccountStatus } from '../types/firestore';

// Search modes
export type SearchMode = 'leads' | 'activities' | 'proposals' | 'contracts' | 'global';

// Search state
interface SearchState {
  mode: SearchMode;
  term: string;
  filters: SearchFilters;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: any;
  selectedResult: SearchResult | null;
  recentSearches: string[];
  cache: Map<string, SearchResult[]>;
}

// Search actions
type SearchAction =
  | { type: 'SET_MODE'; payload: SearchMode }
  | { type: 'SET_TERM'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: { results: SearchResult[]; append?: boolean } }
  | { type: 'SET_SELECTED'; payload: SearchResult | null }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'ADD_RECENT_SEARCH'; payload: string }
  | { type: 'CLEAR_RECENT_SEARCHES' }
  | { type: 'SET_CACHE'; payload: { key: string; results: SearchResult[] } }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_LAST_DOC'; payload: any };

// Initial state
const initialState: SearchState = {
  mode: 'global',
  term: '',
  filters: {},
  results: [],
  loading: false,
  error: null,
  hasMore: false,
  lastDoc: null,
  selectedResult: null,
  recentSearches: [],
  cache: new Map(),
};

// Reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        results: [],
        lastDoc: null,
        hasMore: false,
      };
    
    case 'SET_TERM':
      return {
        ...state,
        term: action.payload,
        results: [],
        lastDoc: null,
        hasMore: false,
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        results: [],
        lastDoc: null,
        hasMore: false,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload.append 
          ? [...state.results, ...action.payload.results]
          : action.payload.results,
        loading: false,
        error: null,
      };
    
    case 'SET_SELECTED':
      return {
        ...state,
        selectedResult: action.payload,
      };
    
    case 'CLEAR_RESULTS':
      return {
        ...state,
        results: [],
        lastDoc: null,
        hasMore: false,
      };
    
    case 'ADD_RECENT_SEARCH':
      const newRecentSearches = [
        action.payload,
        ...state.recentSearches.filter(search => search !== action.payload)
      ].slice(0, 10); // Keep only last 10 searches
      
      return {
        ...state,
        recentSearches: newRecentSearches,
      };
    
    case 'CLEAR_RECENT_SEARCHES':
      return {
        ...state,
        recentSearches: [],
      };
    
    case 'SET_CACHE':
      const newCache = new Map(state.cache);
      newCache.set(action.payload.key, action.payload.results);
      return {
        ...state,
        cache: newCache,
      };
    
    case 'SET_HAS_MORE':
      return {
        ...state,
        hasMore: action.payload,
      };
    
    case 'SET_LAST_DOC':
      return {
        ...state,
        lastDoc: action.payload,
      };
    
    default:
      return state;
  }
}

// Context
interface SearchContextType {
  state: SearchState;
  setMode: (mode: SearchMode) => void;
  setTerm: (term: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (results: SearchResult[], append?: boolean) => void;
  setSelected: (result: SearchResult | null) => void;
  clearResults: () => void;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  setHasMore: (hasMore: boolean) => void;
  setLastDoc: (lastDoc: any) => void;
  getCachedResults: (key: string) => SearchResult[] | undefined;
  setCachedResults: (key: string, results: SearchResult[]) => void;
  // Computed values
  isSearching: boolean;
  hasResults: boolean;
  searchKey: string;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider component
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Memoized actions
  const setMode = useCallback((mode: SearchMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_TERM', payload: term });
  }, []);

  const setFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setResults = useCallback((results: SearchResult[], append = false) => {
    dispatch({ type: 'SET_RESULTS', payload: { results, append } });
  }, []);

  const setSelected = useCallback((result: SearchResult | null) => {
    dispatch({ type: 'SET_SELECTED', payload: result });
  }, []);

  const clearResults = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' });
  }, []);

  const addRecentSearch = useCallback((term: string) => {
    if (term.trim()) {
      dispatch({ type: 'ADD_RECENT_SEARCH', payload: term.trim() });
    }
  }, []);

  const clearRecentSearches = useCallback(() => {
    dispatch({ type: 'CLEAR_RECENT_SEARCHES' });
  }, []);

  const setHasMore = useCallback((hasMore: boolean) => {
    dispatch({ type: 'SET_HAS_MORE', payload: hasMore });
  }, []);

  const setLastDoc = useCallback((lastDoc: any) => {
    dispatch({ type: 'SET_LAST_DOC', payload: lastDoc });
  }, []);

  const getCachedResults = useCallback((key: string) => {
    return state.cache.get(key);
  }, [state.cache]);

  const setCachedResults = useCallback((key: string, results: SearchResult[]) => {
    dispatch({ type: 'SET_CACHE', payload: { key, results } });
  }, []);

  // Computed values
  const isSearching = state.loading;
  const hasResults = state.results.length > 0;
  const searchKey = useMemo(() => {
    return `${state.mode}-${state.term}-${JSON.stringify(state.filters)}`;
  }, [state.mode, state.term, state.filters]);

  const value: SearchContextType = {
    state,
    setMode,
    setTerm,
    setFilters,
    setLoading,
    setError,
    setResults,
    setSelected,
    clearResults,
    addRecentSearch,
    clearRecentSearches,
    setHasMore,
    setLastDoc,
    getCachedResults,
    setCachedResults,
    isSearching,
    hasResults,
    searchKey,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

// Hook to use search context
export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}

// Custom hook for search functionality
export function useSearch() {
  const {
    state,
    setMode,
    setTerm,
    setFilters,
    setLoading,
    setError,
    setResults,
    setSelected,
    clearResults,
    addRecentSearch,
    setHasMore,
    setLastDoc,
    getCachedResults,
    setCachedResults,
    searchKey,
  } = useSearchContext();

  // Load recent searches from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        const recentSearches = JSON.parse(saved);
        recentSearches.forEach((search: string) => {
          addRecentSearch(search);
        });
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, [addRecentSearch]);

  // Save recent searches to localStorage
  React.useEffect(() => {
    if (state.recentSearches.length > 0) {
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    }
  }, [state.recentSearches]);

  return {
    // State
    mode: state.mode,
    term: state.term,
    filters: state.filters,
    results: state.results,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    lastDoc: state.lastDoc,
    selectedResult: state.selectedResult,
    recentSearches: state.recentSearches,
    
    // Actions
    setMode,
    setTerm,
    setFilters,
    setSelected,
    clearResults,
    addRecentSearch,
    
    // Search functionality
    searchKey,
    getCachedResults,
    setCachedResults,
    setLoading,
    setError,
    setResults,
    setHasMore,
    setLastDoc,
  };
}
