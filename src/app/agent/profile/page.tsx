'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { useAuth } from '@/context/CognitoAuthContext';
import { useRouter } from 'next/navigation';
import { Pencil, Phone, Mail, Globe, Building, MapPin, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    account?: any;
    brand?: any;
    business?: any;
    documents?: any[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    console.log('[ProfilePage] Starting to load profile data...');
    setLoading(true);
    try {
      const tokens = localStorage.getItem('cognito_tokens');
      if (!tokens) {
        console.warn('[ProfilePage] No tokens found in localStorage');
        setLoading(false);
        return;
      }

      const { accessToken } = JSON.parse(tokens);
      console.log('[ProfilePage] Tokens found, fetching profile data...');

      // Load all profile data in parallel
      console.log('[ProfilePage] Fetching account, brand, business, documents...');
      const [accountRes, brandRes, businessRes, documentsRes] = await Promise.all([
        fetch('/api/profile/account', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/profile/brand', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/profile/business', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/profile/documents', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      console.log('[ProfilePage] API responses received', {
        account: accountRes.status,
        brand: brandRes.status,
        business: businessRes.status,
        documents: documentsRes.status,
      });

      const account = accountRes.ok ? await accountRes.json() : null;
      const brand = brandRes.ok ? await brandRes.json() : null;
      const business = businessRes.ok ? await businessRes.json() : null;
      const documents = documentsRes.ok ? await documentsRes.json() : null;

      console.log('[ProfilePage] Profile data loaded', {
        hasAccount: !!account,
        hasBrand: !!brand,
        hasBusiness: !!business,
        documentsCount: documents?.documents?.length || 0,
      });

      setProfileData({
        account: account?.account,
        brand: brand?.brand,
        business: business?.business,
        documents: documents?.documents || [],
      });
    } catch (error) {
      console.error('[ProfilePage] Failed to load profile:', error);
    } finally {
      console.log('[ProfilePage] Profile loading complete');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AgentDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
        </div>
      </AgentDashboardLayout>
    );
  }

  const fullName = profileData?.account
    ? `${profileData.account.first_name || ''} ${profileData.account.last_name || ''}`.trim() || user?.name
    : user?.name || 'User';

  const companyName = profileData?.brand?.company_name || 'Your Company';
  const email = profileData?.account?.email || user?.email || '';
  const phone = profileData?.account?.phoneNumber
    ? `${profileData.account.countryCode || ''} ${profileData.account.phoneNumber}`
    : '';
  const website = profileData?.brand?.organisation_website || '';
  const city = profileData?.business?.city || '';
  const aboutMe = profileData?.account?.about_me || '';
  const profilePhoto = profileData?.account?.profile_photo_url || '';
  const logo = profileData?.brand?.logo_url || '';

  return (
    <AgentDashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Banner Section */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/agent/onboarding')}
              className="bg-white/90 hover:bg-white text-[#FF6B35] border-white"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative -mt-20 md:-mt-24"
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Photo */}
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C61] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl md:text-5xl text-white font-bold">
                        {fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/agent/onboarding?tab=account')}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center hover:bg-[#E05A2A] transition-colors shadow-lg"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        {fullName}
                      </h1>
                      <p className="text-lg text-[#FF6B35] font-medium mb-2">{companyName}</p>
                      {logo && (
                        <div className="mb-2">
                          <img
                            src={logo}
                            alt={companyName}
                            className="h-8 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => router.push('/agent/onboarding')}
                      className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] text-white"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      EDIT PROFILE
                    </Button>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-[#FF6B35]" />
                        <span className="text-sm">{phone}</span>
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-[#FF6B35]" />
                        <span className="text-sm">{email}</span>
                      </div>
                    )}
                    {website && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="w-4 h-4 text-[#FF6B35]" />
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF6B35] hover:underline"
                        >
                          {website}
                        </a>
                      </div>
                    )}
                    {city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-[#FF6B35]" />
                        <span className="text-sm">{city}</span>
                      </div>
                    )}
                  </div>

                  {/* About Me */}
                  {aboutMe && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">About Me</h3>
                      <p className="text-sm text-gray-600">{aboutMe}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Business Details Section */}
          {(profileData?.business || profileData?.brand) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#FF6B35]" />
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.business?.product_sold && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Product Sold</p>
                    <p className="font-medium text-gray-900">{profileData.business.product_sold}</p>
                  </div>
                )}
                {profileData.business?.company_incorporation_year && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Incorporation Year</p>
                    <p className="font-medium text-gray-900">
                      {profileData.business.company_incorporation_year}
                    </p>
                  </div>
                )}
                {profileData.business?.number_of_employees && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Employees</p>
                    <p className="font-medium text-gray-900">
                      {profileData.business.number_of_employees}
                    </p>
                  </div>
                )}
                {profileData.brand?.contact_person && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contact Person</p>
                    <p className="font-medium text-gray-900">{profileData.brand.contact_person}</p>
                  </div>
                )}
              </div>

              {/* Destinations */}
              {(profileData.business?.international_destinations?.length > 0 ||
                profileData.business?.domestic_destinations?.length > 0) && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Destinations</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.business.international_destinations?.map((dest: string) => (
                      <span
                        key={dest}
                        className="px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-xs font-medium"
                      >
                        {dest}
                      </span>
                    ))}
                    {profileData.business.domestic_destinations?.map((dest: string) => (
                      <span
                        key={dest}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {dest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Documents Section */}
          {profileData?.documents && profileData.documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF6B35] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{doc.document_name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    {doc.viewUrl && (
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#FF6B35] hover:underline"
                      >
                        View Document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Listings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Listings</h2>
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No listings found!</p>
              <p className="text-sm">Start creating your first listing to showcase your services.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </AgentDashboardLayout>
  );
}

