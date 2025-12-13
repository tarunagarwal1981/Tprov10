'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building, User, Phone, Mail, Globe, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface BrandDetailsFormProps {
  onComplete: () => void;
}

export function BrandDetailsForm({ onComplete }: BrandDetailsFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    contactNumber: '',
    contactEmail: '',
    organisationWebsite: '',
    googleBusinessProfileId: '',
    googleBusinessProfileUrl: '',
    logoUrl: '',
  });

  useEffect(() => {
    loadBrandDetails();
  }, []);

  const loadBrandDetails = async () => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return;
      const response = await fetch('/api/profile/brand', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.brand) {
          setFormData({
            companyName: data.brand.company_name || '',
            contactPerson: data.brand.contact_person || '',
            contactNumber: data.brand.contact_number || '',
            contactEmail: data.brand.contact_email || '',
            organisationWebsite: data.brand.organisation_website || '',
            googleBusinessProfileId: data.brand.google_business_profile_id || '',
            googleBusinessProfileUrl: data.brand.google_business_profile_url || '',
            logoUrl: data.brand.logo_url || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load brand details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        toast.error('Please login again');
        return;
      }
      const response = await fetch('/api/profile/brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update brand details');
      }

      toast.success('Brand details updated successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update brand details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // TODO: Upload to S3
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        logoUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Details</h2>
        <p className="text-gray-600">Tell us about your company</p>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Logo</label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#FF6B35] transition-colors cursor-pointer relative">
          {formData.logoUrl ? (
            <div className="relative">
              <img
                src={formData.logoUrl}
                alt="Logo"
                className="max-h-48 mx-auto rounded-lg"
              />
              <label
                htmlFor="logo-upload"
                className="absolute top-2 right-2 w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#E05A2A] transition-colors shadow-lg"
              >
                <ImageIcon className="w-4 h-4 text-white" />
              </label>
            </div>
          ) : (
            <label htmlFor="logo-upload" className="cursor-pointer">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Click to upload logo</p>
              <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
            </label>
          )}
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
          Company Name
        </label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
          placeholder="Enter Company Name"
          leftIcon={<Building className="w-4 h-4" />}
          required
        />
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
          Contact Person
        </label>
        <Input
          id="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
          placeholder="Enter Contact Person"
          leftIcon={<User className="w-4 h-4" />}
        />
      </div>

      {/* Contact Number */}
      <div className="space-y-2">
        <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
          Contact Number
        </label>
        <Input
          id="contactNumber"
          type="tel"
          value={formData.contactNumber}
          onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
          placeholder="Enter Contact Number"
          leftIcon={<Phone className="w-4 h-4" />}
        />
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
          Enter Email
        </label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
          placeholder="Enter Email"
          leftIcon={<Mail className="w-4 h-4" />}
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Organisation Website
        </label>
        <Input
          id="website"
          type="url"
          value={formData.organisationWebsite}
          onChange={(e) => setFormData((prev) => ({ ...prev, organisationWebsite: e.target.value }))}
          placeholder="Enter Website"
          leftIcon={<Globe className="w-4 h-4" />}
        />
      </div>

      {/* Google Business Profile */}
      <div className="space-y-2">
        <label htmlFor="googleBusiness" className="block text-sm font-medium text-gray-700">
          Google Business Profile
        </label>
        <Input
          id="googleBusiness"
          value={formData.googleBusinessProfileId}
          onChange={(e) => setFormData((prev) => ({ ...prev, googleBusinessProfileId: e.target.value }))}
          placeholder="Search for your business on google..."
          leftIcon={<Search className="w-4 h-4" />}
        />
        <p className="text-xs text-gray-500">
          Search and select your business to enable Google reviews
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          loading={loading}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] text-white px-8"
        >
          Update
        </Button>
      </div>
    </form>
  );
}

