"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	FiZap,
	FiMapPin,
	FiTruck,
	FiHome,
	FiAirplay,
	FiActivity,
	FiAnchor,
	FiCreditCard,
	FiBed,
	FiCheckCircle,
	FiArrowRight,
	FiPlane,
	FiPlaneDeparture,
	FiStar,
	FiCar,
} from "react-icons/fi";
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
		icon: FiZap,
		gradient: "from-orange-400 to-pink-500",
		features: ["Multiple variants", "Time slots", "Age restrictions"],
	},
	{
		key: "transfer",
		title: "Transfer Package",
		description:
			"Airport transfers, city transfers, and transportation services",
		icon: FiCar,
		gradient: "from-sky-500 to-cyan-400",
		features: ["Multiple vehicles", "One-way/Round trip", "Real-time tracking"],
	},
	{
		key: "multi_city",
		title: "Multi-City Package",
		description: "Multi-destination tours without accommodation",
		icon: FiMapPin,
		gradient: "from-purple-500 to-pink-500",
		features: ["Multiple cities", "Flexible itinerary", "Transport included"],
	},
	{
		key: "multi_city_hotel",
		title: "Multi-City with Hotel",
		description: "Multi-city tours with accommodation and meals",
		icon: FiHome,
		gradient: "from-indigo-500 to-blue-500",
		features: ["Hotel categories", "Room types", "Meal plans"],
	},
	{
		key: "fixed_departure_flight",
		title: "Fixed Departure with Flight",
		description: "Group tours with fixed dates and flight inclusions",
		icon: FiPlane,
		gradient: "from-blue-500 to-indigo-600",
		features: ["Flight details", "Group discounts", "Departure dates"],
	},
	{
		key: "land",
		title: "Land Package",
		description: "Complete land-based tours with detailed itineraries",
		icon: FiActivity,
		gradient: "from-emerald-500 to-teal-500",
		features: ["Day-by-day itinerary", "All meals", "Accommodation"],
	},
	{
		key: "cruise",
		title: "Cruise Package",
		description: "Ocean and river cruises with multiple ports",
		icon: FiAnchor,
		gradient: "from-cyan-400 to-blue-500",
		features: ["Cabin types", "Shore excursions", "Onboard activities"],
	},
	{
		key: "hotel_only",
		title: "Hotel Only",
		description: "Standalone hotel bookings with various meal plans",
		icon: FiBed,
		gradient: "from-purple-500 to-pink-500",
		features: ["Room types", "Amenities", "Flexible dates"],
	},
	{
		key: "flight_only",
		title: "Flight Only",
		description: "Flight bookings with multiple class options",
		icon: FiPlaneDeparture,
		gradient: "from-orange-500 to-red-500",
		features: ["One-way/Round trip", "Class selection", "Multi-city flights"],
	},
	{
		key: "custom",
		title: "Custom Package",
		description:
			"Fully customizable packages combining multiple components",
		icon: FiStar,
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
		},
	},
};

const cardVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 250 } },
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
		<div className={cn("w-full", className)}>
			<motion.div
				variants={gridVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				{PACKAGE_TYPES.map((type) => (
					<motion.button
						key={type.key}
						variants={cardVariants}
						onClick={() => handleSelect(type.key)}
						whileHover={{ y: -4, scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className={cn(
							"relative group text-left rounded-2xl p-5 transition-all duration-300",
							"bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl",
							"border",
							selected === type.key
								? "border-transparent ring-2 ring-offset-0 ring-indigo-500"
								: "border-zinc-200/60 dark:border-zinc-800/60",
							"shadow-sm hover:shadow-lg",
							"focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
						)}
						aria-pressed={selected === type.key}
						aria-label={type.title}
					>
						{/* Glow */}
						<div className={cn(
							"pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity",
							"group-hover:opacity-100",
							`bg-gradient-to-r ${type.gradient} blur-xl`
						)} />

						{/* Content */}
						<div className="relative z-10">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className={cn(
										"h-12 w-12 rounded-xl grid place-items-center",
										"bg-gradient-to-br",
										`${type.gradient}`
									)}>
										<type.icon className="h-7 w-7 text-white" />
									</div>
									<div>
										<h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
											{type.title}
										</h3>
										<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
											{type.description}
										</p>
									</div>
								</div>
								{selected === type.key && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										className="text-indigo-600 dark:text-indigo-400"
									>
										<FiCheckCircle className="h-5 w-5" />
									</motion.div>
								)}
							</div>

							{/* Features */}
							<div className="mt-4 flex flex-wrap gap-2">
								{type.features.map((f) => (
									<span key={f} className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
										{f}
									</span>
								))}
							</div>

							{/* Coming soon */}
							{type.comingSoon && (
								<Badge className="mt-3" variant="secondary">Coming soon</Badge>
							)}
						</div>
					</motion.button>
				))}
			</motion.div>

			<AnimatePresence>
				{selected && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						className="mt-6 flex justify-end"
					>
						<Button className="gap-2" onClick={() => onChange?.(selected)}>
							Continue
							<FiArrowRight className="h-4 w-4" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default PackageTypeSelector;
