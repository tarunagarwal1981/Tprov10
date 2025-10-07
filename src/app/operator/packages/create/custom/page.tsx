"use client";

import React from "react";
import ComingSoon from "../coming-soon/ComingSoon";
import { FaStar } from "react-icons/fa";

export default function CustomPackagePage() {
  return (
    <ComingSoon
      packageType="Custom Package"
      description="Create fully customizable packages combining multiple components. Perfect for unique and tailored travel experiences."
      features={[
        "Mix & match components",
        "Flexible pricing",
        "Custom itineraries",
        "Tailored experiences",
        "Component library",
        "Dynamic pricing",
      ]}
      icon={<FaStar className="h-8 w-8 text-white" />}
      gradient="from-yellow-400 to-orange-500"
    />
  );
}
