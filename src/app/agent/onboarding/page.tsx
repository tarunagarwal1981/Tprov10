'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/CognitoAuthContext';
import { useRouter } from 'next/navigation';
import { User, Building, BriefcaseBusiness, FileText as FileTextIcon, CheckCircle } from 'lucide-react';
import { AccountDetailsForm } from '@/components/profile/AccountDetailsForm';
import { BrandDetailsForm } from '@/components/profile/BrandDetailsForm';
import { BusinessDetailsForm } from '@/components/profile/BusinessDetailsForm';
import { DocumentsForm } from '@/components/profile/DocumentsForm';

type OnboardingTab = 'account' | 'brand' | 'business' | 'documents';

interface TabConfig {
  id: OnboardingTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'account',
    label: 'Account Details',
    icon: User,
    description: 'Personal information',
  },
  {
    id: 'brand',
    label: 'Brand Details',
    icon: Building,
    description: 'Company information',
  },
  {
    id: 'business',
    label: 'Business Details',
    icon: BriefcaseBusiness,
    description: 'Business operations',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileTextIcon,
    description: 'KYC documents',
  },
];

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<OnboardingTab>('account');
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completedTabs, setCompletedTabs] = useState<Set<OnboardingTab>>(new Set());
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/phone-login');
    }
  }, [user, isInitialized, router]);

  // Fetch profile completion
  useEffect(() => {
    if (user) {
      fetchProfileCompletion();
    }
  }, [user]);

  const fetchProfileCompletion = async () => {
    try {
      if (!user) return;
      
      // Get access token from either cognito_tokens or phoneAuthSession
      const tokens = localStorage.getItem('cognito_tokens');
      const phoneSession = localStorage.getItem('phoneAuthSession');
      
      let accessToken: string | null = null;
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          accessToken = parsed.accessToken;
        } catch (e) {
          // Invalid token format
        }
      } else if (phoneSession) {
        accessToken = phoneSession;
      }
      
      if (!accessToken) {
        console.warn('[OnboardingPage] No access token found');
        return;
      }
        
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          accessToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileCompletion(data.profile.profile_completion_percentage || 0);
          // Mark tabs as completed based on data
          const newCompleted = new Set<OnboardingTab>();
          if (data.profile.account_details) newCompleted.add('account');
          if (data.profile.brand_details) newCompleted.add('brand');
          if (data.profile.business_details) newCompleted.add('business');
          if (data.profile.documents?.length > 0) newCompleted.add('documents');
          setCompletedTabs(newCompleted);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile completion:', error);
    }
  };

  const handleTabComplete = (tab: OnboardingTab) => {
    setCompletedTabs((prev) => new Set([...prev, tab]));
    fetchProfileCompletion();
    
    // Auto-advance to next incomplete tab
    const currentIndex = tabs.findIndex((t) => t.id === tab);
    const nextTab = tabs.find((t, idx) => idx > currentIndex && !completedTabs.has(t.id));
    if (nextTab) {
      setActiveTab(nextTab.id);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">
              Let&apos;s set up your profile to get started. Complete all sections to unlock full features.
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-semibold text-[#FF6B35]">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] rounded-full"
              />
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isCompleted = completedTabs.has(tab.id);
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    isActive
                      ? 'border-[#FF6B35] bg-gradient-to-br from-[#FF6B35]/10 to-white shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-lg ${
                        isActive
                          ? 'bg-[#FF6B35] text-white'
                          : isCompleted
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <h3
                    className={`font-semibold mb-1 ${
                      isActive ? 'text-[#FF6B35]' : 'text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </h3>
                  <p className="text-xs text-gray-500">{tab.description}</p>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6B35] rounded-b-xl"
                      initial={false}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8"
            >
              {activeTab === 'account' && (
                <AccountDetailsForm onComplete={() => handleTabComplete('account')} />
              )}
              {activeTab === 'brand' && (
                <BrandDetailsForm onComplete={() => handleTabComplete('brand')} />
              )}
              {activeTab === 'business' && (
                <BusinessDetailsForm onComplete={() => handleTabComplete('business')} />
              )}
              {activeTab === 'documents' && (
                <DocumentsForm onComplete={() => handleTabComplete('documents')} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {profileCompletion === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-center"
            >
              <motion.button
                onClick={() => router.push('/agent')}
                className="px-8 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Dashboard
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
  );
}


