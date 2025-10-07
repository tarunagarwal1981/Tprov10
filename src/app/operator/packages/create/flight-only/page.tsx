"use client";

import React from "react";
import ComingSoon from "../coming-soon/ComingSoon";
import { FaPlaneDeparture } from "react-icons/fa";

export default function FlightOnlyPackagePage() {
  return (
    <ComingSoon
      packageType="Flight Only"
      description="Create flight bookings with multiple class options. Perfect for air travel-focused packages."
      features={[
        "One-way/Round trip options",
        "Class selection",
        "Multi-city flights",
        "Seat selection",
        "Baggage options",
        "Airline partnerships"
      ]}
      icon={<FaPlaneDeparture className="h-8 w-8 text-white" />}
      gradient="from-orange-500 to-red-500"
    />
  );
}
