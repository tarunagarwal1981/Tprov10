"use client";

import React from "react";
import ComingSoonPage from "../coming-soon/page";
import { FaBed } from "react-icons/fa";

export default function HotelOnlyPackagePage() {
  return (
    <ComingSoonPage
      packageType="Hotel Only"
      description="Create standalone hotel bookings with various meal plans. Perfect for accommodation-focused travel packages."
      features={[
        "Room type selection",
        "Hotel amenities",
        "Flexible dates",
        "Meal plan options",
        "Special requests",
        "Loyalty program integration"
      ]}
      icon={<FaBed className="h-8 w-8 text-white" />}
      gradient="from-purple-500 to-pink-500"
    />
  );
}
