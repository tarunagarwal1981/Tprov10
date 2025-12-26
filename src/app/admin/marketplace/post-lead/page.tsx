'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import {
  FiSave,
  FiEye,
  FiSend,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiStar,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/useToast';
import { TripType, LeadStatus } from '@/lib/types/marketplace';
import { useRouter } from 'next/navigation';

// Form schema with zod validation
const leadFormSchema = z.object({
  // Lead Information
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be at most 100 characters'),
  destination: z.string().min(2, 'Destination is required'),
  tripType: z.nativeEnum(TripType),
  budgetMin: z.number().min(100, 'Minimum budget must be at least $100'),
  budgetMax: z.number().min(100, 'Maximum budget must be at least $100'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Duration must be at most 365 days'),
  travelersCount: z.number().min(1, 'At least 1 traveler is required').max(50, 'Maximum 50 travelers'),
  travelDateStart: z.string().optional(),
  travelDateEnd: z.string().optional(),
  specialRequirements: z.string().max(1000, 'Special requirements must be at most 1000 characters'),
  
  // Customer Information
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  detailedRequirements: z.string().max(2000, 'Detailed requirements must be at most 2000 characters').optional(),
  
  // Pricing
  leadPrice: z.number().min(10, 'Lead price must be at least $10').max(10000, 'Lead price must be at most $10,000'),
  leadQualityScore: z.number().min(1, 'Quality score must be between 1-100').max(100, 'Quality score must be between 1-100'),
  expiresAt: z.string().min(1, 'Expiration date is required'),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
});

type LeadFormData = z.infer<typeof leadFormSchema>;

// Preview component
function LeadPreview({ data }: { data: Partial<LeadFormData> }) {
  if (!data.title) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6"
    >
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FiEye className="w-5 h-5 text-blue-600" />
            Lead Preview (Agent View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{data.title}</h3>
                  {data.destination && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiMapPin className="w-4 h-4" />
                      <span>{data.destination}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {data.budgetMin && data.budgetMax && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiDollarSign className="w-4 h-4 text-green-600" />
                      <span>${data.budgetMin.toLocaleString()} - ${data.budgetMax.toLocaleString()}</span>
                    </div>
                  )}
                  {data.durationDays && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiCalendar className="w-4 h-4 text-blue-600" />
                      <span>{data.durationDays} days</span>
                    </div>
                  )}
                  {data.travelersCount && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiUsers className="w-4 h-4 text-purple-600" />
                      <span>{data.travelersCount} travelers</span>
                    </div>
                  )}
                  {data.leadQualityScore && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiStar className="w-4 h-4 text-yellow-500" />
                      <span>Quality: {data.leadQualityScore}/100</span>
                    </div>
                  )}
                </div>

                {data.specialRequirements && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Requirements:</p>
                    <p className="text-sm text-gray-600">{data.specialRequirements}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-2xl font-bold text-[#FF6B35]">
                    ${data.leadPrice?.toLocaleString() || '0'} <span className="text-sm text-gray-600 font-normal">lead price</span>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4" />
                    Contact information will be revealed after purchase
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PostLeadPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      title: '',
      destination: '',
      tripType: TripType.ADVENTURE,
      budgetMin: 1000,
      budgetMax: 5000,
      durationDays: 7,
      travelersCount: 2,
      travelDateStart: '',
      travelDateEnd: '',
      specialRequirements: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      detailedRequirements: '',
      leadPrice: 50,
      leadQualityScore: 75,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    },
  });

  // Auto-calculate lead price based on budget
  const budgetMin = form.watch('budgetMin');
  const budgetMax = form.watch('budgetMax');
  
  React.useEffect(() => {
    if (budgetMin && budgetMax) {
      const avgBudget = (budgetMin + budgetMax) / 2;
      // Calculate 1-3% of average budget as lead price
      const suggestedPrice = Math.max(10, Math.round(avgBudget * 0.02));
      form.setValue('leadPrice', suggestedPrice);
    }
  }, [budgetMin, budgetMax]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    try {
      // Prepare expiration date
      const expiresAt = new Date(data.expiresAt);
      expiresAt.setHours(23, 59, 59, 999);

      // Create marketplace lead via API
      const response = await fetch('/api/marketplace/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          destination: data.destination,
          trip_type: data.tripType,
          budget_min: data.budgetMin,
          budget_max: data.budgetMax,
          duration_days: data.durationDays,
          travelers_count: data.travelersCount,
          travel_date_start: data.travelDateStart || undefined,
          travel_date_end: data.travelDateEnd || undefined,
          special_requirements: data.specialRequirements,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          detailed_requirements: data.detailedRequirements || undefined,
          lead_quality_score: data.leadQualityScore,
          lead_price: data.leadPrice,
          status: LeadStatus.AVAILABLE,
          expires_at: expiresAt.toISOString(),
          posted_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post lead');
      }

      toast.success('Lead posted successfully to the marketplace!');
      router.push('/admin/marketplace');
    } catch (error) {
      console.error('Error posting lead:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <h1 className="text-3xl font-bold mb-2">Post New Lead</h1>
          <p className="text-blue-100 text-lg">
            Add a new lead to the marketplace for travel agents to purchase
          </p>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Lead Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiMapPin className="w-5 h-5 text-blue-600" />
                      Lead Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Family Adventure to Costa Rica" {...field} />
                          </FormControl>
                          <FormDescription>
                            A compelling title for the lead (10-100 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Bali, Indonesia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tripType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trip Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(TripType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Budget ($) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Budget ($) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="durationDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (days) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="travelersCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travelers *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="leadQualityScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quality Score *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="100" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="travelDateStart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travel Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="travelDateEnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travel End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="specialRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Wheelchair accessible, dietary restrictions, etc."
                              className="resize-none h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Visible to agents before purchase
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="border-2 border-amber-200 bg-amber-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiAlertCircle className="w-5 h-5 text-amber-600" />
                      Customer Information (Hidden Until Purchase)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 234 567 8900" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="detailedRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional detailed information about the customer's requirements"
                              className="resize-none h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Only visible to agents after purchase
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="border-2 border-green-200 bg-green-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiDollarSign className="w-5 h-5 text-green-600" />
                      Pricing & Expiration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="leadPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Price ($) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Auto-calculated at 2% of average budget
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Lead will expire at end of this date
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Sidebar - 1 column */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full mb-4"
                  >
                    <FiEye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>

                  {showPreview && <LeadPreview data={form.watch()} />}

                  {/* Action Buttons */}
                  <Card className="mt-6">
                    <CardContent className="p-6 space-y-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <FiSend className="w-4 h-4 mr-2" />
                            Post Lead
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

