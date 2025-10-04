'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';

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
    required_error: 'Please select a role',
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
            <span className={check.met ? 'text-green-500' : 'text-gray-400'}>
              {check.met ? '✓' : '○'}
            </span>
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
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.number < currentStep
                  ? 'bg-green-500 text-white'
                  : step.number === currentStep
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {step.number < currentStep ? '✓' : step.number}
            </motion.div>
            <span className={`ml-2 text-sm font-medium ${
              step.number <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${
                step.number < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <motion.div
          className="bg-indigo-600 h-1 rounded-full"
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
        ? `border-indigo-500 bg-gradient-to-br ${gradient} text-white`
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

const RegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'operator' | 'agent' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const searchParams = useSearchParams();

  // Initialize form data from localStorage or URL params
  useEffect(() => {
    const savedData = localStorage.getItem('registrationData');
    if (savedData) {
      setRegistrationData(JSON.parse(savedData));
    }
    
    const roleParam = searchParams.get('role');
    if (roleParam === 'operator' || roleParam === 'agent') {
      setSelectedRole(roleParam);
      setCurrentStep(2); // Skip to role selection
    }
  }, [searchParams]);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: registrationData || {},
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
    defaultValues: { role: selectedRole || undefined },
  });

  const step3OperatorForm = useForm<Step3OperatorData>({
    resolver: zodResolver(step3OperatorSchema),
    mode: 'onChange',
  });

  const step3AgentForm = useForm<Step3AgentData>({
    resolver: zodResolver(step3AgentSchema),
    mode: 'onChange',
  });

  const saveToLocalStorage = (data: any) => {
    localStorage.setItem('registrationData', JSON.stringify(data));
  };

  const handleStep1Submit = (data: Step1Data) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
    saveToLocalStorage({ ...registrationData, ...data });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setSelectedRole(data.role);
    setRegistrationData(prev => ({ ...prev, ...data }));
    saveToLocalStorage({ ...registrationData, ...data });
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: Step3OperatorData | Step3AgentData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear localStorage on success
      localStorage.removeItem('registrationData');
      
      // Redirect to success page or dashboard
      console.log('Registration successful:', { ...registrationData, step3Data: data });
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <input
            {...step1Form.register('fullName')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
            placeholder="Enter your full name"
          />
          {step1Form.formState.errors.fullName && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            {...step1Form.register('email')}
            type="email"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
            placeholder="Enter your email"
          />
          {step1Form.formState.errors.email && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              {...step1Form.register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <PasswordStrengthMeter password={step1Form.watch('password') || ''} />
          {step1Form.formState.errors.password && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <div className="relative">
            <input
              {...step1Form.register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {step1Form.formState.errors.confirmPassword && (
            <p className="text-red-500 text-sm">{step1Form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={!step1Form.formState.isValid}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            step1Form.formState.isValid
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          whileHover={step1Form.formState.isValid ? { scale: 1.02, y: -1 } : {}}
          whileTap={step1Form.formState.isValid ? { scale: 0.98 } : {}}
        >
          Continue
        </motion.button>
      </form>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Role
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select the role that best describes your business
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <RoleSelectionCard
            role="operator"
            isSelected={selectedRole === 'operator'}
            onSelect={() => {
              setSelectedRole('operator');
              step2Form.setValue('role', 'operator');
            }}
            icon="🏢"
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
            icon="💼"
            title="I'm a Travel Agent"
            description="Browse packages, create itineraries, manage customers"
            features={['Lead Management', 'Itinerary Builder', 'Commission Tracking']}
            gradient="from-green-500 to-green-700"
          />
        </div>

        <div className="flex space-x-4">
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
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={step3OperatorForm.handleSubmit(handleStep3Submit)} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Business Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us about your tour operation business
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name *
                </label>
                <input
                  {...step3OperatorForm.register('companyName')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                  placeholder="Your company name"
                />
                {step3OperatorForm.formState.errors.companyName && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Registration Number *
                </label>
                <input
                  {...step3OperatorForm.register('businessRegistrationNumber')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                  placeholder="Registration number"
                />
                {step3OperatorForm.formState.errors.businessRegistrationNumber && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.businessRegistrationNumber.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website URL
              </label>
              <input
                {...step3OperatorForm.register('websiteUrl')}
                type="url"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number *
                </label>
                <input
                  {...step3OperatorForm.register('phoneNumber')}
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                  placeholder="+1 (555) 123-4567"
                />
                {step3OperatorForm.formState.errors.phoneNumber && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Address *
                </label>
                <input
                  {...step3OperatorForm.register('businessAddress')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                  placeholder="123 Main St, City, State"
                />
                {step3OperatorForm.formState.errors.businessAddress && (
                  <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.businessAddress.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Description
              </label>
              <textarea
                {...step3OperatorForm.register('companyDescription')}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700 resize-none"
                placeholder="Describe your tour operation business..."
              />
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                {step3OperatorForm.watch('companyDescription')?.length || 0}/500
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Business License
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
                <div className="text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-2 block">📄</span>
                  <p>Drag & drop your business license here</p>
                  <p className="text-sm">or click to browse</p>
                  <p className="text-xs mt-2">PDF, JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                {...step3OperatorForm.register('termsAccepted')}
                type="checkbox"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
              </label>
            </div>
            {step3OperatorForm.formState.errors.termsAccepted && (
              <p className="text-red-500 text-sm">{step3OperatorForm.formState.errors.termsAccepted.message}</p>
            )}

            <div className="flex space-x-4">
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
                disabled={!step3OperatorForm.formState.isValid || isSubmitting}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  step3OperatorForm.formState.isValid && !isSubmitting
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
                whileHover={step3OperatorForm.formState.isValid && !isSubmitting ? { scale: 1.02, y: -1 } : {}}
                whileTap={step3OperatorForm.formState.isValid && !isSubmitting ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={step3AgentForm.handleSubmit(handleStep3Submit)} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Agency Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us about your travel agency
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Agency Name *
              </label>
              <input
                {...step3AgentForm.register('agencyName')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                placeholder="Your agency name"
              />
              {step3AgentForm.formState.errors.agencyName && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.agencyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Agency Registration Number *
              </label>
              <input
                {...step3AgentForm.register('agencyRegistrationNumber')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                placeholder="Registration number"
              />
              {step3AgentForm.formState.errors.agencyRegistrationNumber && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.agencyRegistrationNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number *
              </label>
              <input
                {...step3AgentForm.register('phoneNumber')}
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                placeholder="+1 (555) 123-4567"
              />
              {step3AgentForm.formState.errors.phoneNumber && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Office Address *
              </label>
              <input
                {...step3AgentForm.register('officeAddress')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
                placeholder="123 Main St, City, State"
              />
              {step3AgentForm.formState.errors.officeAddress && (
                <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.officeAddress.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Specialization *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['Honeymoon', 'Adventure', 'Luxury', 'Family', 'Business', 'Cultural'].map((spec) => (
                <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={spec}
                    {...step3AgentForm.register('specialization')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{spec}</span>
                </label>
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
            <select
              {...step3AgentForm.register('yearsOfExperience')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700"
            >
              <option value="">Select experience</option>
              <option value="0-1">0-1 years</option>
              <option value="2-5">2-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="10+">10+ years</option>
            </select>
            {step3AgentForm.formState.errors.yearsOfExperience && (
              <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.yearsOfExperience.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <input
              {...step3AgentForm.register('termsAccepted')}
              type="checkbox"
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
            </label>
          </div>
          {step3AgentForm.formState.errors.termsAccepted && (
            <p className="text-red-500 text-sm">{step3AgentForm.formState.errors.termsAccepted.message}</p>
          )}

          <div className="flex space-x-4">
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
              disabled={!step3AgentForm.formState.isValid || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                step3AgentForm.formState.isValid && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              whileHover={step3AgentForm.formState.isValid && !isSubmitting ? { scale: 1.02, y: -1 } : {}}
              whileTap={step3AgentForm.formState.isValid && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
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

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">🔍</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
              </motion.button>

              <motion.button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">🐙</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
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
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
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

export default RegisterPage;
