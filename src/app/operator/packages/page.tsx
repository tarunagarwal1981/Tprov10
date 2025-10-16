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
import Image from 'next/image';
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
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Package {
	id: string;
	title: string;
	type: string;
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED' | 'ACTIVE' | 'INACTIVE';
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
		const fetchPackages = async () => {
			try {
				setLoading(true);
				const supabase = createClient();
				
				// Get current user
				const { data: { user } } = await supabase.auth.getUser();
				
				if (!user) {
					toast.error('Please log in to view packages');
					setLoading(false);
					return;
				}

		// Fetch ALL package types: activity, transfer, and multi-city
		const [activityResult, transferResult, multiCityResult] = await Promise.all([
			// Activity packages
			supabase
				.from('activity_packages')
				.select(`
					id,
					title,
					short_description,
					status,
					base_price,
					currency,
					destination_city,
					destination_country,
					created_at,
					published_at,
					activity_package_images (
						id,
						public_url,
						is_cover
					)
				`)
				.eq('operator_id', user.id)
				.order('created_at', { ascending: false }),
			// Transfer packages
			supabase
				.from('transfer_packages' as any)
				.select(`
					id,
					title,
					short_description,
					status,
					base_price,
					currency,
					destination_city,
					destination_country,
					created_at,
					published_at,
					transfer_package_images (
						id,
						public_url,
						is_cover
					)
				`)
				.eq('operator_id', user.id)
				.order('created_at', { ascending: false }),
			// Multi-city packages
			supabase
				.from('multi_city_packages' as any)
				.select(`
					id,
					title,
					short_description,
					status,
					base_price,
					currency,
					destination_region,
					total_cities,
					total_nights,
					created_at,
					published_at,
					multi_city_package_images (
						id,
						public_url,
						is_cover
					)
				`)
				.eq('operator_id', user.id)
				.order('created_at', { ascending: false })
		]);

		if (activityResult.error) {
			console.error('Error fetching activity packages:', activityResult.error);
		}
		
		if (transferResult.error) {
			console.error('Error fetching transfer packages:', transferResult.error);
		}
		
		if (multiCityResult.error) {
			console.error('Error fetching multi-city packages:', multiCityResult.error);
		}

		// Transform activity packages
		const activityPackages: Package[] = (activityResult.data || []).map((pkg: any) => {
			const coverImage = pkg.activity_package_images?.find((img: any) => img.is_cover);
			const imageUrl = coverImage?.public_url || pkg.activity_package_images?.[0]?.public_url || '';

			return {
				id: pkg.id,
				title: pkg.title,
				type: 'Activity',
				status: pkg.status?.toUpperCase() as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
				price: pkg.base_price || 0,
				rating: 0,
				reviews: 0,
				bookings: 0,
				views: 0,
				image: imageUrl,
				createdAt: new Date(pkg.created_at),
			};
		});

		// Transform transfer packages
		const transferPackages: Package[] = (transferResult.data || []).map((pkg: any) => {
			const coverImage = pkg.transfer_package_images?.find((img: any) => img.is_cover);
			const imageUrl = coverImage?.public_url || pkg.transfer_package_images?.[0]?.public_url || '';

			return {
				id: pkg.id,
				title: pkg.title,
				type: 'Transfer',
				status: pkg.status?.toUpperCase() as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
				price: pkg.base_price || 0,
				rating: 0,
				reviews: 0,
				bookings: 0,
				views: 0,
				image: imageUrl,
				createdAt: new Date(pkg.created_at),
			};
		});

		// Transform multi-city packages
		const multiCityPackages: Package[] = (multiCityResult.data || []).map((pkg: any) => {
			const coverImage = pkg.multi_city_package_images?.find((img: any) => img.is_cover);
			const imageUrl = coverImage?.public_url || pkg.multi_city_package_images?.[0]?.public_url || '';

			return {
				id: pkg.id,
				title: pkg.title,
				type: 'Multi-City',
				status: pkg.status?.toUpperCase() as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
				price: pkg.base_price || 0,
				rating: 0,
				reviews: 0,
				bookings: 0,
				views: 0,
				image: imageUrl,
				createdAt: new Date(pkg.created_at),
			};
		});

		// Combine all package types and sort by creation date
		const allPackages = [...activityPackages, ...transferPackages, ...multiCityPackages]
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			setPackages(allPackages);

			// Update stats
			const activeCount = allPackages.filter(p => p.status === 'PUBLISHED' || p.status === 'ACTIVE').length;
			const totalRevenue = allPackages.reduce((sum, p) => sum + (p.bookings * p.price), 0);
			
			setStats({
				total: allPackages.length,
				active: activeCount,
				revenue: totalRevenue,
				avgRating: 4.8, // TODO: Calculate from reviews
			});

			} catch (error) {
				console.error('Error loading packages:', error);
				toast.error('Failed to load packages');
			} finally {
		setLoading(false);
			}
		};

		fetchPackages();
	}, []);

	const filtered = useMemo(() => {
		return packages
			.filter(p => {
				if (statusFilter === 'ALL') return true;
				const pkgStatus = p.status?.toUpperCase();
				if (statusFilter === 'ACTIVE') return pkgStatus === 'PUBLISHED' || pkgStatus === 'ACTIVE';
				return pkgStatus === statusFilter;
			})
			.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [packages, statusFilter, searchQuery]);

	const getStatusColor = (status: string) => {
		const upperStatus = status?.toUpperCase();
		switch (upperStatus) {
			case 'ACTIVE':
			case 'PUBLISHED':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'DRAFT':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
			case 'INACTIVE':
			case 'ARCHIVED':
			case 'SUSPENDED':
				return 'bg-gray-100 text-gray-700 border-gray-200';
			default:
				return 'bg-gray-100 text-gray-700 border-gray-200';
		}
	};

	const getStatusLabel = (status: string) => {
		const upperStatus = status?.toUpperCase();
		switch (upperStatus) {
			case 'PUBLISHED':
				return 'Active';
			case 'DRAFT':
				return 'Draft';
			case 'ARCHIVED':
				return 'Archived';
			case 'SUSPENDED':
				return 'Suspended';
			default:
				return status;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-2 sm:p-3">
			{/* Header */}
			<div className="mb-4">
				<h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Packages</h1>
				<p className="text-sm text-slate-600">Manage your travel packages and offerings</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-medium text-slate-600 mb-1">Total Packages</p>
									<p className="text-2xl font-bold text-slate-900">
										<AnimatedNumber value={stats.total} />
									</p>
								</div>
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF4B8C] flex items-center justify-center shadow-md">
									<PackageIcon className="w-5 h-5 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-medium text-slate-600 mb-1">Active Packages</p>
									<p className="text-2xl font-bold text-slate-900">
										<AnimatedNumber value={stats.active} />
									</p>
								</div>
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
									<TrendingUp className="w-5 h-5 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-medium text-slate-600 mb-1">Total Revenue</p>
									<p className="text-2xl font-bold text-slate-900">
										<AnimatedNumber value={stats.revenue} prefix="£" />
									</p>
								</div>
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
									<DollarSign className="w-5 h-5 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
					<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg hover:shadow-xl transition-all">
						<CardContent className="p-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-medium text-slate-600 mb-1">Avg. Rating</p>
									<p className="text-2xl font-bold text-slate-900">
										<AnimatedNumber value={stats.avgRating} />
									</p>
								</div>
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
									<Star className="w-5 h-5 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Controls Bar */}
			<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 dark:border-zinc-800/60 shadow-lg mb-3">
				<CardContent className="p-3">
					<div className="flex flex-col lg:flex-row gap-2 items-center justify-between">
						{/* Search */}
						<div className="relative flex-1 w-full max-w-md">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<Input
								type="text"
								placeholder="Search packages..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-[#FF6B35]"
							/>
						</div>

						{/* Right Controls */}
						<div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
							{/* Status Filter */}
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
									className={viewMode === 'grid' ? 'bg-orange-50 text-[#FF6B35]' : ''}
								>
									<Grid3x3 className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setViewMode('list')}
									className={viewMode === 'list' ? 'bg-orange-50 text-[#FF6B35]' : ''}
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
								<Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080] text-white shadow-lg">
									<Plus className="w-4 h-4 mr-2" />
									Create Package
								</Button>
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Loading State */}
			{loading && (
				<div className="text-center py-12">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#FF6B35] mb-4"></div>
					<p className="text-slate-600">Loading packages...</p>
				</div>
			)}

			{/* Empty State */}
			{!loading && packages.length === 0 && (
				<div className="text-center py-12">
					<PackageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
					<h3 className="text-xl font-semibold text-slate-900 mb-2">No packages yet</h3>
					<p className="text-sm text-slate-600 mb-6">Create your first package to get started</p>
					<Link href="/operator/packages/create">
						<Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080]">
							<Plus className="w-4 h-4 mr-2" />
							Create Your First Package
						</Button>
					</Link>
				</div>
			)}

			{/* No Results State */}
			{!loading && packages.length > 0 && filtered.length === 0 && (
				<div className="text-center py-12">
					<SearchIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
					<h3 className="text-xl font-semibold text-slate-900 mb-2">No packages found</h3>
					<p className="text-sm text-slate-600 mb-6">Try adjusting your search or filters</p>
					<Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>
						Clear Filters
					</Button>
				</div>
			)}

			{/* Packages Grid */}
			{!loading && filtered.length > 0 && (
				<div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
					{filtered.map((pkg) => (
						<motion.div
							key={pkg.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all overflow-hidden">
								{/* Package Image */}
								{pkg.image && (
									<div className="relative h-48 w-full bg-slate-200">
										<Image 
											src={pkg.image} 
											alt={pkg.title}
											fill
											className="object-cover"
											onError={(e) => {
												e.currentTarget.src = '/images/placeholder-package.jpg';
											}}
										/>
										<div className="absolute top-2 right-2">
											<Badge className={getStatusColor(pkg.status)}>
												{getStatusLabel(pkg.status)}
											</Badge>
										</div>
									</div>
								)}
								
								<CardContent className="p-4">
									<h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{pkg.title}</h3>
									<p className="text-sm text-slate-600 mb-3">{pkg.type}</p>
									
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-1">
											<Star className="w-4 h-4 text-amber-500 fill-amber-500" />
											<span className="text-sm font-medium">{pkg.rating.toFixed(1)}</span>
											<span className="text-xs text-slate-500">({pkg.reviews})</span>
										</div>
										<div className="text-lg font-bold text-[#FF6B35]">
											${pkg.price.toFixed(2)}
										</div>
									</div>

									<div className="flex items-center justify-between pt-3 border-t border-slate-200">
										<div className="flex items-center gap-4 text-xs text-slate-600">
											<span className="flex items-center gap-1">
												<Eye className="w-3 h-3" />
												{pkg.views}
											</span>
											<span>{pkg.bookings} bookings</span>
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreVertical className="w-4 h-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>
													<Eye className="w-4 h-4 mr-2" />
													View
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Edit className="w-4 h-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Copy className="w-4 h-4 mr-2" />
													Duplicate
												</DropdownMenuItem>
												<DropdownMenuItem className="text-red-600">
													<Trash className="w-4 h-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}
