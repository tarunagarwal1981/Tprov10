'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BriefcaseBusiness, Calendar, MapPin, User, Target } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessDetailsFormProps {
  onComplete: () => void;
}

const PRODUCTS_SOLD = [
  'Domestic Tours',
  'International Tours',
  'Flight Bookings',
  'Hotel Bookings',
  'Visa Services',
  'Travel Insurance',
  'Car Rentals',
  'Cruise Packages',
];

const CUSTOMER_ACQUISITION = ['Facebook', 'Google Ads', 'Word of mouth'];

const INTERNATIONAL_DESTINATIONS = [
  'Dubai',
  'Hong Kong',
  'Malaysia',
  'Maldives',
  'Mauritius',
  'Singapore',
  'Sri Lanka',
  'Thailand',
  'Vietnam',
  'Azerbaijan',
  'Indonesia',
  'Saudi Arabia',
  'Cruises',
  'Fixed Departure',
  'Oman',
];

const DOMESTIC_DESTINATIONS = ['Qatar', 'America'];

const YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

export function BusinessDetailsForm({ onComplete }: BusinessDetailsFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productSold: '',
    companyIncorporationYear: '',
    city: '',
    numberOfEmployees: '',
    customerAcquisition: [] as string[],
    internationalDestinations: [] as string[],
    domesticDestinations: [] as string[],
  });

  useEffect(() => {
    loadBusinessDetails();
  }, []);

  const loadBusinessDetails = async () => {
    try {
      const tokens = localStorage.getItem('cognito_tokens');
      if (!tokens) return;

      const { accessToken } = JSON.parse(tokens);
      const response = await fetch('/api/profile/business', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.business) {
          setFormData({
            productSold: data.business.product_sold || '',
            companyIncorporationYear: data.business.company_incorporation_year?.toString() || '',
            city: data.business.city || '',
            numberOfEmployees: data.business.number_of_employees?.toString() || '',
            customerAcquisition: data.business.customer_acquisition || [],
            internationalDestinations: data.business.international_destinations || [],
            domesticDestinations: data.business.domestic_destinations || [],
          });
        }
      }
    } catch (error) {
      console.error('Failed to load business details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokens = localStorage.getItem('cognito_tokens');
      if (!tokens) {
        toast.error('Please login again');
        return;
      }

      const { accessToken } = JSON.parse(tokens);
      const response = await fetch('/api/profile/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productSold: formData.productSold,
          companyIncorporationYear: formData.companyIncorporationYear
            ? parseInt(formData.companyIncorporationYear)
            : null,
          city: formData.city,
          numberOfEmployees: formData.numberOfEmployees
            ? parseInt(formData.numberOfEmployees)
            : null,
          customerAcquisition: formData.customerAcquisition,
          internationalDestinations: formData.internationalDestinations,
          domesticDestinations: formData.domesticDestinations,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update business details');
      }

      toast.success('Business details updated successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update business details');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (
    array: string[],
    item: string,
    setter: (arr: string[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Details</h2>
        <p className="text-gray-600">Tell us about your business operations</p>
      </div>

      {/* Product Sold */}
      <div className="space-y-2">
        <label htmlFor="productSold" className="block text-sm font-medium text-gray-700">
          Product Sold
        </label>
        <select
          id="productSold"
          value={formData.productSold}
          onChange={(e) => setFormData((prev) => ({ ...prev, productSold: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white"
        >
          <option value="">Select product sold</option>
          {PRODUCTS_SOLD.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </div>

      {/* Incorporation Year */}
      <div className="space-y-2">
        <label
          htmlFor="incorporationYear"
          className="block text-sm font-medium text-gray-700"
        >
          Company Incorporation Year
        </label>
        <select
          id="incorporationYear"
          value={formData.companyIncorporationYear}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, companyIncorporationYear: e.target.value }))
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white"
        >
          <option value="">Select company incorporation year</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          City
        </label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="Enter city"
          leftIcon={<MapPin className="w-4 h-4" />}
        />
      </div>

      {/* Number of Employees */}
      <div className="space-y-2">
        <label htmlFor="employees" className="block text-sm font-medium text-gray-700">
          Number of Employees
        </label>
        <Input
          id="employees"
          type="number"
          value={formData.numberOfEmployees}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, numberOfEmployees: e.target.value }))
          }
          placeholder="Enter number of employees"
          leftIcon={<User className="w-4 h-4" />}
          min="0"
        />
      </div>

      {/* Customer Acquisition */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Customer Acquisition
        </label>
        <div className="flex flex-wrap gap-3">
          {CUSTOMER_ACQUISITION.map((method) => (
            <motion.label
              key={method}
              className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-300 hover:border-[#FF6B35] transition-colors bg-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={formData.customerAcquisition.includes(method)}
                onChange={() =>
                  toggleArrayItem(
                    formData.customerAcquisition,
                    method,
                    (arr) => setFormData((prev) => ({ ...prev, customerAcquisition: arr }))
                  )
                }
                className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-sm text-gray-700">{method}</span>
            </motion.label>
          ))}
        </div>
      </div>

      {/* International Destinations */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          International Destination
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INTERNATIONAL_DESTINATIONS.map((destination) => (
            <motion.label
              key={destination}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg border border-gray-300 hover:border-[#FF6B35] transition-colors bg-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={formData.internationalDestinations.includes(destination)}
                onChange={() =>
                  toggleArrayItem(
                    formData.internationalDestinations,
                    destination,
                    (arr) => setFormData((prev) => ({ ...prev, internationalDestinations: arr }))
                  )
                }
                className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-sm text-gray-700">{destination}</span>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Domestic Destinations */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Domestic Destination
        </label>
        <div className="flex flex-wrap gap-3">
          {DOMESTIC_DESTINATIONS.map((destination) => (
            <motion.label
              key={destination}
              className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-300 hover:border-[#FF6B35] transition-colors bg-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={formData.domesticDestinations.includes(destination)}
                onChange={() =>
                  toggleArrayItem(
                    formData.domesticDestinations,
                    destination,
                    (arr) => setFormData((prev) => ({ ...prev, domesticDestinations: arr }))
                  )
                }
                className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-sm text-gray-700">{destination}</span>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          loading={loading}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] text-white px-8"
        >
          Submit
        </Button>
      </div>
    </form>
  );
}

