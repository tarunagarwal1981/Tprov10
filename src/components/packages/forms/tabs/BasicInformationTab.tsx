"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
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
import { ImageUpload } from "@/components/packages/ImageUpload";

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

// Helper function to process uploaded files
const processUploadedFiles = (files: File[]): Promise<ImageInfo[]> => {
  return Promise.all(
    files.map(async (file) => {
      return new Promise<ImageInfo>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageInfo: ImageInfo = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            url: e.target?.result as string,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            isCover: false,
            order: 0,
            uploadedAt: new Date(),
          };
          resolve(imageInfo);
        };
        reader.readAsDataURL(file);
      });
    })
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

  const handleImageUpload = useCallback(async (files: File[], isFeatured = false) => {
    try {
      const processedImages = await processUploadedFiles(files);
      
      if (isFeatured) {
        // Handle featured image
        if (processedImages.length > 0) {
          const featuredImage = { ...processedImages[0], isCover: true };
          setValue('basicInformation.featuredImage', featuredImage);
        }
      } else {
        // Handle gallery images
        const currentGallery = watchedData.imageGallery || [];
        const newGallery = [...currentGallery, ...processedImages];
        setValue('basicInformation.imageGallery', newGallery);
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }, [watchedData.imageGallery, setValue]);

  const handleImageRemove = useCallback((imageId: string) => {
    const currentImages = watchedData.imageGallery || [];
    const newImages = currentImages.filter(img => img.id !== imageId);
    setValue('basicInformation.imageGallery', newImages);
  }, [watchedData.imageGallery, setValue]);

  const handleFeaturedImageRemove = useCallback(() => {
    setValue('basicInformation.featuredImage', null);
  }, [setValue]);

  const handleImagesChange = useCallback((images: ImageInfo[]) => {
    setValue('basicInformation.imageGallery', images);
  }, [setValue]);

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
                images={watchedData.featuredImage ? [watchedData.featuredImage] : []}
                onImagesChange={(images) => {
                  if (images.length > 0) {
                    setValue('basicInformation.featuredImage', { ...images[0], isCover: true });
                  } else {
                    setValue('basicInformation.featuredImage', null);
                  }
                }}
                maxImages={1}
                allowMultiple={false}
                showMetadata={true}
                className="package-animation-fix"
              />
            </div>

            {/* Image Gallery */}
            <div>
              <h4 className="font-medium mb-3">Image Gallery</h4>
              <ImageUpload
                images={watchedData.imageGallery || []}
                onImagesChange={handleImagesChange}
                maxImages={10}
                allowMultiple={true}
                showMetadata={true}
                className="package-animation-fix"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
