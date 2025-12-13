'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Camera, FileText as FileTextIcon } from 'lucide-react';
import { useAuth } from '@/context/CognitoAuthContext';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface AccountDetailsFormProps {
  onComplete: () => void;
}

export function AccountDetailsForm({ onComplete }: AccountDetailsFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '',
    aboutMe: '',
    profilePhotoUrl: '',
  });

  // Load existing data
  useEffect(() => {
    if (user) {
      loadAccountDetails();
    }
  }, [user]);

  const loadAccountDetails = async () => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        console.warn('[AccountDetailsForm] No access token found');
        return;
      }

      const response = await fetch('/api/profile/account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.account) {
          setFormData({
            firstName: data.account.first_name || '',
            lastName: data.account.last_name || '',
            email: data.account.email || user?.email || '',
            phoneNumber: data.account.phoneNumber || '',
            countryCode: data.account.countryCode || '',
            aboutMe: data.account.about_me || '',
            profilePhotoUrl: data.account.profile_photo_url || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load account details:', error);
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
      const response = await fetch('/api/profile/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          profilePhotoUrl: formData.profilePhotoUrl,
          aboutMe: formData.aboutMe,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update account details');
      }

      toast.success('Account details updated successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update account details');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // TODO: Upload to S3 and get URL
    // For now, create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        profilePhotoUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Details</h2>
        <p className="text-gray-600">Update your personal information</p>
      </div>

      {/* Profile Photo */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C61] flex items-center justify-center overflow-hidden">
              {formData.profilePhotoUrl ? (
                <img
                  src={formData.profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#E05A2A] transition-colors shadow-lg"
            >
              <Camera className="w-4 h-4 text-white" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              Upload a profile photo to help others recognize you
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              Change Photo
            </Button>
          </div>
        </div>
      </div>

      {/* First Name */}
      <div className="space-y-2">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
          placeholder="Enter your first name"
          leftIcon={<User className="w-4 h-4" />}
          required
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
          placeholder="Enter your last name"
          leftIcon={<User className="w-4 h-4" />}
        />
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email ID
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          disabled
          leftIcon={<Mail className="w-4 h-4" />}
          className="bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">Email cannot be changed</p>
      </div>

      {/* Phone (Read-only) */}
      {formData.phoneNumber && (
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <Input
            id="phone"
            type="tel"
            value={`${formData.countryCode} ${formData.phoneNumber}`}
            disabled
            leftIcon={<Phone className="w-4 h-4" />}
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>
      )}

      {/* About Me */}
      <div className="space-y-2">
        <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-700">
          About Me
        </label>
        <textarea
          id="aboutMe"
          value={formData.aboutMe}
          onChange={(e) => setFormData((prev) => ({ ...prev, aboutMe: e.target.value }))}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white resize-none transition-all"
        />
        <div className="text-right text-xs text-gray-500">
          {formData.aboutMe.length}/500
        </div>
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

