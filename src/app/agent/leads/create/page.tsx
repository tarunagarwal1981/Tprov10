'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import {
  FiSave,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiTag,
  FiFileText,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';

// Form schema with zod validation
const createLeadSchema = z.object({
  // Row 1: Contact Information
  customer_name: z.string().min(2, 'Name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(1, 'Phone number is required'),
  
  // Row 2: Travel Details
  travel_month: z.string().optional(),
  origin: z.string().min(2, 'Origin is required'),
  destinations: z.union([z.string(), z.array(z.string())]).optional(),
  is_hot: z.boolean(),
  
  // Row 3: Passenger & Date Information
  adults: z.number().min(1, 'At least 1 adult is required'),
  child: z.number().min(0),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  lead_source: z.string().optional(),
  
  // Row 4: Assignment & Services
  assign_to: z.string().optional(),
  services: z.array(z.string()),
  
  // Row 5: Remarks
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.to_date && data.from_date) {
    return new Date(data.to_date) >= new Date(data.from_date);
  }
  return true;
}, {
  message: 'To date must be after or equal to from date',
  path: ['to_date'],
});

type CreateLeadFormData = z.infer<typeof createLeadSchema>;

// Service options
const SERVICE_OPTIONS = [
  { id: 'Full Package', label: 'Full Package' },
  { id: 'Flight', label: 'Flight' },
  { id: 'Hotel', label: 'Hotel' },
  { id: 'Transport', label: 'Transport' },
  { id: 'Activities', label: 'Activities' },
  { id: 'Visa', label: 'Visa' },
];

// Travel months
const TRAVEL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Lead sources
const LEAD_SOURCES = [
  'Facebook Ads',
  'Google Ads',
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Phone Inquiry',
  'Email Campaign',
  'Other',
];

export default function CreateLeadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subAgents, setSubAgents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingSubAgents, setLoadingSubAgents] = useState(true);

  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      travel_month: '',
      origin: '',
      destinations: '',
      is_hot: false,
      adults: 1,
      child: 0,
      from_date: '',
      to_date: '',
      lead_source: '',
      assign_to: '',
      services: [],
      remarks: '',
    },
  });

  // Fetch sub-agents for "Assign To" dropdown
  useEffect(() => {
    const fetchSubAgents = async () => {
      if (!user?.id) return;
      
      try {
        const accessToken = getAccessToken();
        const response = await fetch('/api/agents/sub-agents', {
          headers: {
            'Authorization': `Bearer ${accessToken || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Include the current agent in the list
          const agentsList = [
            { id: user.id, name: user.name || user.email || 'Me', email: user.email || '' },
            ...(data.subAgents || []).map((sa: any) => ({
              id: sa.id,
              name: sa.name || sa.email,
              email: sa.email,
            })),
          ];
          setSubAgents(agentsList);
        }
      } catch (error) {
        console.error('Error fetching sub-agents:', error);
      } finally {
        setLoadingSubAgents(false);
      }
    };

    fetchSubAgents();
  }, [user?.id, user?.name, user?.email]);

  const onSubmit = async (data: CreateLeadFormData) => {
    if (!user?.id) {
      toast.error('You must be logged in to create a lead');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = getAccessToken();
      const leadData = {
        ...data,
        status: 'published',
      };
      
      console.log('[Create Lead Page] 🚀 Starting lead creation...');
      console.log('[Create Lead Page] 📤 Sending lead data:', {
        customer_name: leadData.customer_name,
        customer_email: leadData.customer_email,
        customer_phone: leadData.customer_phone,
        origin: leadData.origin,
        destinations: leadData.destinations,
        status: leadData.status,
        stage: 'NEW', // Will be set by backend
        user_id: user?.id,
        has_access_token: !!accessToken,
      });
      
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify(leadData),
      });

      console.log('[Create Lead Page] 📥 API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('[Create Lead Page] ❌ API Error:', error);
        throw new Error(error.error || 'Failed to create lead');
      }

      const result = await response.json();
      console.log('[Create Lead Page] ✅ Lead created successfully!', {
        leadId: result.lead?.id,
        agentId: result.lead?.agent_id,
        status: result.lead?.status,
        stage: result.lead?.stage || 'NEW',
        customer_name: result.lead?.customer_name,
        message: result.message,
      });
      
      toast.success('Lead created successfully!');
      console.log('[Create Lead Page] 🔄 Redirecting to lead detail page:', `/agent/leads/${result.lead.id}`);
      router.push(`/agent/leads/${result.lead.id}`);
    } catch (error) {
      console.error('[Create Lead Page] ❌ Error creating lead:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save a draft');
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Please fix validation errors before saving draft');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = form.getValues();
      const accessToken = getAccessToken();
      
      // Prepare payload - convert destinations to array if string
      const payload = {
        ...data,
        destinations: data.destinations ? (typeof data.destinations === 'string' ? [data.destinations] : data.destinations) : [],
        status: 'draft',
      };
      
      console.log('[Create Lead Page] 💾 Saving draft...');
      console.log('[Create Lead Page] 📤 Draft data:', {
        customer_name: payload.customer_name,
        customer_email: payload.customer_email,
        status: payload.status,
        stage: 'NEW', // Will be set by backend
        user_id: user?.id,
      });
      
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('[Create Lead Page] 📥 Draft API Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[Create Lead Page] ❌ Draft API Error:', error);
        throw new Error(error.error || 'Failed to save draft');
      }

      const result = await response.json();
      console.log('[Create Lead Page] ✅ Draft saved successfully!', {
        leadId: result.lead?.id,
        status: result.lead?.status,
        message: result.message,
      });

      toast.success('Draft saved successfully!');
      console.log('[Create Lead Page] 🔄 Redirecting to leads page');
      router.push('/agent/leads');
    } catch (error) {
      console.error('[Create Lead Page] ❌ Error saving draft:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Query</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-10 w-10"
            >
              <FiX className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="border-gray-200">
              <CardContent className="p-6">
                {/* Row 1: Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FiUser className="h-4 w-4" />
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder="Enter email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} placeholder="Enter phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Travel Details & Lead Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="travel_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Month</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRAVEL_MONTHS.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Origin <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter origin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destinations</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Select..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_hot"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Is Hot?</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 3: Passenger & Date Information */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="adults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Adults <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="child"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="from_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="to_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lead_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEAD_SOURCES.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 4: Assignment & Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="assign_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingSubAgents}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subAgents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>Services</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {SERVICE_OPTIONS.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="services"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={service.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, service.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== service.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {service.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 5: Remarks */}
                <div className="mb-6">
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter remarks..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={isSubmitting}
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Lead'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}

