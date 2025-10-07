"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaClock,
  FaFlag,
  FaTag,
  FaImage,
  FaPlus,
  FaTrash,
  FaEdit,
  FaUpload,
  FaCrop,
  FaInfoCircle,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  DifficultyLevel,
  Language,
  Tag,
  ImageInfo,
} from "@/lib/types/activity-package";

// Language options with flags
const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'EN', label: 'English', flag: '🇺🇸' },
  { value: 'ES', label: 'Spanish', flag: '🇪🇸' },
  { value: 'FR', label: 'French', flag: '🇫🇷' },
  { value: 'DE', label: 'German', flag: '🇩🇪' },
  { value: 'IT', label: 'Italian', flag: '🇮🇹' },
  { value: 'PT', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'RU', label: 'Russian', flag: '🇷🇺' },
  { value: 'ZH', label: 'Chinese', flag: '🇨🇳' },
  { value: 'JA', label: 'Japanese', flag: '🇯🇵' },
  { value: 'KO', label: 'Korean', flag: '🇰🇷' },
];

// Tag options
const TAG_OPTIONS: { value: Tag; label: string; color: string }[] = [
  { value: 'ADVENTURE', label: 'Adventure', color: 'bg-orange-100 text-orange-800' },
  { value: 'FAMILY_FRIENDLY', label: 'Family Friendly', color: 'bg-blue-100 text-blue-800' },
  { value: 'ROMANTIC', label: 'Romantic', color: 'bg-pink-100 text-pink-800' },
  { value: 'CULTURAL', label: 'Cultural', color: 'bg-purple-100 text-purple-800' },
  { value: 'NATURE', label: 'Nature', color: 'bg-green-100 text-green-800' },
  { value: 'SPORTS', label: 'Sports', color: 'bg-red-100 text-red-800' },
  { value: 'FOOD', label: 'Food', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'NIGHTLIFE', label: 'Nightlife', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'EDUCATIONAL', label: 'Educational', color: 'bg-teal-100 text-teal-800' },
  { value: 'RELAXATION', label: 'Relaxation', color: 'bg-gray-100 text-gray-800' },
];

// Difficulty levels
const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; description: string }[] = [
  { value: 'EASY', label: 'Easy', description: 'Suitable for all fitness levels' },
  { value: 'MODERATE', label: 'Moderate', description: 'Some physical activity required' },
  { value: 'CHALLENGING', label: 'Challenging', description: 'Good fitness level recommended' },
  { value: 'DIFFICULT', label: 'Difficult', description: 'High fitness level required' },
];

// Image upload component
const ImageUpload: React.FC<{
  onUpload: (files: File[]) => void;
  onRemove: (imageId: string) => void;
  images: ImageInfo[];
  isFeatured?: boolean;
}> = ({ onUpload, onRemove, images, isFeatured = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onUpload(files);
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onUpload(files);
  }, [onUpload]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
          "package-border-radius-fix package-animation-fix",
          isDragging
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FaUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {isFeatured ? 'Upload featured image' : 'Upload images'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Drag & drop or click to select (JPG, PNG, WebP - Max 5MB)
        </p>
        <input
          type="file"
          multiple={!isFeatured}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${isFeatured ? 'featured' : 'gallery'}`}
        />
        <label
          htmlFor={`image-upload-${isFeatured ? 'featured' : 'gallery'}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer package-button-fix"
        >
          <FaPlus className="h-4 w-4" />
          Choose Files
        </label>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {/* Handle crop */}}
                  className="package-button-fix"
                >
                  <FaCrop className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemove(image.id)}
                  className="package-button-fix"
                >
                  <FaTrash className="h-3 w-3" />
                </Button>
              </div>

              {/* Featured Badge */}
              {isFeatured && index === 0 && (
                <Badge className="absolute top-2 left-2 bg-blue-600">
                  Featured
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BasicInformationTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [locationSearch, setLocationSearch] = useState('');

  const watchedData = watch('basicInformation');

  const handleLocationSelect = useCallback((location: any) => {
    setValue('basicInformation.destination', {
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      city: location.city,
      country: location.country,
    });
    setLocationSearch(location.name);
  }, [setValue]);

  const handleImageUpload = useCallback((files: File[], isFeatured = false) => {
    // Handle image upload logic here
    console.log('Uploading images:', files, isFeatured);
  }, []);

  const handleImageRemove = useCallback((imageId: string) => {
    const currentImages = watchedData.imageGallery || [];
    const newImages = currentImages.filter(img => img.id !== imageId);
    setValue('basicInformation.imageGallery', newImages);
  }, [watchedData.imageGallery, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Package Title */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaInfoCircle className="h-5 w-5 text-blue-600" />
            Package Title
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="basicInformation.title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Title *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your activity package title"
                    maxLength={100}
                    showCharacterCount
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  A clear, descriptive title that captures the essence of your activity
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="basicInformation.shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Brief description for cards and listings (max 160 characters)"
                    maxLength={160}
                    rows={3}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  This will appear on cards and search results
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="basicInformation.fullDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Detailed description of your activity package (max 2000 characters)"
                    maxLength={2000}
                    rows={8}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  Provide detailed information about what customers can expect
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Destination & Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaMapMarkerAlt className="h-5 w-5 text-green-600" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="basicInformation.destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Search for location..."
                        className="package-text-fix"
                      />
                      {field.value.name && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="font-medium">{field.value.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {field.value.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaClock className="h-5 w-5 text-purple-600" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="basicInformation.duration.hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="24"
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="basicInformation.duration.minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="59"
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty & Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle>Difficulty Level</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="basicInformation.difficultyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Difficulty *</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring package-text-fix"
                    >
                      <option value="" disabled>Choose difficulty level</option>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} — {option.description}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaFlag className="h-5 w-5 text-red-600" />
              Languages Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="basicInformation.languagesSupported"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Languages</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <div key={language.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={language.value}
                          checked={field.value?.includes(language.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, language.value]);
                            } else {
                              field.onChange(current.filter((l: Language) => l !== language.value));
                            }
                          }}
                        />
                        <label
                          htmlFor={language.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <span>{language.flag}</span>
                          {language.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaTag className="h-5 w-5 text-orange-600" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="basicInformation.tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Tags</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <Badge
                      key={tag.value}
                      variant={field.value?.includes(tag.value) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer package-button-fix",
                        field.value?.includes(tag.value) && tag.color
                      )}
                      onClick={() => {
                        const current = field.value || [];
                        if (current.includes(tag.value)) {
                          field.onChange(current.filter((t: Tag) => t !== tag.value));
                        } else {
                          field.onChange([...current, tag.value]);
                        }
                      }}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Tags help customers find your activity more easily
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaImage className="h-5 w-5 text-pink-600" />
            Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Featured Image */}
            <div>
              <h4 className="font-medium mb-3">Featured Image</h4>
              <ImageUpload
                onUpload={(files) => handleImageUpload(files, true)}
                onRemove={handleImageRemove}
                images={watchedData.featuredImage ? [watchedData.featuredImage] : []}
                isFeatured
              />
            </div>

            {/* Image Gallery */}
            <div>
              <h4 className="font-medium mb-3">Image Gallery</h4>
              <ImageUpload
                onUpload={(files) => handleImageUpload(files, false)}
                onRemove={handleImageRemove}
                images={watchedData.imageGallery || []}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
