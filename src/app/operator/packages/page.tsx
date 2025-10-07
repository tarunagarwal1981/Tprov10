"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate, useMotionValueEvent } from 'framer-motion';
import {
	FiPackage as PackageIcon,
	FiPlus as Plus,
	FiSearch as SearchIcon,
	FiFilter as Filter,
	FiGrid as Grid3x3,
	FiList as List,
	FiTrendingUp as TrendingUp,
	FiDollarSign as DollarSign,
	FiStar as Star,
	FiEye as Eye,
	FiMoreVertical as MoreVertical,
	FiEdit as Edit,
	FiTrash as Trash,
	FiCopy as Copy,
} from 'react-icons/fi';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Package {
	id: string;
	title: string;
	type: string;
	status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
	price: number;
	rating: number;
	reviews: number;
	bookings: number;
	views: number;
	image: string;
	createdAt: Date;
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
	const motionValue = useMotionValue(0);
	const [displayValue, setDisplayValue] = useState(0);
	
	useEffect(() => {
		const controls = animate(motionValue, value, { duration: 0.8, ease: 'easeOut' });
		return () => controls.stop();
	}, [value, motionValue]);
	
	useMotionValueEvent(motionValue, 'change', (latest) => {
		setDisplayValue(Math.round(latest));
	});
	
	return (
		<motion.span>{prefix}{displayValue}{suffix}</motion.span>
	);
}

export default function PackagesPage() {
	const [packages, setPackages] = useState<Package[]>([]);
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [showFilters, setShowFilters] = useState(false);

	const [stats, setStats] = useState({
		total: 24,
		active: 18,
		revenue: 24580,
		avgRating: 4.8,
	});

	useEffect(() => {
		// Supabase integration placeholder
		// Example:
		// const supabase = createClient();
		// const { data, error } = await supabase.from('packages').select('*');
		// if (!error) setPackages(data as Package[]);
		setLoading(false);
	}, []);

	const filtered = useMemo(() => {
		return packages
			.filter(p => (statusFilter === 'ALL' ? true : p.status === statusFilter))
			.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [packages, statusFilter, searchQuery]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'DRAFT':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
			case 'INACTIVE':
				return 'bg-gray-100 text-gray-700 border-gray-200';
			default:
				return 'bg-gray-100 text-gray-700 border-gray-200';
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-3 lg:ml-[280px]">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-slate-900 mb-2">Packages</h1>
				<p className="text-slate-600">Manage your travel packages and offerings</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-slate-600 mb-2">Total Packages</p>
									<p className="text-3xl font-bold text-slate-900">
										<AnimatedNumber value={stats.total} />
									</p>
								</div>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
									<PackageIcon className="w-6 h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-slate-600 mb-2">Active Packages</p>
									<p className="text-3xl font-bold text-slate-900">
										<AnimatedNumber value={stats.active} />
									</p>
								</div>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
									<TrendingUp className="w-6 h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-slate-600 mb-2">Total Revenue</p>
									<p className="text-3xl font-bold text-slate-900">
										<AnimatedNumber value={stats.revenue} prefix="£" />
									</p>
								</div>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
									<DollarSign className="w-6 h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-slate-600 mb-2">Avg. Rating</p>
									<p className="text-3xl font-bold text-slate-900">
										<AnimatedNumber value={stats.avgRating} />
									</p>
								</div>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
									<Star className="w-6 h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Controls Bar */}
			<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg mb-4">
				<CardContent className="p-4">
					<div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
						{/* Search */}
						<div className="relative flex-1 w-full max-w-md">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<Input
								type="text"
								placeholder="Search packages..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-indigo-400"
							/>
						</div>

						{/* Right Controls */}
						<div className="flex items-center gap-2 w-full lg:w-auto justify-end">
							{/* Status Filter */}
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
							>
								<option value="ALL">All Status</option>
								<option value="ACTIVE">Active</option>
								<option value="DRAFT">Draft</option>
								<option value="INACTIVE">Inactive</option>
							</select>

							{/* View Toggle */}
							<div className="flex items-center border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setViewMode('grid')}
									className={viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : ''}
								>
									<Grid3x3 className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setViewMode('list')}
									className={viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : ''}
								>
									<List className="w-4 h-4" />
								</Button>
							</div>

							{/* Filters Toggle */}
							<Button
								variant="outline"
								onClick={() => setShowFilters(!showFilters)}
								className="border-slate-200 dark:border-zinc-800"
							>
								<Filter className="w-4 h-4 mr-2" />
								Filters
							</Button>

							{/* Create Package Button */}
							<Link href="/operator/packages/create">
								<Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg">
									<Plus className="w-4 h-4 mr-2" />
									Create Package
								</Button>
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Empty State or Package Grid - Placeholder for integration */}
			{!loading && filtered.length === 0 ? (
				<div className="text-center py-8">
					<PackageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
					<h3 className="text-xl font-semibold text-slate-900 mb-2">No packages yet</h3>
					<p className="text-slate-600 mb-4">Create your first package to get started</p>
					<Link href="/operator/packages/create">
						<Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
							<Plus className="w-4 h-4 mr-2" />
							Create Your First Package
						</Button>
					</Link>
				</div>
			) : null}
		</div>
	);
}
