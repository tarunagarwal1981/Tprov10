"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaQuestionCircle,
  FaPlus,
  FaTrash,
  FaEdit,
  FaGripVertical,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  FAQItem,
  FAQCategory,
} from "@/lib/types/activity-package";

// FAQ categories
const FAQ_CATEGORIES: { value: FAQCategory; label: string; color: string }[] = [
  { value: 'GENERAL', label: 'General', color: 'bg-gray-100 text-gray-800' },
  { value: 'BOOKING', label: 'Booking', color: 'bg-blue-100 text-blue-800' },
  { value: 'CANCELLATION', label: 'Cancellation', color: 'bg-red-100 text-red-800' },
  { value: 'WEATHER', label: 'Weather', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SAFETY', label: 'Safety', color: 'bg-green-100 text-green-800' },
  { value: 'ACCESSIBILITY', label: 'Accessibility', color: 'bg-purple-100 text-purple-800' },
];

// FAQ card component
const FAQCard: React.FC<{
  faq: FAQItem;
  onUpdate: (faq: FAQItem) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}> = ({ 
  faq, 
  onUpdate, 
  onRemove, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  isExpanded, 
  onToggleExpand 
}) => {
  const [editData, setEditData] = useState(faq);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(faq);
    onCancelEdit();
  }, [faq, onCancelEdit]);

  const categoryInfo = FAQ_CATEGORIES.find(cat => cat.value === faq.category);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Question</label>
            <Input
              value={editData.question}
              onChange={(e) => setEditData({ ...editData, question: e.target.value })}
              placeholder="Enter the question"
              maxLength={200}
              className="package-text-fix"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Answer</label>
            <Textarea
              value={editData.answer}
              onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
              placeholder="Enter the answer"
              maxLength={1000}
              rows={4}
              className="package-text-fix"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={editData.category}
              onValueChange={(value: FAQCategory) => setEditData({ ...editData, category: value })}
            >
              <SelectTrigger className="package-text-fix">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAQ_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="package-button-fix">
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" className="package-button-fix">
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <FaGripVertical className="h-4 w-4 text-gray-400 cursor-move mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-lg">{faq.question}</h4>
                <Badge className={cn("text-xs", categoryInfo?.color)}>
                  {categoryInfo?.label}
                </Badge>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleExpand(faq.id)}
              className="package-button-fix"
            >
              {isExpanded ? (
                <FaChevronUp className="h-3 w-3" />
              ) : (
                <FaChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(faq.id)}
              className="package-button-fix"
            >
              <FaEdit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(faq.id)}
              className="package-button-fix text-red-600 hover:text-red-700"
            >
              <FaTrash className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const FAQTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'ALL'>('ALL');
  const [showAllExpanded, setShowAllExpanded] = useState(false);

  const watchedData = watch('faq');

  const handleAddFAQ = useCallback((faqData: Partial<FAQItem>) => {
    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      question: faqData.question || '',
      answer: faqData.answer || '',
      category: faqData.category || 'GENERAL',
      order: (watchedData.faqs?.length || 0) + 1,
    };

    const currentFAQs = watchedData.faqs || [];
    setValue('faq.faqs', [...currentFAQs, newFAQ]);
  }, [watchedData.faqs, setValue]);

  const handleUpdateFAQ = useCallback((updatedFAQ: FAQItem) => {
    const currentFAQs = watchedData.faqs || [];
    const updatedFAQs = currentFAQs.map(faq =>
      faq.id === updatedFAQ.id ? updatedFAQ : faq
    );
    setValue('faq.faqs', updatedFAQs);
  }, [watchedData.faqs, setValue]);

  const handleRemoveFAQ = useCallback((id: string) => {
    const currentFAQs = watchedData.faqs || [];
    const updatedFAQs = currentFAQs.filter(faq => faq.id !== id);
    setValue('faq.faqs', updatedFAQs);
  }, [watchedData.faqs, setValue]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleToggleAllExpand = useCallback(() => {
    if (showAllExpanded) {
      setExpandedFAQs(new Set());
    } else {
      const allIds = new Set((watchedData.faqs || []).map(faq => faq.id));
      setExpandedFAQs(allIds);
    }
    setShowAllExpanded(!showAllExpanded);
  }, [showAllExpanded, watchedData.faqs]);

  // Filter FAQs based on search and category
  const filteredFAQs = (watchedData.faqs || []).filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Help customers understand your activity better with common questions and answers
          </p>
        </div>
        
        <Button
          onClick={() => handleAddFAQ({})}
          className="package-button-fix package-animation-fix"
        >
          <FaPlus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="pl-10 package-text-fix"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={(value: FAQCategory | 'ALL') => setSelectedCategory(value)}>
                <SelectTrigger className="w-40 package-text-fix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {FAQ_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleToggleAllExpand}
                variant="outline"
                className="package-button-fix"
              >
                {showAllExpanded ? (
                  <>
                    <FaChevronUp className="h-4 w-4 mr-2" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <FaChevronDown className="h-4 w-4 mr-2" />
                    Expand All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredFAQs.map((faq) => (
            <FAQCard
              key={faq.id}
              faq={faq}
              onUpdate={handleUpdateFAQ}
              onRemove={handleRemoveFAQ}
              isEditing={editingFAQ === faq.id}
              onEdit={setEditingFAQ}
              onCancelEdit={() => setEditingFAQ(null)}
              isExpanded={expandedFAQs.has(faq.id)}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {(!watchedData.faqs || watchedData.faqs.length === 0) && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardContent className="text-center py-12">
            <FaQuestionCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No FAQs added yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add frequently asked questions to help customers understand your activity better
            </p>
            <Button
              onClick={() => handleAddFAQ({})}
              className="package-button-fix package-animation-fix"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Your First FAQ
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {watchedData.faqs && watchedData.faqs.length > 0 && filteredFAQs.length === 0 && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardContent className="text-center py-12">
            <FaSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No FAQs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add FAQ Modal */}
      <AnimatePresence>
        {editingFAQ === 'new' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingFAQ(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add New FAQ</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <Input
                    placeholder="Enter the question"
                    maxLength={200}
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Answer</label>
                  <Textarea
                    placeholder="Enter the answer"
                    maxLength={1000}
                    rows={4}
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select defaultValue="GENERAL">
                    <SelectTrigger className="package-text-fix">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setEditingFAQ(null)}
                  variant="outline"
                  className="package-button-fix"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleAddFAQ({});
                    setEditingFAQ(null);
                  }}
                  className="package-button-fix"
                >
                  Add FAQ
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
