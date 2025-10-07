"use client";

import React from "react";
import ComingSoon from "../coming-soon/ComingSoon";
import { FaShip } from "react-icons/fa";

export default function CruisePackagePage() {
  return (
    <ComingSoon
      packageType="Cruise Package"
      description="Create ocean and river cruise packages with multiple ports. Perfect for cruise-based travel experiences."
      features={[
        "Cabin type selection",
        "Shore excursion planning",
        "Onboard activities",
        "Dining options",
        "Port scheduling",
        "Cruise line integration"
      ]}
      icon={<FaShip className="h-8 w-8 text-white" />}
      gradient="from-cyan-400 to-blue-500"
    />
  );
}
