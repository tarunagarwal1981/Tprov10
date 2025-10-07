"use client";

import React from "react";
import MultiCityPackageForm from "@/components/packages/forms/MultiCityPackageForm";

export default function MultiCityPackagePage() {
  const handleSave = async (data: any) => {
    console.log("[MultiCity] Save draft:", data);
  };
  const handlePublish = async (data: any) => {
    console.log("[MultiCity] Publish:", data);
  };
  const handlePreview = (data: any) => {
    console.log("[MultiCity] Preview:", data);
  };
  return <MultiCityPackageForm onSave={handleSave} onPublish={handlePublish} onPreview={handlePreview} />;
}
