/**
 * Activity Package Mapper
 * Transformation functions between form data and database format
 * 
 * Note: These functions were previously in supabase/activity-packages.ts
 * They have been moved here to remove Supabase dependencies.
 */

import type { ActivityPackageFormData, PoliciesRestrictions } from '@/lib/types/activity-package';

// #region agent log
const logDebug = (location: string, message: string, data: any) => {
  fetch('http://127.0.0.1:7242/ingest/49068dc8-f902-41f7-b386-ad8741731eba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
};
// #endregion

export function formDataToDatabase(
  formData: ActivityPackageFormData,
  userId: string,
  status: 'draft' | 'published' | 'archived' | 'suspended' = 'draft'
): any {
  // #region agent log
  logDebug('activity-packages-mapper.ts:14', 'formDataToDatabase called', {
    hasBasicInfo: !!formData.basicInformation,
    hasActivityDetails: !!formData.activityDetails,
    hasPricing: !!formData.pricing,
    status,
    userId: userId?.substring(0, 8) + '...'
  });
  // #endregion

  const basicInfo = formData.basicInformation || {};
  const activityDetails = formData.activityDetails || {};
  const policies: Partial<PoliciesRestrictions> = formData.policiesRestrictions || {};
  const variants = formData.packageVariants || {};
  const faq = formData.faq || {};
  
  // Helper to format coordinates as text (database stores as TEXT, not POINT)
  const formatCoordinates = (coords: { latitude: number; longitude: number } | undefined) => {
    if (!coords || (coords.latitude === 0 && coords.longitude === 0)) return '';
    return `${coords.latitude},${coords.longitude}`;
  };

  // Helper to format date for published_at
  const publishedAt = status === 'published' ? new Date().toISOString() : null;

  // Build package data object matching database schema
  const packageData: any = {
    operator_id: userId,
    status,
    // Basic Information
    title: basicInfo.title || '',
    short_description: basicInfo.shortDescription || '',
    full_description: basicInfo.fullDescription || '',
    // Destination
    destination_name: basicInfo.destination?.name || '',
    destination_address: basicInfo.destination?.address || '',
    destination_city: basicInfo.destination?.city || '',
    destination_country: basicInfo.destination?.country || '',
    destination_postal_code: basicInfo.destination?.postalCode || null,
    destination_coordinates: formatCoordinates(basicInfo.destination?.coordinates),
    // Duration
    duration_hours: basicInfo.duration?.hours || 2,
    duration_minutes: basicInfo.duration?.minutes || 0,
    // Defaults (not in form UI but required by DB)
    difficulty_level: 'EASY',
    languages_supported: ['EN'],
    tags: [],
    // Meeting Point
    meeting_point_name: activityDetails.meetingPoint?.name || '',
    meeting_point_address: activityDetails.meetingPoint?.address || '',
    meeting_point_coordinates: formatCoordinates(activityDetails.meetingPoint?.coordinates),
    meeting_point_instructions: activityDetails.meetingPoint?.instructions || '',
    // Operating Days (from time slots)
    operating_days: activityDetails.operationalHours?.operatingDays || [],
    // What's Included/Excluded/Bring
    whats_included: activityDetails.whatsIncluded || [],
    whats_not_included: activityDetails.whatsNotIncluded || [],
    what_to_bring: activityDetails.whatToBring || [],
    important_information: activityDetails.importantInformation || '',
    // Age Restrictions (from policies - deprecated but kept for DB compatibility)
    minimum_age: policies.ageRestrictions?.minimumAge || 0,
    maximum_age: policies.ageRestrictions?.maximumAge ? String(policies.ageRestrictions.maximumAge) : null,
    child_policy: policies.ageRestrictions?.childPolicy || null,
    infant_policy: policies.ageRestrictions?.infantPolicy || null,
    age_verification_required: policies.ageRestrictions?.ageVerificationRequired || false,
    // Accessibility
    wheelchair_accessible: policies.accessibility?.wheelchairAccessible || false,
    accessibility_facilities: policies.accessibility?.facilities || [],
    special_assistance: policies.accessibility?.specialAssistance || null,
    // Cancellation Policy
    cancellation_policy_type: policies.cancellationPolicy?.type || 'MODERATE',
    cancellation_policy_custom: policies.cancellationPolicy?.customPolicy || null,
    cancellation_refund_percentage: policies.cancellationPolicy?.refundPercentage || 50,
    cancellation_deadline_hours: policies.cancellationPolicy?.cancellationDeadline || 24,
    // Weather Policy
    weather_policy: policies.weatherPolicy || '',
    // Health & Safety
    health_safety_requirements: policies.healthSafety?.requirements || [],
    health_safety_additional_info: policies.healthSafety?.additionalInfo || null,
    // Pricing (defaults - actual pricing comes from pricingOptions)
    // Note: basePrice, priceType, childPrice, infantPrice, groupDiscounts, and seasonalPricing
    // are deprecated and not in the PricingInfo type. They are set to defaults here.
    base_price: 0,
    currency: formData.pricing?.currency || 'USD',
    price_type: 'PERSON',
    child_price_type: null,
    child_price_value: null,
    infant_price: null,
    group_discounts: [],
    seasonal_pricing: [],
    // Dynamic Pricing (defaults)
    dynamic_pricing_enabled: false,
    dynamic_pricing_base_multiplier: 1.0,
    dynamic_pricing_demand_multiplier: 1.0,
    dynamic_pricing_season_multiplier: 1.0,
    // SEO
    slug: basicInfo.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '',
    meta_title: basicInfo.title || '',
    meta_description: basicInfo.shortDescription || '',
    published_at: publishedAt,
  };

  // Transform images from form format to database format
  const images: any[] = [];
  
  // Add featured image if present
  if (basicInfo.featuredImage) {
    images.push({
      file_name: basicInfo.featuredImage.fileName || 'featured.jpg',
      file_size: basicInfo.featuredImage.fileSize || 0,
      mime_type: basicInfo.featuredImage.mimeType || 'image/jpeg',
      storage_path: basicInfo.featuredImage.url || '',
      public_url: basicInfo.featuredImage.url || null,
      alt_text: basicInfo.featuredImage.fileName || '',
      is_cover: true,
      is_featured: true,
      display_order: 0,
    });
  }
  
  // Add gallery images
  if (basicInfo.imageGallery && Array.isArray(basicInfo.imageGallery)) {
    basicInfo.imageGallery.forEach((img, index) => {
      images.push({
        file_name: img.fileName || `image_${index}.jpg`,
        file_size: img.fileSize || 0,
        mime_type: img.mimeType || 'image/jpeg',
        storage_path: img.url || '',
        public_url: img.url || null,
        alt_text: img.fileName || '',
        is_cover: false,
        is_featured: false,
        display_order: index + (basicInfo.featuredImage ? 1 : 0),
      });
    });
  }

  // Transform time slots from form format to database format
  const time_slots: any[] = [];
  if (activityDetails.operationalHours?.timeSlots && Array.isArray(activityDetails.operationalHours.timeSlots)) {
    activityDetails.operationalHours.timeSlots.forEach((slot, index) => {
      time_slots.push({
        start_time: slot.startTime || '09:00',
        end_time: slot.endTime || '17:00',
        capacity: slot.capacity || 10,
        is_active: slot.isActive !== false,
        days: slot.days || [],
        display_order: index,
      });
    });
  }

  // Transform variants from form format to database format
  const variants_data: any[] = [];
  if (variants.variants && Array.isArray(variants.variants)) {
    variants.variants.forEach((variant, index) => {
      variants_data.push({
        name: variant.name || '',
        description: variant.description || '',
        price_adjustment: variant.priceAdjustment || 0,
        features: variant.features || [],
        max_capacity: variant.maxCapacity || 10,
        is_active: variant.isActive !== false,
        display_order: index,
      });
    });
  }

  // Transform FAQs from form format to database format
  const faqs_data: any[] = [];
  if (faq.faqs && Array.isArray(faq.faqs)) {
    faq.faqs.forEach((faqItem, index) => {
      faqs_data.push({
        question: faqItem.question || '',
        answer: faqItem.answer || '',
        category: faqItem.category || 'GENERAL',
        display_order: index,
      });
    });
  }

  // #region agent log
  logDebug('activity-packages-mapper.ts:200', 'formDataToDatabase result', {
    hasPackage: !!packageData,
    packageTitle: packageData.title,
    imagesCount: images.length,
    timeSlotsCount: time_slots.length,
    variantsCount: variants_data.length,
    faqsCount: faqs_data.length,
  });
  // #endregion

  return {
    package: packageData,
    images,
    time_slots,
    variants: variants_data,
    faqs: faqs_data,
  };
}

export function databaseToFormData(dbPackage: any): ActivityPackageFormData {
  // TODO: Implement proper transformation
  // This is a placeholder to prevent import errors
  // The actual implementation should map database schema to ActivityPackageFormData
  console.warn('databaseToFormData for activity packages needs implementation');
  
  // Return default form data structure
  return {
    basicInformation: {
      title: dbPackage?.title || '',
      shortDescription: dbPackage?.short_description || '',
      fullDescription: dbPackage?.full_description || '',
      destination: {
        name: dbPackage?.destination_name || '',
        address: dbPackage?.destination_address || '',
        city: dbPackage?.destination_city || '',
        country: dbPackage?.destination_country || '',
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
      },
      duration: {
        hours: dbPackage?.duration_hours || 0,
        minutes: dbPackage?.duration_minutes || 0,
      },
      featuredImage: null,
      imageGallery: [],
    },
    activityDetails: {
      operationalHours: {
        operatingDays: [],
        timeSlots: [],
      },
      meetingPoint: {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        instructions: '',
        images: [],
      },
      whatToBring: [],
      whatsIncluded: [],
      whatsNotIncluded: [],
      importantInformation: '',
    },
    policiesRestrictions: {
      cancellationPolicy: {
        type: 'MODERATE',
        refundPercentage: 50,
        cancellationDeadline: 24,
      },
      weatherPolicy: '',
      healthSafety: {
        requirements: [],
        additionalInfo: '',
      },
      accessibility: {
        wheelchairAccessible: false,
        facilities: [],
        specialAssistance: '',
      },
      ageRestrictions: {
        minimumAge: 0,
        maximumAge: undefined,
        childPolicy: '',
        infantPolicy: '',
        ageVerificationRequired: false,
      },
    },
    packageVariants: {
      variants: [],
    },
    faq: {
      faqs: [],
    },
    pricing: {
      currency: 'USD',
    },
    pricingOptions: [],
  };
}

