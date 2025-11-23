"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	FiLayout as LayoutDashboard,
	FiShoppingBag as ShoppingCart,
	FiFileText as FileText,
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
import { useAuth } from "@/context/CognitoAuthContext";
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
import { MarketplaceService } from "@/lib/services/marketplaceService";

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

export function AgentSidebar() {
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [hoverExpanded, setHoverExpanded] = useState(false);
	const [supportsHover, setSupportsHover] = useState(true);
	const [availableLeadsCount, setAvailableLeadsCount] = useState<number>(0);

	useEffect(() => {
		try {
			const saved = localStorage.getItem("agent-sidebar-collapsed");
			if (saved) setIsCollapsed(JSON.parse(saved));
		} catch {}
		// detect hover-capable devices
		try {
			setSupportsHover(window.matchMedia && window.matchMedia('(hover: hover)').matches);
		} catch {}
		
		// Listen for sidebar toggle events from other components
		const handleSidebarToggle = (e: Event) => {
			const detail = (e as CustomEvent).detail as { collapsed?: boolean };
			if (typeof detail?.collapsed === 'boolean') {
				setIsCollapsed(detail.collapsed);
			}
		};
		
		window.addEventListener('agent-sidebar-toggled', handleSidebarToggle);
		return () => {
			window.removeEventListener('agent-sidebar-toggled', handleSidebarToggle);
		};
	}, []);

	// Fetch available leads count for marketplace badge
	useEffect(() => {
		const fetchMarketplaceStats = async () => {
			if (!user?.id) return;
			
			try {
				const stats = await MarketplaceService.getMarketplaceStats(user.id);
				setAvailableLeadsCount(stats.totalAvailable);
			} catch (error) {
				console.error('Error fetching marketplace stats:', error);
			}
		};

		fetchMarketplaceStats();
		
		// Refresh stats every 30 seconds
		const interval = setInterval(fetchMarketplaceStats, 30000);
		
		return () => clearInterval(interval);
	}, [user?.id]);

	const toggleCollapsed = useCallback(() => {
		const newState = !isCollapsed;
		setIsCollapsed(newState);
		try {
			localStorage.setItem("agent-sidebar-collapsed", JSON.stringify(newState));
			// Notify other components (e.g., layout) within this tab
			window.dispatchEvent(new CustomEvent('agent-sidebar-toggled', { detail: { collapsed: newState } }));
		} catch {}
	}, [isCollapsed]);

	const toggleSubmenu = (id: string) => {
		setOpenSubmenus((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const navItems: NavItem[] = [
		{ id: "dashboard", label: "Dashboard", href: "/agent", icon: LayoutDashboard, enabled: true },
		{ 
			id: "marketplace", 
			label: "Lead Marketplace", 
			href: "/agent/marketplace", 
			icon: ShoppingCart, 
			badge: availableLeadsCount, 
			enabled: true 
		},
		{
			id: "leads",
			label: "My Leads",
			href: "/agent/leads",
			icon: FileText,
			enabled: true,
			submenu: [
				{ label: "All Leads", href: "/agent/leads" },
				{ label: "Active", href: "/agent/leads/active" },
				{ label: "Contacted", href: "/agent/leads/contacted" },
				{ label: "Converted", href: "/agent/leads/converted" },
			],
		},
		{
			id: "bookings",
			label: "Bookings",
			href: "/agent/bookings",
			icon: Users,
			enabled: false,
			submenu: [
				{ label: "All Bookings", href: "/agent/bookings" },
				{ label: "Pending", href: "/agent/bookings/pending" },
				{ label: "Confirmed", href: "/agent/bookings/confirmed" },
				{ label: "Completed", href: "/agent/bookings/completed" },
			],
		},
		{ id: "analytics", label: "Analytics", href: "/agent/analytics", icon: BarChart3, enabled: false },
		{ id: "communication", label: "Communication", href: "/agent/communication", icon: MessageSquare, enabled: false },
		{ id: "settings", label: "Settings", href: "/agent/settings", icon: Settings, enabled: false },
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
			aria-label="Agent Sidebar"
			onMouseEnter={() => { if (supportsHover && isCollapsed) setHoverExpanded(true); }}
			onMouseLeave={() => { if (supportsHover) setHoverExpanded(false); }}
		>
			{/* Logo & Toggle */}
			<div className="h-20 flex items-center justify-between px-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
				{!effectiveCollapsed && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
						<Link href="/agent">
							<LogoSVG width={280} height={66} variant="light" />
						</Link>
					</motion.div>
				)}
				{effectiveCollapsed && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center w-full">
						<Link href="/agent">
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
					
					return (
					<div key={item.id}>
						{/* Main Nav Item */}
						{isDisabled ? (
							<div>
								<motion.div
									className={cn(
										"flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
										"opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600"
									)}
									aria-disabled={true}
									title="Coming soon"
								>
									<item.icon className="w-5 h-5 flex-shrink-0 text-zinc-400 dark:text-zinc-600" />
									{!effectiveCollapsed && (
										<>
											<span className="flex-1 font-medium text-sm">{item.label}</span>
											<span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
												Soon
											</span>
										</>
									)}
								</motion.div>
							</div>
						) : (
							<Link href={item.href} className="block">
								<motion.div
									whileHover={{ x: 4 }}
									className={cn(
										"flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer",
										isActive(item.href)
											? "bg-gradient-to-r from-blue-50 to-purple-50 text-[#6366F1] border border-blue-100 shadow-sm dark:from-blue-900/10 dark:to-purple-900/10"
											: "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
									)}
									role="link"
									aria-current={isActive(item.href) ? "page" : undefined}
								>
									<item.icon className={cn(
										"w-5 h-5 flex-shrink-0", 
										isActive(item.href) 
											? "text-[#6366F1]" 
											: "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-100"
									)} />
									{!effectiveCollapsed && (
										<>
											<span className="flex-1 font-medium text-sm">{item.label}</span>
											{item.badge !== undefined && item.badge > 0 && (
												<Badge className="h-6 min-w-[24px] px-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white border-0 text-xs">
													{item.badge}
												</Badge>
											)}
										</>
									)}
								</motion.div>
							</Link>
						)}

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
														? "bg-blue-50 text-[#6366F1] font-medium dark:bg-blue-900/20"
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
								<AvatarFallback className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white font-semibold">
									{((user as any)?.name?.charAt(0) || "A")}
								</AvatarFallback>
							</Avatar>
							{!effectiveCollapsed && (
								<div className="flex-1 min-w-0 text-left">
									<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{(user as any)?.name || "Travel Agent"}</p>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">Agent</p>
								</div>
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg w-48">
						<DropdownMenuItem className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
							<UserIcon className="w-4 h-4 mr-2" />
							Profile
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
							<Settings className="w-4 h-4 mr-2" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuItem 
							className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
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

export default AgentSidebar;

