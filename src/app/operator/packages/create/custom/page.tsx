"use client";

import React from "react";
import ComingSoonPage from "../coming-soon/page";
import { FaSparkles } from "react-icons/fa";

export default function CustomPackagePage() {
  return (
    <ComingSoonPage
      packageType="Custom Package"
      description="Create fully customizable packages combining multiple components. Perfect for unique and tailored travel experiences."
      features={[
        "Mix & match components",
        "Flexible pricing",
        "Custom itineraries",
        "Tailored experiences",
        "Component library",
        "Dynamic pricing"
      ]}
      icon={<FaSparkles className="h-8 w-8 text-white" />}
      gradient="from-yellow-400 to-orange-500"
    />
  );
}
