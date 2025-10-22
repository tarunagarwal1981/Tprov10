"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	FiLayout as LayoutDashboard,
	FiPackage as PackageIcon,
	FiCalendar as Calendar,
	FiUsers as Users,
	FiBarChart as BarChart3,
	FiMessageSquare as MessageSquare,
	FiSettings as Settings,
	FiChevronLeft as ChevronLeft,
	FiChevronRight as ChevronRight,
	FiLogOut as LogOut,
	FiUser as UserIcon,
} from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LogoSVG } from "@/components/marketing/Logo";

interface NavItem {
	id: string;
	label: string;
	href: string;
	icon: React.ElementType;
	badge?: number;
	enabled?: boolean; // false for not yet implemented features
	submenu?: {
		label: string;
		href: string;
	}[];
}

export function OperatorSidebar() {
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [hoverExpanded, setHoverExpanded] = useState(false);
	const [supportsHover, setSupportsHover] = useState(true);

	useEffect(() => {
		try {
			const saved = localStorage.getItem("operator-sidebar-collapsed");
			if (saved) setIsCollapsed(JSON.parse(saved));
		} catch {}
		// detect hover-capable devices
		try {
			setSupportsHover(window.matchMedia && window.matchMedia('(hover: hover)').matches);
		} catch {}
	}, []);

	const toggleCollapsed = useCallback(() => {
		const newState = !isCollapsed;
		setIsCollapsed(newState);
		try {
			localStorage.setItem("operator-sidebar-collapsed", JSON.stringify(newState));
			// Notify other components (e.g., layout) within this tab
			window.dispatchEvent(new CustomEvent('operator-sidebar-toggled', { detail: { collapsed: newState } }));
		} catch {}
	}, [isCollapsed]);

	const toggleSubmenu = (id: string) => {
		setOpenSubmenus((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const navItems: NavItem[] = [
		{ id: "dashboard", label: "Dashboard", href: "/operator", icon: LayoutDashboard, enabled: true },
		{
			id: "packages",
			label: "Packages",
			href: "/operator/packages",
			icon: PackageIcon,
			badge: 24,
			enabled: true,
			submenu: [
				{ label: "All Packages", href: "/operator/packages" },
				{ label: "Create New", href: "/operator/packages/create" },
				{ label: "Drafts", href: "/operator/packages/drafts" },
			],
		},
		{
			id: "bookings",
			label: "Bookings",
			href: "/operator/bookings",
			icon: Calendar,
			badge: 156,
			enabled: false, // Not yet implemented
			submenu: [
				{ label: "All Bookings", href: "/operator/bookings" },
				{ label: "Pending", href: "/operator/bookings/pending" },
				{ label: "Confirmed", href: "/operator/bookings/confirmed" },
				{ label: "Completed", href: "/operator/bookings/completed" },
			],
		},
		{ id: "agents", label: "Travel Agents", href: "/operator/agents", icon: Users, badge: 42, enabled: false },
		{ id: "analytics", label: "Analytics", href: "/operator/analytics", icon: BarChart3, enabled: false },
		{ id: "communication", label: "Communication", href: "/operator/communication", icon: MessageSquare, badge: 8, enabled: false },
		{ id: "settings", label: "Settings", href: "/operator/settings", icon: Settings, enabled: false },
	];

const isActive = (href: string) => {
  const path = pathname || "";
  return path === href || path.startsWith(href + "/");
};

	const effectiveCollapsed = isCollapsed && !hoverExpanded;

	const SidebarInner = (
		<motion.aside
			initial={false}
			animate={{ width: effectiveCollapsed ? 80 : 280 }}
			transition={{ duration: 0.3, ease: "easeInOut" }}
			className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-200/50 dark:border-zinc-800/50 shadow-xl z-40 flex flex-col"
			aria-label="Operator Sidebar"
			onMouseEnter={() => { if (supportsHover && isCollapsed) setHoverExpanded(true); }}
			onMouseLeave={() => { if (supportsHover) setHoverExpanded(false); }}
		>
			{/* Logo & Toggle */}
			<div className="h-20 flex items-center justify-between px-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
				{!effectiveCollapsed && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
						<Link href="/operator">
							<LogoSVG width={220} height={52} variant="light" />
						</Link>
					</motion.div>
				)}
				{effectiveCollapsed && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center w-full">
						<Link href="/operator">
							<div className="w-10 h-10 flex items-center justify-center">
								<svg viewBox="0 0 70 100" xmlns="http://www.w3.org/2000/svg" width="35" height="50">
									<defs>
										<linearGradient id="sidebarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" style={{ stopColor: '#F59E0B' }} />
											<stop offset="50%" style={{ stopColor: '#EC4899' }} />
											<stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
										</linearGradient>
									</defs>
									<g transform="translate(35, 50)">
										<path d="M 0 -26 L 4 -4 L -4 -4 Z" fill="#F59E0B"/>
										<path d="M 26 0 L 4 4 L 4 -4 Z" fill="#F97316"/>
										<path d="M 0 26 L 4 4 L -4 4 Z" fill="#EC4899"/>
										<path d="M -26 0 L -4 4 L -4 -4 Z" fill="#8B5CF6"/>
										<circle cx="0" cy="0" r="5" fill="white"/>
										<circle cx="0" cy="0" r="3" fill="url(#sidebarGradient)"/>
									</g>
								</svg>
							</div>
						</Link>
					</motion.div>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleCollapsed}
					className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
					aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{effectiveCollapsed ? (
						<ChevronRight className="w-5 h-5 text-zinc-600" />
					) : (
						<ChevronLeft className="w-5 h-5 text-zinc-600" />
					)}
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto" aria-label="Primary">
				{navItems.map((item) => {
					const isDisabled = item.enabled === false;
					const NavWrapper = isDisabled ? 'div' : Link;
					const wrapperProps = isDisabled ? {} : { href: item.href };
					
					return (
					<div key={item.id}>
						{/* Main Nav Item */}
						<NavWrapper {...wrapperProps} className={isDisabled ? "" : "block"}>
							<motion.div
								whileHover={isDisabled ? {} : { x: 4 }}
								className={cn(
									"flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
									isDisabled
										? "opacity-40 cursor-not-allowed"
										: "cursor-pointer",
									!isDisabled && isActive(item.href)
										? "bg-gradient-to-r from-orange-50 to-pink-50 text-[#FF6B35] border border-orange-100 shadow-sm dark:from-orange-900/10 dark:to-pink-900/10"
										: !isDisabled 
										? "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
										: "text-zinc-400 dark:text-zinc-600"
								)}
								role={isDisabled ? undefined : "link"}
								aria-current={!isDisabled && isActive(item.href) ? "page" : undefined}
								aria-disabled={isDisabled}
								title={isDisabled ? "Coming soon" : undefined}
							>
								<item.icon className={cn(
									"w-5 h-5 flex-shrink-0", 
									isDisabled 
										? "text-zinc-400 dark:text-zinc-600" 
										: isActive(item.href) 
										? "text-[#FF6B35]" 
										: "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-100"
								)} />
								{!effectiveCollapsed && (
									<>
										<span className="flex-1 font-medium text-sm">{item.label}</span>
										{item.badge && !isDisabled && (
											<Badge className="h-6 min-w-[24px] px-2 bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] text-white border-0 text-xs">
												{item.badge}
											</Badge>
										)}
										{isDisabled && !effectiveCollapsed && (
											<span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
												Soon
											</span>
										)}
									</>
								)}
							</motion.div>
						</NavWrapper>

						{/* Submenu Toggle (click item again to toggle) */}
						{item.submenu && !effectiveCollapsed && !isDisabled && (
							<div className="pl-12 pt-1">
								<Button variant="ghost" size="sm" onClick={() => toggleSubmenu(item.id)} className="h-7 px-2 text-xs">
									{openSubmenus.includes(item.id) ? "Hide" : "Show"} {item.label} menu
								</Button>
							</div>
						)}

						{/* Submenu */}
						<AnimatePresence>
							{item.submenu && !effectiveCollapsed && !isDisabled && openSubmenus.includes(item.id) && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="ml-12 mt-2 space-y-1"
								>
									{item.submenu.map((sub) => (
										<Link key={sub.href} href={sub.href} className="block">
											<div
												className={cn(
													"px-3 py-2 rounded-lg text-sm transition-colors",
                                                  (pathname || "") === sub.href
														? "bg-orange-50 text-[#FF6B35] font-medium dark:bg-orange-900/20"
														: "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
												)}
											>
												{sub.label}
											</div>
										</Link>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					);
				})}
			</nav>

			{/* User Section */}
			<div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className={cn("w-full flex items-center gap-3 p-2 h-auto hover:bg-zinc-50 dark:hover:bg-zinc-800/60", effectiveCollapsed ? "justify-center" : "")}>
							<Avatar className="w-10 h-10">
								<AvatarImage src={(user as any)?.avatar_url} />
								<AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF4B8C] text-white font-semibold">
									{((user as any)?.name?.charAt(0) || "T")}
								</AvatarFallback>
							</Avatar>
							{!effectiveCollapsed && (
								<div className="flex-1 min-w-0 text-left">
									<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{(user as any)?.name || "Tour Operator"}</p>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">Operator</p>
								</div>
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-lg w-48">
						<DropdownMenuItem className="cursor-pointer hover:bg-zinc-50 text-zinc-700">
							<UserIcon className="w-4 h-4 mr-2" />
							Profile
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-pointer hover:bg-zinc-50 text-zinc-700">
							<Settings className="w-4 h-4 mr-2" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuItem 
							className="cursor-pointer hover:bg-red-50 text-red-600"
							onClick={logout}
						>
							<LogOut className="w-4 h-4 mr-2" />
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</motion.aside>
	);

	return (
		<>
			{/* Desktop */}
			<div className="hidden lg:block fixed left-0 top-0 h-screen" style={{ width: effectiveCollapsed ? 80 : 280 }}>
				{SidebarInner}
			</div>

			{/* Mobile */}
			<div className="lg:hidden">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsMobileOpen(true)}
					className="fixed top-4 left-4 z-50"
					aria-label="Open sidebar"
				>
					<LayoutDashboard className="h-5 w-5" />
				</Button>
				<AnimatePresence>
					{isMobileOpen && (
						<>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
								onClick={() => setIsMobileOpen(false)}
							/>
							<motion.div
								initial={{ x: -280 }}
								animate={{ x: 0 }}
								exit={{ x: -280 }}
								transition={{ duration: 0.3, ease: "easeInOut" }}
								className="fixed left-0 top-0 h-full z-50"
								style={{ width: 280 }}
							>
								{SidebarInner}
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>
		</>
	);
}

export default OperatorSidebar;
