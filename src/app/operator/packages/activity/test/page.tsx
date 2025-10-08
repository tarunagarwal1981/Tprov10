"use client";

import React from 'react';
import { ActivityPackageForm } from '@/components/packages/forms/ActivityPackageForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaFlask } from 'react-icons/fa';

export default function ActivityPackageTestPage() {
  const handleSave = async (data: any) => {
    console.log('Package saved:', data);
  };

  const handlePublish = async (data: any) => {
    console.log('Package published:', data);
  };

  const handlePreview = (data: any) => {
    console.log('Package preview:', data);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaFlask className="h-5 w-5 text-blue-600" />
            Activity Package Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            This page tests the complete integration of the Activity Package form with Supabase backend,
            including gallery and front picture upload functionality.
          </p>
        </CardContent>
      </Card>

      <ActivityPackageForm
        mode="create"
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={handlePreview}
        className="max-w-6xl mx-auto"
      />
    </div>
  );
}
