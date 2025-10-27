/**
 * PurchaseConfirmationModal Component Usage Examples
 * 
 * This file demonstrates various use cases for the PurchaseConfirmationModal component.
 */

import React, { useState } from 'react';
import { PurchaseConfirmationModal } from './PurchaseConfirmationModal';
import { MarketplaceLead, TripType, LeadStatus } from '@/lib/types/marketplace';
import { Button } from '@/components/ui/button';
import MarketplaceService from '@/lib/services/marketplaceService';

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================

export function BasicExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    specialRequirements: 'Photography focus, prefer morning game drives',
    leadQualityScore: 92,
    leadPrice: 149.99,
    status: LeadStatus.AVAILABLE,
    postedAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Simulate purchase
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Purchase confirmed!');
      setIsOpen(false);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Purchase Lead</Button>

      <PurchaseConfirmationModal
        lead={sampleLead}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: With Service Integration
// ============================================================================

export function ServiceIntegrationExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<MarketplaceLead | null>(null);

  const handlePurchaseClick = (lead: MarketplaceLead) => {
    setSelectedLead(lead);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedLead) return;

    try {
      const currentUserId = 'current-user-id'; // Get from auth context
      await MarketplaceService.purchaseLead(selectedLead.id, currentUserId);
      
      // Show success toast
      console.log('Purchase successful!');
      
      // Close modal
      setIsOpen(false);
      
      // Refresh leads list
      // fetchLeads();
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Show error toast
      if (error.code === 'ALREADY_PURCHASED') {
        console.error('You have already purchased this lead');
      } else if (error.code === 'LEAD_UNAVAILABLE') {
        console.error('Lead is no longer available');
      } else {
        console.error('Failed to purchase lead. Please try again.');
      }
    }
  };

  return (
    <div>
      {/* Trigger button */}
      <Button onClick={() => handlePurchaseClick({
        id: 'lead-1',
        title: 'European Cultural Tour',
        destination: 'Rome, Italy',
        tripType: TripType.CULTURAL,
        budgetMin: 5000,
        budgetMax: 8000,
        durationDays: 7,
        travelersCount: 2,
        specialRequirements: 'Art museums focus',
        leadQualityScore: 88,
        leadPrice: 129.99,
        status: LeadStatus.AVAILABLE,
        postedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })}>
        Purchase Lead
      </Button>

      {selectedLead && (
        <PurchaseConfirmationModal
          lead={selectedLead}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setSelectedLead(null);
          }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: With Toast Notifications
// ============================================================================

export function WithToastExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [lead, setLead] = useState<MarketplaceLead | null>(null);

  const handleConfirm = async () => {
    if (!lead) return;

    try {
      // Purchase logic
      await MarketplaceService.purchaseLead(lead.id, 'user-id');
      
      // Success toast (using your toast library)
      // toast.success('Lead purchased successfully!', {
      //   description: `You now have access to ${lead.title}`,
      //   action: {
      //     label: 'View Lead',
      //     onClick: () => router.push(`/marketplace/leads/${lead.id}`),
      //   },
      // });
      
      setIsOpen(false);
      setLead(null);
    } catch (error: any) {
      // Error toast
      // toast.error('Purchase failed', {
      //   description: error.message || 'Please try again later',
      // });
      
      console.error(error);
    }
  };

  return (
    <div>
      <Button onClick={() => {
        setLead({
          id: 'lead-1',
          title: 'Beach Paradise Vacation',
          destination: 'Maldives',
          tripType: TripType.BEACH,
          budgetMin: 5000,
          budgetMax: 8000,
          durationDays: 7,
          travelersCount: 2,
          specialRequirements: 'Overwater bungalow',
          leadQualityScore: 95,
          leadPrice: 179.99,
          status: LeadStatus.AVAILABLE,
          postedAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsOpen(true);
      }}>
        Purchase Lead
      </Button>

      {lead && (
        <PurchaseConfirmationModal
          lead={lead}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setLead(null);
          }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: In Lead Card Integration
// ============================================================================

export function LeadCardIntegrationExample() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leads, setLeads] = useState<MarketplaceLead[]>([
    {
      id: 'lead-1',
      title: 'Adventure in the Alps',
      destination: 'Swiss Alps',
      tripType: TripType.ADVENTURE,
      budgetMin: 3000,
      budgetMax: 5000,
      durationDays: 6,
      travelersCount: 3,
      specialRequirements: 'Experienced hikers',
      leadQualityScore: 78,
      leadPrice: 89.99,
      status: LeadStatus.AVAILABLE,
      postedAt: new Date(),
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handlePurchase = async () => {
    if (!selectedLead) return;

    try {
      await MarketplaceService.purchaseLead(selectedLead.id, 'user-id');
      
      // Update lead status in local state
      setLeads(leads.map(l => 
        l.id === selectedLead.id 
          ? { ...l, status: LeadStatus.PURCHASED }
          : l
      ));
      
      setSelectedLeadId(null);
      
      // Show success message
      alert('Lead purchased successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to purchase lead');
    }
  };

  return (
    <div>
      {/* Lead cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead) => (
          <div key={lead.id} className="border rounded-lg p-4">
            <h3 className="font-bold">{lead.title}</h3>
            <p className="text-sm text-gray-600">{lead.destination}</p>
            <Button
              className="mt-4"
              onClick={() => setSelectedLeadId(lead.id)}
            >
              Buy Lead - ${lead.leadPrice}
            </Button>
          </div>
        ))}
      </div>

      {selectedLead && (
        <PurchaseConfirmationModal
          lead={selectedLead}
          isOpen={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onConfirm={handlePurchase}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: With Error Handling
// ============================================================================

export function ErrorHandlingExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lead: MarketplaceLead = {
    id: 'lead-1',
    title: 'Family Disney Vacation',
    destination: 'Orlando, Florida',
    tripType: TripType.FAMILY,
    budgetMin: 4000,
    budgetMax: 6000,
    durationDays: 5,
    travelersCount: 4,
    specialRequirements: '2 adults, 2 children',
    leadQualityScore: 82,
    leadPrice: 99.99,
    status: LeadStatus.AVAILABLE,
    postedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleConfirm = async () => {
    setError(null);
    
    try {
      await MarketplaceService.purchaseLead(lead.id, 'user-id');
      setIsOpen(false);
    } catch (err: any) {
      // Handle different error types
      if (err.code === 'ALREADY_PURCHASED') {
        setError('You have already purchased this lead');
      } else if (err.code === 'LEAD_UNAVAILABLE') {
        setError('This lead is no longer available');
      } else if (err.code === 'LEAD_EXPIRED') {
        setError('This lead has expired');
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        setError('Insufficient funds in your account');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      // Keep modal open to show error
      throw err;
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Purchase Lead</Button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <PurchaseConfirmationModal
        lead={lead}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError(null);
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: With Analytics Tracking
// ============================================================================

export function WithAnalyticsExample() {
  const [isOpen, setIsOpen] = useState(false);

  const lead: MarketplaceLead = {
    id: 'lead-1',
    title: 'Luxury Honeymoon Package',
    destination: 'Santorini, Greece',
    tripType: TripType.HONEYMOON,
    budgetMin: 7000,
    budgetMax: 10000,
    durationDays: 8,
    travelersCount: 2,
    specialRequirements: 'Romantic dinners',
    leadQualityScore: 96,
    leadPrice: 179.99,
    status: LeadStatus.AVAILABLE,
    postedAt: new Date(),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleModalOpen = () => {
    setIsOpen(true);
    
    // Track modal open
    // analytics.track('lead_purchase_modal_opened', {
    //   lead_id: lead.id,
    //   lead_title: lead.title,
    //   lead_price: lead.leadPrice,
    //   trip_type: lead.tripType,
    // });
  };

  const handleModalClose = () => {
    setIsOpen(false);
    
    // Track modal close (cancelled)
    // analytics.track('lead_purchase_modal_closed', {
    //   lead_id: lead.id,
    //   action: 'cancelled',
    // });
  };

  const handleConfirm = async () => {
    // Track purchase attempt
    // analytics.track('lead_purchase_attempted', {
    //   lead_id: lead.id,
    //   lead_price: lead.leadPrice,
    // });
    
    try {
      await MarketplaceService.purchaseLead(lead.id, 'user-id');
      
      // Track successful purchase
      // analytics.track('lead_purchase_completed', {
      //   lead_id: lead.id,
      //   lead_price: lead.leadPrice,
      //   lead_quality_score: lead.leadQualityScore,
      // });
      
      setIsOpen(false);
    } catch (error) {
      // Track failed purchase
      // analytics.track('lead_purchase_failed', {
      //   lead_id: lead.id,
      //   error: error.message,
      // });
      
      throw error;
    }
  };

  return (
    <div>
      <Button onClick={handleModalOpen}>Purchase Lead</Button>

      <PurchaseConfirmationModal
        lead={lead}
        isOpen={isOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

