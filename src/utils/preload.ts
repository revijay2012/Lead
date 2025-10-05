// Preload utilities for better performance
export const preloadComponent = (componentName: string) => {
  const componentMap: Record<string, () => Promise<any>> = {
    'SearchBar': () => import('../components/SearchBar'),
    'SearchResults': () => import('../components/SearchResults'),
    'ResultDetailDrawer': () => import('../components/ResultDetailDrawer'),
    'LeadForm': () => import('../components/LeadForm'),
    'LeadsList': () => import('../components/LeadsList'),
  };

  if (componentMap[componentName]) {
    return componentMap[componentName]();
  }
  return Promise.resolve(null);
};

// Preload critical components after initial load
export const preloadCriticalComponents = () => {
  // Use requestIdleCallback for non-blocking preloading
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent('SearchBar');
      preloadComponent('LeadsList');
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadComponent('SearchBar');
      preloadComponent('LeadsList');
    }, 100);
  }
};

// Preload on mouse hover for better UX
export const preloadOnHover = (componentName: string) => {
  return () => {
    preloadComponent(componentName);
  };
};

