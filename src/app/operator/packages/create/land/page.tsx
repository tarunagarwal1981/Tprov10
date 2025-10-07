"use client";

import React from "react";
import ComingSoon from "../coming-soon/ComingSoon";
import { FaMountain } from "react-icons/fa";

export default function LandPackagePage() {
  return (
    <ComingSoon
      packageType="Land Package"
      description="Create complete land-based tours with detailed itineraries. Perfect for comprehensive travel experiences without flights."
      features={[
        "Day-by-day itinerary",
        "All meals included",
        "Accommodation booking",
        "Activity scheduling",
        "Transport coordination",
        "Local guide services"
      ]}
      icon={<FaMountain className="h-8 w-8 text-white" />}
      gradient="from-green-500 to-teal-500"
    />
  );
}
