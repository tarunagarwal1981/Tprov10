/**
 * LeadFilters Component Usage Examples
 * 
 * This file demonstrates various use cases for the LeadFilters component.
 */

import React, { useState } from 'react';
import { LeadFilters } from './LeadFilters';
import { LeadFilters as LeadFiltersType, TripType } from '@/lib/types/marketplace';

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================

export function BasicExample() {
  const [filters, setFilters] = useState<LeadFiltersType>({});

  const handleFiltersChange = (newFilters: LeadFiltersType) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
    // Fetch leads with new filters...
  };

  const handleReset = () => {
    setFilters({});
    console.log('Filters reset');
    // Fetch all leads...
  };

  return (
    <div className="max-w-sm">
      <LeadFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: With Sidebar Layout
// ============================================================================

export function SidebarExample() {
  const [filters, setFilters] = useState<LeadFiltersType>({});

  return (
    <div className="flex gap-6">
      {/* Filters Sidebar */}
      <aside className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <LeadFilters
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({})}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <h2 className="text-2xl font-bold mb-4">Lead Results</h2>
        <div className="text-sm text-gray-500 mb-4">
          {Object.keys(filters).filter((k) => filters[k as keyof LeadFiltersType] !== undefined).length > 0
            ? `${Object.keys(filters).filter((k) => filters[k as keyof LeadFiltersType] !== undefined).length} filters applied`
            : 'No filters applied'}
        </div>
        {/* Lead cards grid would go here */}
      </main>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: With Pre-applied Filters
// ============================================================================

export function PrefilledExample() {
  const [filters, setFilters] = useState<LeadFiltersType>({
    destination: 'Paris',
    tripType: TripType.CULTURAL,
    budgetMin: 5000,
    budgetMax: 10000,
    durationMin: 7,
    durationMax: 14,
    minQualityScore: 80,
  });

  return (
    <div className="max-w-sm">
      <LeadFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: With Real-time Search
// ============================================================================

export function RealTimeSearchExample() {
  const [filters, setFilters] = useState<LeadFiltersType>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFiltersChange = async (newFilters: LeadFiltersType) => {
    setFilters(newFilters);
    setLoading(true);

    // Simulate API call
    try {
      // await MarketplaceService.getAvailableLeads(newFilters);
      console.log('Fetching leads with filters:', newFilters);
      
      setTimeout(() => {
        setResults([/* mock results */]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6">
      <aside className="w-80">
        <LeadFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={() => {
            setFilters({});
            handleFiltersChange({});
          }}
        />
      </aside>

      <main className="flex-1">
        <h2 className="text-2xl font-bold mb-4">Search Results</h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="text-gray-700">
            {results.length} leads found
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Mobile Responsive with Collapsible Filters
// ============================================================================

export function MobileResponsiveExample() {
  const [filters, setFilters] = useState<LeadFiltersType>({});
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="container mx-auto p-4">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg flex items-center justify-center gap-2"
        >
          <span>Filters</span>
          {Object.keys(filters).filter((k) => filters[k as keyof LeadFiltersType] !== undefined).length > 0 && (
            <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs font-bold">
              {Object.keys(filters).filter((k) => filters[k as keyof LeadFiltersType] !== undefined).length}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar / Mobile Drawer */}
        <aside
          className={`
            w-80 flex-shrink-0
            lg:block
            ${showFilters ? 'block' : 'hidden'}
            fixed lg:relative inset-0 lg:inset-auto
            z-50 lg:z-auto
            bg-white lg:bg-transparent
            p-4 lg:p-0
          `}
        >
          <div className="sticky top-6">
            <LeadFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                // Close mobile filters on apply
                if (window.innerWidth < 1024) {
                  setShowFilters(false);
                }
              }}
              onReset={() => {
                setFilters({});
                if (window.innerWidth < 1024) {
                  setShowFilters(false);
                }
              }}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Lead Marketplace</h2>
          {/* Lead cards grid */}
        </main>
      </div>

      {/* Mobile Overlay */}
      {showFilters && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: With URL Query Parameters (Advanced)
// ============================================================================

export function URLParamsExample() {
  // This example shows how to sync filters with URL params
  const [filters, setFilters] = useState<LeadFiltersType>({});

  // On mount, read filters from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtersFromURL: LeadFiltersType = {};

    if (params.get('destination')) {
      filtersFromURL.destination = params.get('destination') as string;
    }
    if (params.get('tripType')) {
      filtersFromURL.tripType = params.get('tripType') as TripType;
    }
    if (params.get('budgetMin')) {
      filtersFromURL.budgetMin = parseInt(params.get('budgetMin')!);
    }
    if (params.get('budgetMax')) {
      filtersFromURL.budgetMax = parseInt(params.get('budgetMax')!);
    }
    if (params.get('durationMin')) {
      filtersFromURL.durationMin = parseInt(params.get('durationMin')!);
    }
    if (params.get('durationMax')) {
      filtersFromURL.durationMax = parseInt(params.get('durationMax')!);
    }
    if (params.get('minQualityScore')) {
      filtersFromURL.minQualityScore = parseInt(params.get('minQualityScore')!);
    }

    setFilters(filtersFromURL);
  }, []);

  // Update URL when filters change
  const handleFiltersChange = (newFilters: LeadFiltersType) => {
    setFilters(newFilters);

    // Update URL
    const params = new URLSearchParams();
    if (newFilters.destination) params.set('destination', newFilters.destination);
    if (newFilters.tripType) params.set('tripType', newFilters.tripType);
    if (newFilters.budgetMin) params.set('budgetMin', String(newFilters.budgetMin));
    if (newFilters.budgetMax) params.set('budgetMax', String(newFilters.budgetMax));
    if (newFilters.durationMin) params.set('durationMin', String(newFilters.durationMin));
    if (newFilters.durationMax) params.set('durationMax', String(newFilters.durationMax));
    if (newFilters.minQualityScore) params.set('minQualityScore', String(newFilters.minQualityScore));

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newURL);
  };

  const handleReset = () => {
    setFilters({});
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="max-w-sm">
      <LeadFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: With Filter Persistence (LocalStorage)
// ============================================================================

export function PersistentFiltersExample() {
  const [filters, setFilters] = useState<LeadFiltersType>(() => {
    // Load filters from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketplace-filters');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return {};
        }
      }
    }
    return {};
  });

  const handleFiltersChange = (newFilters: LeadFiltersType) => {
    setFilters(newFilters);
    // Save to localStorage
    localStorage.setItem('marketplace-filters', JSON.stringify(newFilters));
  };

  const handleReset = () => {
    setFilters({});
    localStorage.removeItem('marketplace-filters');
  };

  return (
    <div className="max-w-sm">
      <LeadFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
      />
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        💡 Your filters are saved and will persist across page reloads
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: With Filter Summary Badge
// ============================================================================

export function FilterSummaryExample() {
  const [filters, setFilters] = useState<LeadFiltersType>({});

  const getFilterSummary = (): string[] => {
    const summary: string[] = [];
    
    if (filters.destination) {
      summary.push(`Destination: ${filters.destination}`);
    }
    if (filters.tripType) {
      summary.push(`Type: ${filters.tripType}`);
    }
    if (filters.budgetMin || filters.budgetMax) {
      const min = filters.budgetMin || 0;
      const max = filters.budgetMax || '∞';
      summary.push(`Budget: $${min} - $${max}`);
    }
    if (filters.durationMin || filters.durationMax) {
      const min = filters.durationMin || 0;
      const max = filters.durationMax || '∞';
      summary.push(`Duration: ${min}-${max} days`);
    }
    if (filters.minQualityScore) {
      summary.push(`Quality: ${filters.minQualityScore}+`);
    }

    return summary;
  };

  return (
    <div>
      <div className="max-w-sm mb-4">
        <LeadFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({})}
        />
      </div>

      {/* Filter Summary */}
      {getFilterSummary().length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getFilterSummary().map((summary, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
            >
              {summary}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

