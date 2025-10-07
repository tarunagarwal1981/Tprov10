"use client";

import React from "react";
import ComingSoonPage from "../coming-soon/page";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function MultiCityPackagePage() {
  return (
    <ComingSoonPage
      packageType="Multi-City Package"
      description="Create comprehensive multi-destination tours without accommodation. Perfect for day trips and city-hopping experiences."
      features={[
        "Multiple destination planning",
        "Flexible itinerary builder",
        "Transport coordination",
        "Activity scheduling",
        "Route optimization",
        "Group management tools"
      ]}
      icon={<FaMapMarkerAlt className="h-8 w-8 text-white" />}
      gradient="from-purple-500 to-pink-500"
    />
  );
}
