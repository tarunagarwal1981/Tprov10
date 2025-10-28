"use client";

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUpload,
  FaImage,
  FaTrash,
  FaEye,
  FaEdit,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ImageInfo, UploadProgress } from '@/lib/types/activity-package';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ImageUploadProps {
  images: ImageInfo[];
  onImagesChange: (images: ImageInfo[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  allowMultiple?: boolean;
  showPreview?: boolean;
  showMetadata?: boolean;
}

export interface ImageUploadState {
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: UploadProgress[];
  editingImage: string | null;
  previewImage: string | null;
}

// ============================================================================
// IMAGE UPLOAD COMPONENT
// ============================================================================

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className,
  disabled = false,
  allowMultiple = true,
  showPreview = true,
  showMetadata = true,
}) => {
  const [state, setState] = useState<ImageUploadState>({
    isDragOver: false,
    isUploading: false,
    uploadProgress: [],
    editingImage: null,
    previewImage: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // FILE VALIDATION
  // ============================================================================

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      return `File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum size of ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  // ============================================================================
  // FILE PROCESSING
  // ============================================================================

  const processFile = useCallback((file: File): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const imageInfo: ImageInfo = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            url: e.target?.result as string,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            isCover: images.length === 0, // First image is cover by default
            order: images.length,
            uploadedAt: new Date(),
          };
          resolve(imageInfo);
        };
        img.onerror = () => reject(new Error('Invalid image file'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  // ============================================================================
  // UPLOAD HANDLERS
  // ============================================================================

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (!allowMultiple && fileArray.length > 1) {
      alert('Only one file is allowed');
      return;
    }

    if (images.length + fileArray.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setState(prev => ({ ...prev, isUploading: true }));

    const newImages: ImageInfo[] = [];
    const uploadProgress: UploadProgress[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!file) continue;
      
      const fileId = `upload-${Date.now()}-${i}`;

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        uploadProgress.push({
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: validationError,
        });
        continue;
      }

      // Add to progress tracking
      uploadProgress.push({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setState(prev => ({
            ...prev,
            uploadProgress: prev.uploadProgress.map(p => 
              p.fileId === fileId ? { ...p, progress } : p
            ),
          }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Process file
        const imageInfo = await processFile(file);
        newImages.push(imageInfo);

        // Update progress to completed
        setState(prev => ({
          ...prev,
          uploadProgress: prev.uploadProgress.map(p => 
            p.fileId === fileId ? { ...p, progress: 100, status: 'completed' } : p
          ),
        }));

      } catch (error) {
        // Update progress to error
        setState(prev => ({
          ...prev,
          uploadProgress: prev.uploadProgress.map(p => 
            p.fileId === fileId ? { 
              ...p, 
              progress: 0, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } : p
          ),
        }));
      }
    }

    // Add new images to the list
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    // Clear upload progress after a delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isUploading: false, uploadProgress: [] }));
    }, 2000);
  }, [images, onImagesChange, allowMultiple, maxImages, validateFile, processFile]);

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // ============================================================================
  // FILE INPUT HANDLERS
  // ============================================================================

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  // ============================================================================
  // IMAGE MANAGEMENT HANDLERS
  // ============================================================================

  const handleRemoveImage = useCallback((imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId);
    // If removing cover image, make the first remaining image the cover
    const removedImage = images.find(img => img.id === imageId);
    if (removedImage?.isCover && newImages.length > 0 && newImages[0]) {
      newImages[0].isCover = true;
    }
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleSetCover = useCallback((imageId: string) => {
    const newImages = images.map(img => ({
      ...img,
      isCover: img.id === imageId,
    }));
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleReorderImages = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    if (movedImage) {
      newImages.splice(toIndex, 0, movedImage);
    }
    
    // Update order property
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index,
    }));
    
    onImagesChange(reorderedImages);
  }, [images, onImagesChange]);

  const handleUpdateImageMetadata = useCallback((imageId: string, updates: Partial<ImageInfo>) => {
    const newImages = images.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    );
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone - Compact */}
      <div
        ref={dropZoneRef}
        className={cn(
          "border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
          state.isDragOver && !disabled
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FaUpload className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Upload Images
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag & drop or click to browse • Max {formatFileSize(maxFileSize)} • {maxImages} files max
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              disabled={disabled || state.isUploading}
              className="flex-shrink-0"
            >
              <FaImage className="h-3 w-3 mr-1.5" />
              Browse
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={allowMultiple}
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {state.uploadProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {state.uploadProgress.map((progress) => (
              <div
                key={progress.fileId}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {progress.status === 'uploading' && (
                    <FaSpinner className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {progress.status === 'completed' && (
                    <FaCheck className="h-4 w-4 text-green-600" />
                  )}
                  {progress.status === 'error' && (
                    <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {progress.fileName}
                  </p>
                  {progress.status === 'uploading' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  )}
                  {progress.status === 'error' && progress.error && (
                    <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Images ({images.length}/{maxImages})
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                isEditing={state.editingImage === image.id}
                onRemove={() => handleRemoveImage(image.id)}
                onSetCover={() => handleSetCover(image.id)}
                onEdit={() => setState(prev => ({ ...prev, editingImage: image.id }))}
                onCancelEdit={() => setState(prev => ({ ...prev, editingImage: null }))}
                onUpdateMetadata={(updates) => handleUpdateImageMetadata(image.id, updates)}
                onPreview={() => setState(prev => ({ ...prev, previewImage: image.url }))}
                showMetadata={showMetadata}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {state.previewImage && (
          <ImagePreviewModal
            imageUrl={state.previewImage}
            onClose={() => setState(prev => ({ ...prev, previewImage: null }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// IMAGE CARD COMPONENT
// ============================================================================

interface ImageCardProps {
  image: ImageInfo;
  index: number;
  isEditing: boolean;
  onRemove: () => void;
  onSetCover: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdateMetadata: (updates: Partial<ImageInfo>) => void;
  onPreview: () => void;
  showMetadata: boolean;
  disabled: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  isEditing,
  onRemove,
  onSetCover,
  onEdit,
  onCancelEdit,
  onUpdateMetadata,
  onPreview,
  showMetadata,
  disabled,
}) => {
  const [editForm, setEditForm] = useState({
    fileName: image.fileName,
    altText: image.fileName, // Default to fileName
  });

  const handleSaveEdit = () => {
    onUpdateMetadata({
      fileName: editForm.fileName,
    });
    onCancelEdit();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt={image.fileName}
          fill
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover cursor-pointer"
          onClick={onPreview}
        />
        
        {/* Cover Badge */}
        {image.isCover && (
          <Badge className="absolute top-1.5 left-1.5 text-xs h-5 bg-blue-600 text-white">
            Cover
          </Badge>
        )}

        {/* Order Badge */}
        <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-xs h-5">
          #{index + 1}
        </Badge>

        {/* Action Buttons */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onPreview}
              className="h-7 w-7 p-0"
            >
              <FaEye className="h-3 w-3" />
            </Button>
            {!image.isCover && (
            <Button
                type="button"
              size="sm"
              variant="secondary"
              onClick={onSetCover}
                className="h-7 w-7 p-0"
                title="Set as cover"
            >
              <FaImage className="h-3 w-3" />
            </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRemove}
              disabled={disabled}
              className="h-7 w-7 p-0"
            >
              <FaTrash className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata - Compact */}
      {showMetadata && (
        <div className="p-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
              {image.fileName}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatFileSize(image.fileSize)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// IMAGE PREVIEW MODAL
// ============================================================================

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt="Preview"
          width={800}
          height={600}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2"
        >
          <FaTimes className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default ImageUpload;

              >

                <FaImage className="h-4 w-4 mr-2" />

                Browse Files

              </Button>

              <input

                ref={fileInputRef}

                type="file"

                multiple={allowMultiple}

                accept={acceptedTypes.join(',')}

                onChange={handleFileInputChange}

                className="hidden"

                disabled={disabled}

              />

            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">

              Supported: {acceptedTypes.join(', ')} • Max size: {formatFileSize(maxFileSize)} • Max files: {maxImages}

            </p>

          </div>

        </CardContent>

      </Card>



      {/* Upload Progress */}

      <AnimatePresence>

        {state.uploadProgress.length > 0 && (

          <motion.div

            initial={{ opacity: 0, height: 0 }}

            animate={{ opacity: 1, height: 'auto' }}

            exit={{ opacity: 0, height: 0 }}

            className="space-y-2"

          >

            {state.uploadProgress.map((progress) => (

              <div

                key={progress.fileId}

                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"

              >

                <div className="flex-shrink-0">

                  {progress.status === 'uploading' && (

                    <FaSpinner className="h-4 w-4 animate-spin text-blue-600" />

                  )}

                  {progress.status === 'completed' && (

                    <FaCheck className="h-4 w-4 text-green-600" />

                  )}

                  {progress.status === 'error' && (

                    <FaExclamationTriangle className="h-4 w-4 text-red-600" />

                  )}

                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">

                    {progress.fileName}

                  </p>

                  {progress.status === 'uploading' && (

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">

                      <div

                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"

                        style={{ width: `${progress.progress}%` }}

                      />

                    </div>

                  )}

                  {progress.status === 'error' && progress.error && (

                    <p className="text-xs text-red-600 mt-1">{progress.error}</p>

                  )}

                </div>

              </div>

            ))}

          </motion.div>

        )}

      </AnimatePresence>



      {/* Image Gallery */}

      {images.length > 0 && (

        <div className="space-y-4">

          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">

            Images ({images.length}/{maxImages})

          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {images.map((image, index) => (

              <ImageCard

                key={image.id}

                image={image}

                index={index}

                isEditing={state.editingImage === image.id}

                onRemove={() => handleRemoveImage(image.id)}

                onSetCover={() => handleSetCover(image.id)}

                onEdit={() => setState(prev => ({ ...prev, editingImage: image.id }))}

                onCancelEdit={() => setState(prev => ({ ...prev, editingImage: null }))}

                onUpdateMetadata={(updates) => handleUpdateImageMetadata(image.id, updates)}

                onPreview={() => setState(prev => ({ ...prev, previewImage: image.url }))}

                showMetadata={showMetadata}

                disabled={disabled}

              />

            ))}

          </div>

        </div>

      )}



      {/* Image Preview Modal */}

      <AnimatePresence>

        {state.previewImage && (

          <ImagePreviewModal

            imageUrl={state.previewImage}

            onClose={() => setState(prev => ({ ...prev, previewImage: null }))}

          />

        )}

      </AnimatePresence>

    </div>

  );

};



// ============================================================================

// IMAGE CARD COMPONENT

// ============================================================================



interface ImageCardProps {

  image: ImageInfo;

  index: number;

  isEditing: boolean;

  onRemove: () => void;

  onSetCover: () => void;

  onEdit: () => void;

  onCancelEdit: () => void;

  onUpdateMetadata: (updates: Partial<ImageInfo>) => void;

  onPreview: () => void;

  showMetadata: boolean;

  disabled: boolean;

}



const ImageCard: React.FC<ImageCardProps> = ({

  image,

  index,

  isEditing,

  onRemove,

  onSetCover,

  onEdit,

  onCancelEdit,

  onUpdateMetadata,

  onPreview,

  showMetadata,

  disabled,

}) => {

  const [editForm, setEditForm] = useState({

    fileName: image.fileName,

    altText: image.fileName, // Default to fileName

  });



  const handleSaveEdit = () => {

    onUpdateMetadata({

      fileName: editForm.fileName,

    });

    onCancelEdit();

  };



  const formatFileSize = (bytes: number): string => {

    if (bytes === 0) return '0 Bytes';

    const k = 1024;

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];

  };



  return (

    <Card className="group relative overflow-hidden">

      <div className="aspect-square relative">

        <Image

          src={image.url}

          alt={image.fileName}

          fill

          sizes="(max-width: 768px) 50vw, 25vw"

          className="object-cover cursor-pointer"

          onClick={onPreview}

        />

        

        {/* Cover Badge */}

        {image.isCover && (

          <Badge className="absolute top-2 left-2 bg-blue-600 text-white">

            Cover

          </Badge>

        )}



        {/* Order Badge */}

        <Badge variant="secondary" className="absolute top-2 right-2">

          #{index + 1}

        </Badge>



        {/* Action Buttons */}

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">

          <div className="flex gap-2">

            <Button

              size="sm"

              variant="secondary"

              onClick={onPreview}

              className="h-8 w-8 p-0"

            >

              <FaEye className="h-3 w-3" />

            </Button>

            <Button

              size="sm"

              variant="secondary"

              onClick={onEdit}

              className="h-8 w-8 p-0"

            >

              <FaEdit className="h-3 w-3" />

            </Button>

            <Button

              size="sm"

              variant="secondary"

              onClick={onSetCover}

              disabled={image.isCover}

              className="h-8 w-8 p-0"

            >

              <FaImage className="h-3 w-3" />

            </Button>

            <Button

              size="sm"

              variant="destructive"

              onClick={onRemove}

              disabled={disabled}

              className="h-8 w-8 p-0"

            >

              <FaTrash className="h-3 w-3" />

            </Button>

          </div>

        </div>

      </div>



      {/* Metadata */}

      {showMetadata && (

        <CardContent className="p-3">

          {isEditing ? (

            <div className="space-y-2">

              <div>

                <Label htmlFor={`fileName-${image.id}`} className="text-xs">

                  File Name

                </Label>

                <Input

                  id={`fileName-${image.id}`}

                  value={editForm.fileName}

                  onChange={(e) => setEditForm(prev => ({ ...prev, fileName: e.target.value }))}

                  className="h-8 text-xs"

                />

              </div>

              <div className="flex gap-1">

                <Button

                  size="sm"

                  onClick={handleSaveEdit}

                  className="h-6 px-2 text-xs"

                >

                  <FaCheck className="h-3 w-3" />

                </Button>

                <Button

                  size="sm"

                  variant="outline"

                  onClick={onCancelEdit}

                  className="h-6 px-2 text-xs"

                >

                  <FaTimes className="h-3 w-3" />

                </Button>

              </div>

            </div>

          ) : (

            <div className="space-y-1">

              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">

                {image.fileName}

              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">

                {formatFileSize(image.fileSize)}

              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">

                {new Date(image.uploadedAt).toLocaleDateString()}

              </p>

            </div>

          )}

        </CardContent>

      )}

    </Card>

  );

};



// ============================================================================

// IMAGE PREVIEW MODAL

// ============================================================================



interface ImagePreviewModalProps {

  imageUrl: string;

  onClose: () => void;

}



const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({

  imageUrl,

  onClose,

}) => {

  return (

    <motion.div

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      exit={{ opacity: 0 }}

      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"

      onClick={onClose}

    >

      <motion.div

        initial={{ scale: 0.9, opacity: 0 }}

        animate={{ scale: 1, opacity: 1 }}

        exit={{ scale: 0.9, opacity: 0 }}

        className="relative max-w-4xl max-h-[90vh] p-4"

        onClick={(e) => e.stopPropagation()}

      >

        <Image

          src={imageUrl}

          alt="Preview"

          width={800}

          height={600}

          className="max-w-full max-h-full object-contain rounded-lg"

        />

        <Button

          variant="secondary"

          size="sm"

          onClick={onClose}

          className="absolute top-2 right-2"

        >

          <FaTimes className="h-4 w-4" />

        </Button>

      </motion.div>

    </motion.div>

  );

};



export default ImageUpload;


