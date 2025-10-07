"use client";

import React from "react";
import ComingSoonPage from "../coming-soon/page";
import { FaHotel } from "react-icons/fa";

export default function MultiCityHotelPackagePage() {
  return (
    <ComingSoonPage
      packageType="Multi-City with Hotel"
      description="Create complete multi-city tours with accommodation and meals. Perfect for comprehensive travel experiences."
      features={[
        "Multi-city itinerary planning",
        "Hotel booking integration",
        "Meal plan management",
        "Room type selection",
        "Check-in/out coordination",
        "Accommodation preferences"
      ]}
      icon={<FaHotel className="h-8 w-8 text-white" />}
      gradient="from-indigo-500 to-blue-500"
    />
  );
}
