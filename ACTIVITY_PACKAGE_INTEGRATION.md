# Activity Package Supabase Integration

This document outlines the complete implementation of Supabase backend integration for Activity Packages, including gallery and front picture functionality.

## 🏗️ Architecture Overview

The integration consists of several key components:

1. **Database Schema** - Comprehensive Supabase tables for activity packages
2. **Backend Services** - TypeScript services for CRUD operations
3. **React Hooks** - Custom hooks for state management
4. **UI Components** - Image upload and management components
5. **Form Integration** - Updated form components with backend integration

## 📊 Database Schema

### Core Tables

#### `activity_packages`
Main table storing activity package information:
- Basic information (title, description, destination)
- Activity details (duration, difficulty, languages)
- Location data (coordinates, meeting points)
- Policies and restrictions
- Pricing information
- SEO metadata

#### `activity_package_images`
Gallery and image management:
- File metadata (name, size, type)
- Storage paths and public URLs
- Image properties (dimensions, alt text)
- Gallery management (cover image, display order)

#### `activity_package_time_slots`
Operational hours and availability:
- Time slots with start/end times
- Capacity management
- Active/inactive status
- Day-specific availability

#### `activity_package_variants`
Package variants and options:
- Variant names and descriptions
- Price adjustments
- Feature lists
- Capacity limits

#### `activity_package_faqs`
Frequently asked questions:
- Question and answer pairs
- Category organization
- Display ordering

### Key Features

- **Row Level Security (RLS)** - Users can only access their own packages
- **Image Storage** - Integrated with Supabase Storage
- **Automatic Triggers** - Slug generation, cover image management
- **Indexes** - Optimized for common queries
- **Constraints** - Data validation at database level

## 🔧 Backend Services

### Core Service (`src/lib/supabase/activity-packages.ts`)

#### CRUD Operations
```typescript
// Create new package
createActivityPackage(data: CreateActivityPackageData)

// Get package with relations
getActivityPackage(id: string)

// Update existing package
updateActivityPackage(id: string, data: UpdateActivityPackageData)

// Delete package
deleteActivityPackage(id: string)

// List packages with filtering
listActivityPackages(options: ActivityPackageListOptions)
```

#### Image Management
```typescript
// Upload image
uploadActivityPackageImage(packageId: string, file: File, metadata?)

// Delete image
deleteActivityPackageImage(imageId: string)

// Update image metadata
updateActivityPackageImage(imageId: string, updates)
```

#### Data Conversion
```typescript
// Form data to database format
formDataToDatabase(formData: ActivityPackageFormData, operatorId: string)

// Database data to form format
databaseToFormData(dbData: ActivityPackageWithRelations)
```

## 🎣 React Hooks

### Main Hook (`src/hooks/useActivityPackage.ts`)

```typescript
const {
  // Data
  package,
  packages,
  loading,
  saving,
  error,
  
  // Actions
  createPackage,
  updatePackage,
  deletePackage,
  loadPackage,
  loadPackages,
  uploadImage,
  removeImage,
  
  // Utilities
  clearError,
  refresh,
} = useActivityPackage({ packageId, autoLoad });
```

### Specialized Hooks

```typescript
// For creating new packages
const { createPackage, saving, error } = useCreateActivityPackage();

// For editing existing packages
const { package, updatePackage, deletePackage } = useEditActivityPackage(packageId);

// For listing packages
const { packages, loadPackages, pagination } = useActivityPackageList();
```

## 🖼️ Image Upload Component

### Features

- **Drag & Drop Support** - Intuitive file upload
- **Multiple File Types** - JPEG, PNG, WebP, GIF
- **File Validation** - Size and type checking
- **Progress Tracking** - Real-time upload progress
- **Image Management** - Cover image selection, reordering
- **Preview Modal** - Full-size image viewing
- **Metadata Editing** - Alt text, captions, file names

### Usage

```typescript
<ImageUpload
  images={images}
  onImagesChange={setImages}
  maxImages={10}
  maxFileSize={10 * 1024 * 1024} // 10MB
  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
  allowMultiple={true}
  showMetadata={true}
/>
```

## 📝 Form Integration

### Updated Components

#### BasicInformationTab
- Integrated with new ImageUpload component
- Real-time image processing
- Cover image management
- Gallery organization

#### ActivityPackageForm
- Supabase backend integration
- Loading states
- Error handling
- Auto-save functionality
- Form validation

### Key Features

- **Real-time Validation** - Form validation with error display
- **Auto-save** - Automatic draft saving
- **Loading States** - User feedback during operations
- **Error Handling** - Comprehensive error management
- **Data Persistence** - Seamless save/load operations

## 🚀 Getting Started

### 1. Database Setup

Run the migration to create the database schema:

```sql
-- Run the migration file
supabase/migrations/001_create_activity_packages_schema.sql
```

### 2. Environment Variables

Ensure your `.env.local` includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Storage Bucket

The migration automatically creates the `activity-package-images` storage bucket with proper policies.

### 4. Usage Example

```typescript
import { ActivityPackageForm } from '@/components/packages/forms/ActivityPackageForm';

export default function CreatePackagePage() {
  return (
    <ActivityPackageForm
      mode="create"
      onSave={(data) => console.log('Saved:', data)}
      onPublish={(data) => console.log('Published:', data)}
    />
  );
}
```

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own packages
- Published packages are visible to all users
- Image access is restricted by package ownership

### File Upload Security
- File type validation
- Size limits enforced
- Secure storage paths
- Public URL generation

### Data Validation
- Database constraints
- TypeScript type safety
- Form validation
- Input sanitization

## 📈 Performance Optimizations

### Database
- Strategic indexes for common queries
- Efficient pagination
- Optimized joins for related data

### Frontend
- Lazy loading of images
- Debounced auto-save
- Optimistic updates
- Efficient re-renders

### Storage
- Image compression
- CDN delivery
- Caching strategies

## 🧪 Testing

### Test Page
Visit `/operator/packages/activity/test` to test the complete integration.

### Test Scenarios
1. **Create Package** - Test form submission and data persistence
2. **Image Upload** - Test drag & drop, file validation, gallery management
3. **Edit Package** - Test loading existing data and updates
4. **Error Handling** - Test error states and recovery

## 🔧 Configuration Options

### Image Upload Settings
```typescript
interface ImageUploadProps {
  maxImages?: number;           // Default: 10
  maxFileSize?: number;         // Default: 10MB
  acceptedTypes?: string[];     // Default: common image types
  allowMultiple?: boolean;      // Default: true
  showPreview?: boolean;        // Default: true
  showMetadata?: boolean;       // Default: true
}
```

### Form Options
```typescript
interface ActivityPackageFormProps {
  mode?: 'create' | 'edit';    // Default: 'create'
  packageId?: string;          // Required for edit mode
  initialData?: Partial<ActivityPackageFormData>;
  onSave?: (data) => void;
  onPublish?: (data) => void;
  onPreview?: (data) => void;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Image Upload Fails**
   - Check file size and type
   - Verify storage bucket permissions
   - Ensure RLS policies are correct

2. **Form Not Saving**
   - Check user authentication
   - Verify database connection
   - Review error messages in console

3. **Images Not Displaying**
   - Check public URL generation
   - Verify storage bucket configuration
   - Ensure proper CORS settings

### Debug Tools

- Browser DevTools for network requests
- Supabase Dashboard for database queries
- Console logs for error tracking

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contributing

When contributing to this integration:

1. Follow TypeScript best practices
2. Maintain comprehensive error handling
3. Add proper type definitions
4. Include unit tests for new features
5. Update documentation

## 📄 License

This integration is part of the travel booking application and follows the same license terms.
