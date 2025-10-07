"use client";

import React from "react";
import ComingSoon from "../coming-soon/ComingSoon";
import { FaPlane } from "react-icons/fa";

export default function FixedDepartureFlightPackagePage() {
  return (
    <ComingSoon
      packageType="Fixed Departure with Flight"
      description="Create group tours with fixed dates and flight inclusions. Perfect for organized group travel experiences."
      features={[
        "Fixed departure dates",
        "Flight booking integration",
        "Group management",
        "Seat assignment",
        "Baggage handling",
        "Airport transfers"
      ]}
      icon={<FaPlane className="h-8 w-8 text-white" />}
      gradient="from-blue-500 to-indigo-600"
    />
  );
}
