"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaImage,
  FaDollarSign,
  FaUsers,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  PackageVariant,
} from "@/lib/types/activity-package";

// Variant card component
const VariantCard: React.FC<{
  variant: PackageVariant;
  onUpdate: (variant: PackageVariant) => void;
  onRemove: (id: string) => void;
  onDuplicate: (variant: PackageVariant) => void;
  onToggleActive: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ 
  variant, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  onToggleActive, 
  isEditing, 
  onEdit, 
  onCancelEdit 
}) => {
  const [editData, setEditData] = useState(variant);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(variant);
    onCancelEdit();
  }, [variant, onCancelEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Variant Name</label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="e.g., VIP Experience"
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Capacity</label>
              <Input
                type="number"
                min="1"
                value={editData.maxCapacity}
                onChange={(e) => setEditData({ ...editData, maxCapacity: parseInt(e.target.value) || 1 })}
                className="package-text-fix"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Describe this variant"
              rows={3}
              className="package-text-fix"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Price Adjustment</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editData.priceAdjustment}
                onChange={(e) => setEditData({ ...editData, priceAdjustment: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="package-text-fix"
              />
              <span className="text-sm text-gray-500">from base price</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Features</label>
            <div className="space-y-2">
              {editData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...editData.features];
                      newFeatures[index] = e.target.value;
                      setEditData({ ...editData, features: newFeatures });
                    }}
                    placeholder="Feature description"
                    className="package-text-fix"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newFeatures = editData.features.filter((_, i) => i !== index);
                      setEditData({ ...editData, features: newFeatures });
                    }}
                    className="package-button-fix text-red-600"
                  >
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditData({ ...editData, features: [...editData.features, ''] });
                }}
                className="package-button-fix"
              >
                <FaPlus className="h-3 w-3 mr-1" />
                Add Feature
              </Button>
            </div>
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
      className={cn(
        "p-6 border rounded-lg transition-all duration-200",
        "package-border-radius-fix package-animation-fix",
        variant.isActive
          ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaGripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          <div>
            <h3 className="font-semibold text-lg">{variant.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {variant.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={variant.isActive}
            onCheckedChange={() => onToggleActive(variant.id)}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(variant.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDuplicate(variant)}
            className="package-button-fix"
          >
            <FaCopy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(variant.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FaDollarSign className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Price Adjustment</p>
            <p className="font-medium">
              {variant.priceAdjustment >= 0 ? '+' : ''}
              {variant.priceAdjustment.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FaUsers className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Max Capacity</p>
            <p className="font-medium">{variant.maxCapacity}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={variant.isActive ? "default" : "secondary"}>
            {variant.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {variant.features.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Features</h4>
          <div className="flex flex-wrap gap-2">
            {variant.features.map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {variant.images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Images</h4>
          <div className="flex gap-2">
            {variant.images.slice(0, 3).map((image, index) => (
              <div key={index} className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {variant.images.length > 3 && (
              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                +{variant.images.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const PackageVariantsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const watchedData = watch('packageVariants');

  const handleAddVariant = useCallback((variantData: Partial<PackageVariant>) => {
    const newVariant: PackageVariant = {
      id: Date.now().toString(),
      name: variantData.name || 'New Variant',
      description: variantData.description || '',
      priceAdjustment: variantData.priceAdjustment || 0,
      features: variantData.features || [],
      maxCapacity: variantData.maxCapacity || 10,
      images: variantData.images || [],
      isActive: true,
      order: (watchedData.variants?.length || 0) + 1,
    };

    const currentVariants = watchedData.variants || [];
    setValue('packageVariants.variants', [...currentVariants, newVariant]);
    setShowAddModal(false);
  }, [watchedData.variants, setValue]);

  const handleUpdateVariant = useCallback((updatedVariant: PackageVariant) => {
    const currentVariants = watchedData.variants || [];
    const updatedVariants = currentVariants.map(variant =>
      variant.id === updatedVariant.id ? updatedVariant : variant
    );
    setValue('packageVariants.variants', updatedVariants);
  }, [watchedData.variants, setValue]);

  const handleRemoveVariant = useCallback((id: string) => {
    const currentVariants = watchedData.variants || [];
    const updatedVariants = currentVariants.filter(variant => variant.id !== id);
    setValue('packageVariants.variants', updatedVariants);
  }, [watchedData.variants, setValue]);

  const handleDuplicateVariant = useCallback((variant: PackageVariant) => {
    const duplicatedVariant: PackageVariant = {
      ...variant,
      id: Date.now().toString(),
      name: `${variant.name} (Copy)`,
      order: (watchedData.variants?.length || 0) + 1,
    };

    const currentVariants = watchedData.variants || [];
    setValue('packageVariants.variants', [...currentVariants, duplicatedVariant]);
  }, [watchedData.variants, setValue]);

  const handleToggleActive = useCallback((id: string) => {
    const currentVariants = watchedData.variants || [];
    const updatedVariants = currentVariants.map(variant =>
      variant.id === id ? { ...variant, isActive: !variant.isActive } : variant
    );
    setValue('packageVariants.variants', updatedVariants);
  }, [watchedData.variants, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Package Variants</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create different versions of your activity with varying features and pricing
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddModal(true)}
          className="package-button-fix package-animation-fix"
        >
          <FaPlus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Variants List */}
      <div className="space-y-4">
        <AnimatePresence>
          {(watchedData.variants || []).map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              onUpdate={handleUpdateVariant}
              onRemove={handleRemoveVariant}
              onDuplicate={handleDuplicateVariant}
              onToggleActive={handleToggleActive}
              isEditing={editingVariant === variant.id}
              onEdit={setEditingVariant}
              onCancelEdit={() => setEditingVariant(null)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {(!watchedData.variants || watchedData.variants.length === 0) && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardContent className="text-center py-12">
            <FaImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No variants created yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create different versions of your activity package with varying features and pricing
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="package-button-fix package-animation-fix"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Create Your First Variant
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Variant Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add New Variant</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Variant Name</label>
                  <Input
                    placeholder="e.g., VIP Experience"
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe this variant"
                    rows={3}
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Price Adjustment</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Max Capacity</label>
                  <Input
                    type="number"
                    min="1"
                    defaultValue="10"
                    className="package-text-fix"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="package-button-fix"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAddVariant({})}
                  className="package-button-fix"
                >
                  Create Variant
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
