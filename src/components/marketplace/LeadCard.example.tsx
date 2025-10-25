/**
 * LeadCard Component Usage Examples
 * 
 * This file demonstrates various use cases for the LeadCard component.
 * Copy and adapt these examples for your implementation.
 */

import React, { useState } from 'react';
import { LeadCard } from './LeadCard';
import { MarketplaceLead, TripType, LeadStatus } from '@/lib/types/marketplace';
import { Card } from '@/components/ui/card';
import { FaInbox } from 'react-icons/fa';

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================

export function BasicExample() {
  const sampleLead: MarketplaceLead = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Luxury African Safari Adventure',
    destination: 'Serengeti, Tanzania',
    tripType: TripType.WILDLIFE,
    budgetMin: 8000,
    budgetMax: 12000,
    durationDays: 10,
    travelersCount: 2,
    travelDateStart: new Date('2024-06-15'),
    travelDateEnd: new Date('2024-06-25'),
    specialRequirements: 'Photography focus, prefer morning game drives',
    leadQualityScore: 92,
    leadPrice: 149.99,
    status: LeadStatus.AVAILABLE,
    postedAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const handleViewDetails = (leadId: string) => {
    console.log('Viewing details for lead:', leadId);
    // Navigate to details page or open modal
  };

  const handlePurchase = (leadId: string) => {
    console.log('Purchasing lead:', leadId);
    // Show purchase confirmation
  };

  return (
    <div className="max-w-sm">
      <LeadCard
        lead={sampleLead}
        onViewDetails={handleViewDetails}
        onPurchase={handlePurchase}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Grid Layout with Multiple Leads
// ============================================================================

export function GridExample() {
  const leads: MarketplaceLead[] = [
    {
      id: '1',
      title: 'Beach Paradise Vacation',
      destination: 'Maldives',
      tripType: TripType.BEACH,
      budgetMin: 5000,
      budgetMax: 8000,
      durationDays: 7,
      travelersCount: 2,
      specialRequirements: 'Overwater bungalow preferred',
      leadQualityScore: 88,
      leadPrice: 129.99,
      status: LeadStatus.AVAILABLE,
      postedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'European Cultural Tour',
      destination: 'Rome, Paris, Barcelona',
      tripType: TripType.CULTURAL,
      budgetMin: 6000,
      budgetMax: 9000,
      durationDays: 14,
      travelersCount: 4,
      travelDateStart: new Date('2024-09-01'),
      specialRequirements: 'Art museums and historical sites focus',
      leadQualityScore: 95,
      leadPrice: 199.99,
      status: LeadStatus.AVAILABLE,
      postedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Family Disney World Adventure',
      destination: 'Orlando, Florida',
      tripType: TripType.FAMILY,
      budgetMin: 4000,
      budgetMax: 6000,
      durationDays: 5,
      travelersCount: 4,
      travelDateStart: new Date('2024-12-20'),
      specialRequirements: '2 adults, 2 children (ages 6 and 9)',
      leadQualityScore: 82,
      leadPrice: 99.99,
      status: LeadStatus.AVAILABLE,
      postedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const handleViewDetails = (leadId: string) => {
    console.log('View:', leadId);
  };

  const handlePurchase = (leadId: string) => {
    console.log('Purchase:', leadId);
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Available Leads</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onViewDetails={handleViewDetails}
            onPurchase={handlePurchase}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: With Purchased State
// ============================================================================

export function PurchasedExample() {
  const purchasedLead: MarketplaceLead = {
    id: '4',
    title: 'Luxury Honeymoon Package',
    destination: 'Santorini, Greece',
    tripType: TripType.HONEYMOON,
    budgetMin: 7000,
    budgetMax: 10000,
    durationDays: 8,
    travelersCount: 2,
    travelDateStart: new Date('2024-08-01'),
    specialRequirements: 'Romantic dinners, couples spa',
    leadQualityScore: 96,
    leadPrice: 179.99,
    status: LeadStatus.PURCHASED,
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    // These would be visible after purchase
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    customerPhone: '+1 (555) 234-5678',
  };

  return (
    <div className="max-w-sm">
      <LeadCard
        lead={purchasedLead}
        onViewDetails={(id) => console.log('View:', id)}
        onPurchase={(id) => console.log('Purchase:', id)}
        isPurchased={true}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Expiring Soon Lead
// ============================================================================

export function ExpiringSoonExample() {
  const expiringSoonLead: MarketplaceLead = {
    id: '5',
    title: 'Last Minute Mountain Trek',
    destination: 'Swiss Alps',
    tripType: TripType.ADVENTURE,
    budgetMin: 3000,
    budgetMax: 5000,
    durationDays: 6,
    travelersCount: 3,
    travelDateStart: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    specialRequirements: 'Experienced hikers, camping gear provided',
    leadQualityScore: 78,
    leadPrice: 89.99,
    status: LeadStatus.AVAILABLE,
    postedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // Expires in 18 hours
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  return (
    <div className="max-w-sm">
      <LeadCard
        lead={expiringSoonLead}
        onViewDetails={(id) => console.log('View:', id)}
        onPurchase={(id) => console.log('Purchase:', id)}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: With Loading State
// ============================================================================

export function LoadingExample() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);

  // Simulate data loading
  React.useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      // Set leads data...
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} loading />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onViewDetails={(id) => console.log('View:', id)}
          onPurchase={(id) => console.log('Purchase:', id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: With Empty State
// ============================================================================

export function EmptyStateExample() {
  const leads: MarketplaceLead[] = [];

  if (leads.length === 0) {
    return (
      <Card
        empty
        emptyState={
          <div className="text-center py-16">
            <FaInbox className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No leads available
            </h3>
            <p className="text-gray-500 mb-6">
              Check back later for new opportunities or adjust your filters
            </p>
          </div>
        }
      />
    );
  }

  return null;
}

// ============================================================================
// EXAMPLE 7: Interactive Demo with State Management
// ============================================================================

export function InteractiveDemo() {
  const [purchasedLeadIds, setPurchasedLeadIds] = useState<string[]>([]);
  const [viewedLeadId, setViewedLeadId] = useState<string | null>(null);

  const sampleLeads: MarketplaceLead[] = [
    {
      id: 'lead-1',
      title: 'Tropical Island Getaway',
      destination: 'Bali, Indonesia',
      tripType: TripType.BEACH,
      budgetMin: 3000,
      budgetMax: 5000,
      durationDays: 10,
      travelersCount: 2,
      specialRequirements: 'Scuba diving opportunities',
      leadQualityScore: 85,
      leadPrice: 119.99,
      status: LeadStatus.AVAILABLE,
      postedAt: new Date(),
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Add more sample leads...
  ];

  const handleViewDetails = (leadId: string) => {
    setViewedLeadId(leadId);
    // Open modal or navigate
    console.log('Viewing lead:', leadId);
  };

  const handlePurchase = (leadId: string) => {
    // Simulate purchase
    if (window.confirm('Purchase this lead?')) {
      setPurchasedLeadIds((prev) => [...prev, leadId]);
      alert('Lead purchased successfully!');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Interactive Demo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onViewDetails={handleViewDetails}
            onPurchase={handlePurchase}
            isPurchased={purchasedLeadIds.includes(lead.id)}
          />
        ))}
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p className="text-sm">Purchased Leads: {purchasedLeadIds.join(', ') || 'None'}</p>
        <p className="text-sm">Last Viewed: {viewedLeadId || 'None'}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Different Trip Types Showcase
// ============================================================================

export function TripTypesShowcase() {
  const tripTypes = [
    TripType.ADVENTURE,
    TripType.BEACH,
    TripType.WILDLIFE,
    TripType.LUXURY,
    TripType.BUDGET,
    TripType.FAMILY,
    TripType.HONEYMOON,
    TripType.CULTURAL,
  ];

  const createLeadForType = (tripType: TripType): MarketplaceLead => ({
    id: `lead-${tripType}`,
    title: `Amazing ${tripType.toLowerCase()} Experience`,
    destination: 'Various Destinations',
    tripType,
    budgetMin: 2000,
    budgetMax: 5000,
    durationDays: 7,
    travelersCount: 2,
    specialRequirements: 'Flexible dates',
    leadQualityScore: 80,
    leadPrice: 99.99,
    status: LeadStatus.AVAILABLE,
    postedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Trip Types Showcase</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tripTypes.map((tripType) => (
          <LeadCard
            key={tripType}
            lead={createLeadForType(tripType)}
            onViewDetails={(id) => console.log('View:', id)}
            onPurchase={(id) => console.log('Purchase:', id)}
          />
        ))}
      </div>
    </div>
  );
}

