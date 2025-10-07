"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	FaBolt,
	FaCar,
	FaMapMarkerAlt,
	FaHotel,
	FaPlane,
	FaMountain,
	FaShip,
	FaBed,
	FaPlaneDeparture,
	FaMagic,
	FaCheckCircle,
	FaArrowRight,
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PackageTypeKey =
	| "activity"
	| "transfer"
	| "multi_city"
	| "multi_city_hotel"
	| "fixed_departure_flight"
	| "land"
	| "cruise"
	| "hotel_only"
	| "flight_only"
	| "custom";

interface PackageType {
	key: PackageTypeKey;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	gradient: string; // tailwind gradient classes
	features: string[];
	comingSoon?: boolean;
}

interface PackageTypeSelectorProps {
	value?: PackageTypeKey | null;
	onChange?: (type: PackageTypeKey) => void;
	className?: string;
}

const PACKAGE_TYPES: PackageType[] = [
	{
		key: "activity",
		title: "Activity Package",
		description:
			"Single activities, attractions, and experiences with time slots and variants",
		icon: FaBolt,
		gradient: "from-orange-400 to-pink-500",
		features: ["Multiple variants", "Time slots", "Age restrictions"],
	},
	{
		key: "transfer",
		title: "Transfer Package",
		description:
			"Airport transfers, city transfers, and transportation services",
		icon: FaCar,
		gradient: "from-blue-500 to-cyan-400",
		features: ["Multiple vehicles", "One-way/Round trip", "Real-time tracking"],
	},
	{
		key: "multi_city",
		title: "Multi-City Package",
		description: "Multi-destination tours without accommodation",
		icon: FaMapMarkerAlt,
		gradient: "from-purple-500 to-pink-500",
		features: ["Multiple cities", "Flexible itinerary", "Transport included"],
	},
	{
		key: "multi_city_hotel",
		title: "Multi-City with Hotel",
		description: "Multi-city tours with accommodation and meals",
		icon: FaHotel,
		gradient: "from-indigo-500 to-blue-500",
		features: ["Hotel categories", "Room types", "Meal plans"],
	},
	{
		key: "fixed_departure_flight",
		title: "Fixed Departure with Flight",
		description: "Group tours with fixed dates and flight inclusions",
		icon: FaPlane,
		gradient: "from-blue-500 to-indigo-600",
		features: ["Flight details", "Group discounts", "Departure dates"],
	},
	{
		key: "land",
		title: "Land Package",
		description: "Complete land-based tours with detailed itineraries",
		icon: FaMountain,
		gradient: "from-green-500 to-teal-500",
		features: ["Day-by-day itinerary", "All meals", "Accommodation"],
	},
	{
		key: "cruise",
		title: "Cruise Package",
		description: "Ocean and river cruises with multiple ports",
		icon: FaShip,
		gradient: "from-cyan-400 to-blue-500",
		features: ["Cabin types", "Shore excursions", "Onboard activities"],
	},
	{
		key: "hotel_only",
		title: "Hotel Only",
		description: "Standalone hotel bookings with various meal plans",
		icon: FaBed,
		gradient: "from-purple-500 to-pink-500",
		features: ["Room types", "Amenities", "Flexible dates"],
	},
	{
		key: "flight_only",
		title: "Flight Only",
		description: "Flight bookings with multiple class options",
		icon: FaPlaneDeparture,
		gradient: "from-orange-500 to-red-500",
		features: ["One-way/Round trip", "Class selection", "Multi-city flights"],
	},
	{
		key: "custom",
		title: "Custom Package",
		description:
			"Fully customizable packages combining multiple components",
		icon: FaMagic,
		gradient: "from-yellow-400 to-orange-500",
		features: ["Mix & match", "Flexible components", "Tailored pricing"],
		comingSoon: false,
	},
];

const gridVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.1,
		},
	},
};

const cardVariants = {
	hidden: { 
		opacity: 0, 
		y: 20,
		scale: 0.95,
	},
	show: { 
		opacity: 1, 
		y: 0,
		scale: 1,
		transition: { 
			type: "spring" as const, 
			damping: 25, 
			stiffness: 300,
			duration: 0.6,
		} 
	},
};

const hoverVariants = {
	hover: {
		y: -4,
		scale: 1.02,
		transition: {
			type: "spring",
			damping: 20,
			stiffness: 400,
		},
	},
	tap: {
		scale: 0.98,
		transition: {
			type: "spring",
			damping: 20,
			stiffness: 400,
		},
	},
};

export const PackageTypeSelector: React.FC<PackageTypeSelectorProps> = ({ value, onChange, className }) => {
	const [selected, setSelected] = useState<PackageTypeKey | null>(value ?? null);

	useEffect(() => {
		const stored = typeof window !== "undefined" ? localStorage.getItem("package-type") : null;
		if (!value && stored) {
			setSelected(stored as PackageTypeKey);
		}
	}, [value]);

	useEffect(() => {
		if (selected) {
			try { localStorage.setItem("package-type", selected); } catch {}
		}
	}, [selected]);

	useEffect(() => {
		if (value !== undefined) setSelected(value);
	}, [value]);

	const handleSelect = useCallback((key: PackageTypeKey) => {
		setSelected(key);
		onChange?.(key);
	}, [onChange]);

	return (
		<div className={cn("w-full package-text-fix package-scroll-fix", className)}>
			<motion.div
				variants={gridVariants}
				initial="hidden"
				animate="show"
				className="package-grid-fix grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				{PACKAGE_TYPES.map((type, index) => (
					<motion.button
						key={type.key}
						variants={cardVariants}
						custom={index}
						onClick={() => handleSelect(type.key)}
						whileHover="hover"
						whileTap="tap"
						className={cn(
							"relative group text-left p-6 transition-all duration-300",
							"package-selector-glass package-transform-fix package-animation-fix",
							"package-border-radius-fix package-button-fix",
							"min-h-[200px] package-flex-fix",
							"border-2",
							selected === type.key
								? "border-transparent ring-2 ring-offset-2 ring-indigo-500/50 package-shadow-hover-fix"
								: "border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300/80 package-shadow-fix",
							"hover:package-shadow-hover-fix",
							"package-ring-fix",
							"ios-touch-fix chrome-scrollbar-fix"
						)}
						aria-pressed={selected === type.key}
						aria-label={type.title}
					>
						{/* Premium Glow Effect */}
						<div className={cn(
							"pointer-events-none absolute -inset-1 opacity-0 transition-all duration-500",
							"group-hover:opacity-20 group-hover:blur-xl package-border-radius-fix",
							`bg-gradient-to-r ${type.gradient} package-gradient-fix`
						)} />

						{/* Selection Indicator */}
						{selected === type.key && (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								className="absolute top-3 right-3 z-20"
							>
								<div className="h-6 w-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
									<FaCheckCircle className="h-4 w-4 text-white" />
								</div>
							</motion.div>
						)}

						{/* Content */}
						<div className="relative z-10 flex-1 flex flex-col">
							{/* Icon and Title Section */}
							<div className="flex items-start gap-4 mb-4">
								<div className={cn(
									"h-12 w-12 flex items-center justify-center",
									"bg-gradient-to-br shadow-lg package-border-radius-fix",
									`${type.gradient} package-gradient-fix`,
									"package-animation-fix"
								)}>
									<type.icon className="h-6 w-6 text-white" />
								</div>
								<div className="flex-1">
									<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
										{type.title}
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										{type.description}
									</p>
								</div>
							</div>

							{/* Features */}
							<div className="flex flex-wrap gap-2 mb-4">
								{type.features.map((feature) => (
									<span 
										key={feature} 
										className="text-xs px-3 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50"
									>
										{feature}
									</span>
								))}
							</div>

							{/* Coming Soon Badge */}
							{type.comingSoon && (
								<div className="mt-auto">
									<Badge 
										variant="secondary" 
										className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
									>
										Coming Soon
									</Badge>
								</div>
							)}
						</div>

						{/* Ripple Effect */}
						<div className="absolute inset-0 package-border-radius-fix overflow-hidden">
							<div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
						</div>
					</motion.button>
				))}
			</motion.div>

			{/* Continue Button */}
			<AnimatePresence>
				{selected && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", damping: 20, stiffness: 300 }}
						className="mt-8 flex justify-center"
					>
						<Button 
							size="lg"
							className={cn(
								"gap-3 px-8 py-4 text-lg font-semibold",
								"bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
								"shadow-lg hover:shadow-xl transform hover:scale-105",
								"package-animation-fix package-button-fix package-gradient-fix"
							)}
							onClick={() => onChange?.(selected)}
						>
							Continue with {PACKAGE_TYPES.find(t => t.key === selected)?.title}
							<FaArrowRight className="h-5 w-5" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default PackageTypeSelector;
