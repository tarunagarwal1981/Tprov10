"use client";

import React from "react";
import ComingSoon from "./ComingSoon";
import { FaStar } from "react-icons/fa";

export default function ComingSoonPage() {
  return (
    <ComingSoon
      packageType="Coming Soon"
      description="This package type is under construction. We’re working hard to bring it to you soon."
      features={["Robust builder", "Rich pricing", "Flexible workflows", "Great UX"]}
      icon={<FaStar className="h-8 w-8 text-white" />}
      gradient="from-purple-500 to-indigo-600"
    />
  );
}
