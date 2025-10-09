'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/SupabaseAuthContext';
import type { UserRole } from '@/lib/types';
import AuthLayout from '@/components/shared/AuthLayout';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle, User, Mail, Lock, Building, MapPin, Phone, Upload, Check } from 'lucide-react';

// Validation schemas for each step
const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  role: z.enum(['operator', 'agent'], {
    message: 'Please select a role',
  }),
});

const step3OperatorSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  businessRegistrationNumber: z.string().min(1, 'Business registration number is required'),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  companyDescription: z.string().max(500, 'Description must be less than 500 characters'),
  businessLicense: z.any().optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

const step3AgentSchema = z.object({
  agencyName: z.string().min(2, 'Agency name is required'),
  agencyRegistrationNumber: z.string().min(1, 'Agency registration number is required'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  officeAddress: z.string().min(5, 'Office address is required'),
  specialization: z.array(z.string()).min(1, 'Please select at least one specialization'),
  yearsOfExperience: z.string().min(1, 'Please select years of experience'),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3OperatorData = z.infer<typeof step3OperatorSchema>;
type Step3AgentData = z.infer<typeof step3AgentSchema>;

interface RegistrationData extends Step1Data, Step2Data {
  step3Data?: Step3OperatorData | Step3AgentData;
}

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score <= 2) return { level: 'weak', color: 'bg-red-500', width: '25%' };
    if (score === 3) return { level: 'medium', color: 'bg-yellow-500', width: '50%' };
    if (score === 4) return { level: 'strong', color: 'bg-blue-500', width: '75%' };
    return { level: 'very strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = getStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">Password Strength</span>
        <span className={`font-medium ${
          strength.level === 'weak' ? 'text-red-500' :
          strength.level === 'medium' ? 'text-yellow-500' :
          strength.level === 'strong' ? 'text-blue-500' : 'text-green-500'
        }`}>
          {strength.level}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${strength.color}`}
          initial={{ width: 0 }}
          animate={{ width: strength.width }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
        {[
          { label: '8+ characters', met: password.length >= 8 },
          { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
          { label: 'Lowercase letter', met: /[a-z]/.test(password) },
          { label: 'Number', met: /\d/.test(password) },
          { label: 'Special char', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        ].map((check, index) => (
          <div key={index} className="flex items-center space-x-1">
            <CheckCircle className={`h-3 w-3 ${check.met ? 'text-green-500' : 'text-gray-400'}`} />
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, label: 'Account Details' },
    { number: 2, label: 'Role Selection' },
    { number: 3, label: 'Additional Info' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-2">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1 min-w-0">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                step.number < currentStep
                  ? 'bg-green-500 text-white'
                  : step.number === currentStep
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {step.number < currentStep ? <CheckCircle className="h-4 w-4" /> : step.number}
            </motion.div>
            <span className={`ml-2 text-xs font-medium ${
              step.number <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 flex-shrink-0 ${
                step.number < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <motion.div
          className="bg-[#FF6B35] h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

const RoleSelectionCard: React.FC<{
  role: 'operator' | 'agent';
  isSelected: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}> = ({ role, isSelected, onSelect, icon, title, description, features, gradient }) => (
  <motion.div
    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
      isSelected
        ? `border-[#FF6B35] bg-gradient-to-br ${gradient} text-white`
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
    }`}
    onClick={onSelect}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-center">
      <div className={`text-4xl mb-4 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
        {icon}
      </div>
      <h3 className={`text-xl font-semibold mb-2 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {title}
      </h3>
      <p className={`text-sm mb-4 ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
        {description}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {features.map((feature, index) => (
          <span
            key={index}
            className={`px-2 py-1 rounded-full text-xs ${
              isSelected
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

// Component that handles search params logic
const RegisterPageWithSearchParams: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'operator' | 'agent' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loading, error, isInitialized, getRedirectPath, register } = useAuth();

  // Initialize form data from localStorage or URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('registrationData');
      if (savedData) {
        setRegistrationData(JSON.parse(savedData));
      }
    }
    
    const roleParam = searchParams?.get('role') ?? null;
    if (roleParam === 'operator' || roleParam === 'agent') {
      setSelectedRole(roleParam);
      setCurrentStep(2); // Skip to role selection
    }
  }, [searchParams]);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
    defaultValues: { role: selectedRole || undefined },
  });

  const step3OperatorForm = useForm<Step3OperatorData>({
    resolver: zodResolver(step3OperatorSchema),
    mode: 'onChange',
    defaultValues: {
      companyName: '',
      businessRegistrationNumber: '',
      websiteUrl: '',
      phoneNumber: '',
      businessAddress: '',
      companyDescription: '',
      businessLicense: undefined,
      termsAccepted: false,
    },
  });

  const step3AgentForm = useForm<Step3AgentData>({
    resolver: zodResolver(step3AgentSchema),
    mode: 'onChange',
    defaultValues: {
      agencyName: '',
      agencyRegistrationNumber: '',
      phoneNumber: '',
      officeAddress: '',
      specialization: [],
      yearsOfExperience: '',
      termsAccepted: false,
    },
  });

  const saveToLocalStorage = (data: any) => {
    localStorage.setItem('registrationData', JSON.stringify(data));
  };

  const handleStep1Submit = (data: Step1Data) => {
    setRegistrationData(prev => prev ? { ...prev, ...data } : { ...data, role: 'operator' as const });
    saveToLocalStorage({ ...registrationData, ...data });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setSelectedRole(data.role);
    setRegistrationData(prev => prev ? { ...prev, ...data } : { fullName: '', email: '', password: '', confirmPassword: '', ...data });
    saveToLocalStorage({ ...registrationData, ...data });
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: Step3OperatorData | Step3AgentData) => {
    if (!registrationData) return;
    
    // Validate form before submission
    const validation = selectedRole === 'operator' 
      ? validateStep3Operator() 
      : validateStep3Agent();
    
    if (!validation.valid) {
      // Show validation error toast
      const { toast } = await import('sonner');
      toast.error(validation.message);
      return;
    }
    
    try {
      // Clean the profile data by removing fields that shouldn't be in the profile
      const { termsAccepted, ...profileData } = data;
      
      const userData = {
        email: registrationData.email,
        password: registrationData.password,
        name: registrationData.fullName,
        phone: selectedRole === 'operator' 
          ? (data as Step3OperatorData).phoneNumber 
          : (data as Step3AgentData).phoneNumber,
        role: (selectedRole === 'operator' ? 'TOUR_OPERATOR' : 'TRAVEL_AGENT') as UserRole,
        profile: {
          ...profileData,
          role: selectedRole,
        } as any
      };
      
      console.log('🚀 Calling register function with data:', userData);
      
      // Call the actual registration function
      const redirectUrl = await register(userData);
      
      if (redirectUrl) {
        // Clear localStorage on success
        if (typeof window !== 'undefined') {
          localStorage.removeItem('registrationData');
        }
        
        // Show success message
        const { toast } = await import('sonner');
        toast.success('Account created successfully! Welcome to TravelPro.');
        
        // Redirect to the appropriate dashboard based on role
        router.push(redirectUrl);
      } else {
        // Registration failed - error is already set in the auth context
        const { toast } = await import('sonner');
        toast.error('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const { toast } = await import('sonner');
      toast.error('Registration failed. Please try again.');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStep1Valid = () => {
    const values = step1Form.getValues();
    return values.fullName.length >= 2 && 
           values.email.includes('@') && 
           values.password.length >= 8 && 
           values.password === values.confirmPassword;
  };

  const validateStep3Operator = () => {
    const companyName = step3OperatorForm.watch('companyName') || '';
    const businessRegistrationNumber = step3OperatorForm.watch('businessRegistrationNumber') || '';
    const phoneNumber = step3OperatorForm.watch('phoneNumber') || '';
    const businessAddress = step3OperatorForm.watch('businessAddress') || '';
    const termsAccepted = step3OperatorForm.watch('termsAccepted') || false;
    
    if (companyName.length < 2) {
      return { valid: false, message: 'Company name must be at least 2 characters' };
    }
    if (businessRegistrationNumber.length < 1) {
      return { valid: false, message: 'Business registration number is required' };
    }
    if (phoneNumber.length < 10) {
      return { valid: false, message: 'Phone number must be at least 10 digits' };
    }
    if (businessAddress.length < 5) {
      return { valid: false, message: 'Business address must be at least 5 characters' };
    }
    if (!termsAccepted) {
      return { valid: false, message: 'You must accept the terms and conditions' };
    }
    
    return { valid: true, message: '' };
  };

  const validateStep3Agent = () => {
    const agencyName = step3AgentForm.watch('agencyName') || '';
    const agencyRegistrationNumber = step3AgentForm.watch('agencyRegistrationNumber') || '';
    const phoneNumber = step3AgentForm.watch('phoneNumber') || '';
    const officeAddress = step3AgentForm.watch('officeAddress') || '';
    const specialization = step3AgentForm.watch('specialization') || [];
    const yearsOfExperience = step3AgentForm.watch('yearsOfExperience') || '';
    const termsAccepted = step3AgentForm.watch('termsAccepted') || false;
    
    if (agencyName.length < 2) {
      return { valid: false, message: 'Agency name must be at least 2 characters' };
    }
    if (agencyRegistrationNumber.length < 1) {
      return { valid: false, message: 'Agency registration number is required' };
    }
    if (phoneNumber.length < 10) {
      return { valid: false, message: 'Phone number must be at least 10 digits' };
    }
    if (officeAddress.length < 5) {
      return { valid: false, message: 'Office address must be at least 5 characters' };
    }
    if (specialization.length < 1) {
      return { valid: false, message: 'Please select at least one specialization' };
    }
    if (yearsOfExperience.length < 1) {
      return { valid: false, message: 'Please select years of experience' };
    }
    if (!termsAccepted) {
      return { valid: false, message: 'You must accept the terms and conditions' };
    }
    
    return { valid: true, message: '' };
  };

  const isStep3OperatorValid = () => {
    const companyName = step3OperatorForm.watch('companyName') || '';
    const businessRegistrationNumber = step3OperatorForm.watch('businessRegistrationNumber') || '';
    const phoneNumber = step3OperatorForm.watch('phoneNumber') || '';
    const businessAddress = step3OperatorForm.watch('businessAddress') || '';
    const termsAccepted = step3OperatorForm.watch('termsAccepted') || false;
    
    return companyName.length >= 2 &&
           businessRegistrationNumber.length >= 1 &&
           phoneNumber.length >= 10 &&
           businessAddress.length >= 5 &&
           termsAccepted === true;
  };

  const isStep3AgentValid = () => {
    const agencyName = step3AgentForm.watch('agencyName') || '';
    const agencyRegistrationNumber = step3AgentForm.watch('agencyRegistrationNumber') || '';
    const phoneNumber = step3AgentForm.watch('phoneNumber') || '';
    const officeAddress = step3AgentForm.watch('officeAddress') || '';
    const specialization = step3AgentForm.watch('specialization') || [];
    const yearsOfExperience = step3AgentForm.watch('yearsOfExperience') || '';
    const termsAccepted = step3AgentForm.watch('termsAccepted') || false;
    
    return agencyName.length >= 2 &&
           agencyRegistrationNumber.length >= 1 &&
           phoneNumber.length >= 10 &&
           officeAddress.length >= 5 &&
           specialization.length >= 1 &&
           yearsOfExperience.length >= 1 &&
           termsAccepted === true;
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              value={step1Form.watch('fullName') || ''}
              onChange={(e) => step1Form.setValue('fullName', e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
              placeholder="Enter your full name"
              autoComplete="name"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {step1Form.watch('fullName') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
              >
                <span className="text-green-500 text-lg">✓</span>
              </motion.div>
            )}
          </motion.div>
          {step1Form.formState.errors.fullName && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="email"
              value={step1Form.watch('email') || ''}
              onChange={(e) => step1Form.setValue('email', e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
              placeholder="Enter your email"
              autoComplete="email"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {step1Form.watch('email') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
              >
                <span className="text-green-500 text-lg">✓</span>
              </motion.div>
            )}
          </motion.div>
          {step1Form.formState.errors.email && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type={showPassword ? 'text' : 'password'}
              value={step1Form.watch('password') || ''}
              onChange={(e) => step1Form.setValue('password', e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {step1Form.watch('password') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
              >
                <span className="text-green-500 text-lg">✓</span>
              </motion.div>
            )}
          </motion.div>
          <PasswordStrengthMeter password={step1Form.watch('password') || ''} />
          {step1Form.formState.errors.password && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={step1Form.watch('confirmPassword') || ''}
              onChange={(e) => step1Form.setValue('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {step1Form.watch('confirmPassword') && step1Form.watch('password') === step1Form.watch('confirmPassword') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
              >
                <span className="text-green-500 text-lg">✓</span>
              </motion.div>
            )}
          </motion.div>
          {step1Form.formState.errors.confirmPassword && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={!isStep1Valid()}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            isStep1Valid()
              ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          whileHover={isStep1Valid() ? { scale: 1.02, y: -1 } : {}}
          whileTap={isStep1Valid() ? { scale: 0.98 } : {}}
        >
          Continue
        </motion.button>
      </form>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Role
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select the role that best describes your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleSelectionCard
            role="operator"
            isSelected={selectedRole === 'operator'}
            onSelect={() => {
              setSelectedRole('operator');
              step2Form.setValue('role', 'operator');
            }}
            icon="🚌"
            title="I'm a Tour Operator"
            description="List your packages, manage bookings, grow your business"
            features={['Package Management', 'Booking System', 'Analytics']}
            gradient="from-blue-500 to-blue-700"
          />

          <RoleSelectionCard
            role="agent"
            isSelected={selectedRole === 'agent'}
            onSelect={() => {
              setSelectedRole('agent');
              step2Form.setValue('role', 'agent');
            }}
            icon="✈️"
            title="I'm a Travel Agent"
            description="Browse packages, create itineraries, manage customers"
            features={['Lead Management', 'Itinerary Builder', 'Commission Tracking']}
            gradient="from-green-500 to-green-700"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <motion.button
            type="button"
            onClick={goToPreviousStep}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Previous
          </motion.button>
          <motion.button
            type="button"
            onClick={step2Form.handleSubmit(handleStep2Submit)}
            disabled={!selectedRole}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              selectedRole
                ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            whileHover={selectedRole ? { scale: 1.02, y: -1 } : {}}
            whileTap={selectedRole ? { scale: 0.98 } : {}}
          >
            Continue
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => {
    if (selectedRole === 'operator') {
      return (
        <motion.div
          key="step3-operator"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={step3OperatorForm.handleSubmit(handleStep3Submit)} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Business Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us about your tour operation business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name *
                </label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="text"
                  value={step3OperatorForm.watch('companyName') || ''}
                  onChange={(e) => step3OperatorForm.setValue('companyName', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="Your company name"
                    autoComplete="organization"
                  />
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {step3OperatorForm.watch('companyName') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <span className="text-green-500 text-lg">✓</span>
                    </motion.div>
                  )}
                </motion.div>
                {step3OperatorForm.formState.errors.companyName && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Registration Number *
                </label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="text"
                  value={step3OperatorForm.watch('businessRegistrationNumber') || ''}
                  onChange={(e) => step3OperatorForm.setValue('businessRegistrationNumber', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="Registration number"
                    autoComplete="off"
                  />
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {step3OperatorForm.watch('businessRegistrationNumber') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <span className="text-green-500 text-lg">✓</span>
                    </motion.div>
                  )}
                </motion.div>
                {step3OperatorForm.formState.errors.businessRegistrationNumber && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.businessRegistrationNumber.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website URL
              </label>
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="url"
                  value={step3OperatorForm.watch('websiteUrl') || ''}
                  onChange={(e) => step3OperatorForm.setValue('websiteUrl', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="https://yourwebsite.com"
                  autoComplete="url"
                />
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number *
                </label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="tel"
                  value={step3OperatorForm.watch('phoneNumber') || ''}
                  onChange={(e) => step3OperatorForm.setValue('phoneNumber', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {step3OperatorForm.watch('phoneNumber') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <span className="text-green-500 text-lg">✓</span>
                    </motion.div>
                  )}
                </motion.div>
                {step3OperatorForm.formState.errors.phoneNumber && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Address *
                </label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="text"
                  value={step3OperatorForm.watch('businessAddress') || ''}
                  onChange={(e) => step3OperatorForm.setValue('businessAddress', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="123 Main St, City, State"
                    autoComplete="street-address"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {step3OperatorForm.watch('businessAddress') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <span className="text-green-500 text-lg">✓</span>
                    </motion.div>
                  )}
                </motion.div>
                {step3OperatorForm.formState.errors.businessAddress && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.businessAddress.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Description
              </label>
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <textarea
                  value={step3OperatorForm.watch('companyDescription') || ''}
                  onChange={(e) => step3OperatorForm.setValue('companyDescription', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 resize-none transition-all duration-200"
                  placeholder="Describe your tour operation business..."
                />
                <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {step3OperatorForm.watch('companyDescription')?.length || 0}/500
                </div>
              </motion.div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Business License
              </label>
              <motion.div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-[#FF6B35] transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-gray-500 dark:text-gray-400">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Drag & drop your business license here</p>
                  <p className="text-sm">or click to browse</p>
                  <p className="text-xs mt-2">PDF, JPG, PNG up to 5MB</p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-start space-x-2">
              <motion.label
                className="flex items-center space-x-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="checkbox"
                  checked={step3OperatorForm.watch('termsAccepted') || false}
                  onChange={(e) => step3OperatorForm.setValue('termsAccepted', e.target.checked)}
                  className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-[#FF6B35] hover:text-[#E05A2A]">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#FF6B35] hover:text-[#E05A2A]">Privacy Policy</a>
                </span>
              </motion.label>
            </div>
            {step3OperatorForm.formState.errors.termsAccepted && (
              <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.termsAccepted.message}</p>
            )}

            <div className="flex space-x-4 pt-4">
              <motion.button
                type="button"
                onClick={goToPreviousStep}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Previous
              </motion.button>
              <motion.button
                type="submit"
                disabled={!isStep3OperatorValid() || loading === 'authenticating'}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isStep3OperatorValid() && loading !== 'authenticating'
                    ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
                whileHover={isStep3OperatorValid() && loading !== 'authenticating' ? { scale: 1.02, y: -1 } : {}}
                whileTap={isStep3OperatorValid() && loading !== 'authenticating' ? { scale: 0.98 } : {}}
              >
                {loading === 'authenticating' ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      );
    }

    // Agent form (similar structure but different fields)
    return (
      <motion.div
        key="step3-agent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={step3AgentForm.handleSubmit(handleStep3Submit)} className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Agency Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us about your travel agency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Agency Name *
              </label>
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  value={step3AgentForm.watch('agencyName') || ''}
                  onChange={(e) => step3AgentForm.setValue('agencyName', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="Your agency name"
                  autoComplete="organization"
                />
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {step3AgentForm.watch('agencyName') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <span className="text-green-500 text-lg">✓</span>
                  </motion.div>
                )}
              </motion.div>
              {step3AgentForm.formState.errors.agencyName && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.agencyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Agency Registration Number *
              </label>
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  value={step3AgentForm.watch('agencyRegistrationNumber') || ''}
                  onChange={(e) => step3AgentForm.setValue('agencyRegistrationNumber', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="Registration number"
                  autoComplete="off"
                />
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {step3AgentForm.watch('agencyRegistrationNumber') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <span className="text-green-500 text-lg">✓</span>
                  </motion.div>
                )}
              </motion.div>
              {step3AgentForm.formState.errors.agencyRegistrationNumber && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.agencyRegistrationNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number *
              </label>
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="tel"
                  value={step3AgentForm.watch('phoneNumber') || ''}
                  onChange={(e) => step3AgentForm.setValue('phoneNumber', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {step3AgentForm.watch('phoneNumber') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <span className="text-green-500 text-lg">✓</span>
                  </motion.div>
                )}
              </motion.div>
              {step3AgentForm.formState.errors.phoneNumber && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Office Address *
              </label>
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  value={step3AgentForm.watch('officeAddress') || ''}
                  onChange={(e) => step3AgentForm.setValue('officeAddress', e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200"
                  placeholder="123 Main St, City, State"
                  autoComplete="street-address"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {step3AgentForm.watch('officeAddress') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <span className="text-green-500 text-lg">✓</span>
                  </motion.div>
                )}
              </motion.div>
              {step3AgentForm.formState.errors.officeAddress && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.officeAddress.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Specialization *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Honeymoon', 'Adventure', 'Luxury', 'Family', 'Business', 'Cultural'].map((spec) => (
                <motion.label
                  key={spec}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    value={spec}
                    checked={step3AgentForm.watch('specialization')?.includes(spec) || false}
                    onChange={(e) => {
                      const current = step3AgentForm.watch('specialization') || [];
                      if (e.target.checked) {
                        step3AgentForm.setValue('specialization', [...current, spec]);
                      } else {
                        step3AgentForm.setValue('specialization', current.filter((s: string) => s !== spec));
                      }
                    }}
                    className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{spec}</span>
                </motion.label>
              ))}
            </div>
            {step3AgentForm.formState.errors.specialization && (
              <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.specialization.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Years of Experience *
            </label>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <select
                value={step3AgentForm.watch('yearsOfExperience') || ''}
                onChange={(e) => step3AgentForm.setValue('yearsOfExperience', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 transition-all duration-200 appearance-none"
              >
                <option value="">Select experience</option>
                <option value="0-1">0-1 years</option>
                <option value="2-5">2-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
            {step3AgentForm.formState.errors.yearsOfExperience && (
              <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.yearsOfExperience.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <motion.label
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="checkbox"
                checked={step3AgentForm.watch('termsAccepted') || false}
                onChange={(e) => step3AgentForm.setValue('termsAccepted', e.target.checked)}
                className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-[#FF6B35] hover:text-[#E05A2A]">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#FF6B35] hover:text-[#E05A2A]">Privacy Policy</a>
              </span>
            </motion.label>
          </div>
          {step3AgentForm.formState.errors.termsAccepted && (
            <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.termsAccepted.message}</p>
          )}

          <div className="flex space-x-4 pt-4">
            <motion.button
              type="button"
              onClick={goToPreviousStep}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Previous
            </motion.button>
            <motion.button
              type="submit"
              disabled={!isStep3AgentValid() || loading === 'authenticating'}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isStep3AgentValid() && loading !== 'authenticating'
                  ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              whileHover={isStep3AgentValid() && loading !== 'authenticating' ? { scale: 1.02, y: -1 } : {}}
              whileTap={isStep3AgentValid() && loading !== 'authenticating' ? { scale: 0.98 } : {}}
            >
              {loading === 'authenticating' ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    );
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join thousands of travel professionals"
      showTestimonials={false}
      showFeatures={false}
    >
      <div className="space-y-8">
        <StepIndicator currentStep={currentStep} totalSteps={3} />
        
        <AnimatePresence mode="wait">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </AnimatePresence>

        {/* Social Registration */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Bottom Links */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <motion.a
              href="/login"
              className="text-[#FF6B35] hover:text-[#E05A2A] dark:text-[#FF8C61] dark:hover:text-[#FF6B35] font-medium"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Sign in
            </motion.a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

// Loading fallback component
const RegisterPageLoading: React.FC = () => (
  <AuthLayout
    title="Create Your Account"
    subtitle="Join thousands of travel professionals"
    showTestimonials={false}
    showFeatures={false}
  >
    <div className="space-y-8">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  </AuthLayout>
);

// Main component with Suspense boundary
const RegisterPage: React.FC = () => {
  return (
    <Suspense fallback={<RegisterPageLoading />}>
      <RegisterPageWithSearchParams />
    </Suspense>
  );
};

export default RegisterPage;
