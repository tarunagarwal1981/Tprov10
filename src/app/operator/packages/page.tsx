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
import { useRouter } from 'next/navigation';
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
import { FaCar } from 'react-icons/fa';
import { TransferPackageCard, TransferPackageCardData } from '@/components/packages/TransferPackageCard';
import { listTransferPackagesWithCardData, deleteTransferPackage } from '@/lib/supabase/transfer-packages';

interface Package {
	id: string;
	title: string;
	type: string;
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';
	price: number;
	maxPrice?: number;
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
	const router = useRouter();
	const [packages, setPackages] = useState<Package[]>([]);
	const [transferPackages, setTransferPackages] = useState<TransferPackageCardData[]>([]);
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

		// Fetch ALL package types: activity, transfer (with full card data), and multi-city
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
			// Transfer packages with full card data (vehicles, images, pricing)
			listTransferPackagesWithCardData({ operator_id: user.id }),
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
			toast.error('Failed to load transfer packages');
		}
		
		if (multiCityResult.error) {
			console.error('Error fetching multi-city packages:', multiCityResult.error);
		}

		// Transform activity packages
		const activityPackages: Package[] = await Promise.all(
			(activityResult.data || []).map(async (pkg: any) => {
				const coverImage = pkg.activity_package_images?.find((img: any) => img.is_cover);
				const imageUrl = coverImage?.public_url || pkg.activity_package_images?.[0]?.public_url || '';

				// Map database status to display status
				let displayStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'DRAFT';
				if (pkg.status === 'published') {
					displayStatus = 'PUBLISHED';
				} else if (pkg.status === 'draft') {
					displayStatus = 'DRAFT';
				} else if (pkg.status === 'archived' || pkg.status === 'suspended') {
					displayStatus = 'ARCHIVED';
				}

				// Fetch pricing options to calculate min/max price
				const { data: pricingOptions } = await supabase
					.from('activity_pricing_packages')
					.select('adult_price')
					.eq('activity_package_id', pkg.id);

				let minPrice = pkg.base_price || 0;
				let maxPrice = pkg.base_price || 0;

				if (pricingOptions && pricingOptions.length > 0) {
					const prices = pricingOptions.map(opt => opt.adult_price).filter(p => p > 0);
					if (prices.length > 0) {
						minPrice = Math.min(...prices);
						maxPrice = Math.max(...prices);
					}
				}

				return {
					id: pkg.id,
					title: pkg.title,
					type: 'Activity',
					status: displayStatus,
					price: minPrice,
					maxPrice: maxPrice,
					rating: 0,
					reviews: 0,
					bookings: 0,
					views: 0,
					image: imageUrl,
					createdAt: new Date(pkg.created_at),
				};
			})
		);

		// Store transfer packages with full data for TransferPackageCard
		const transferPackagesWithCardData = transferResult.data || [];
		setTransferPackages(transferPackagesWithCardData);

		// Transform multi-city packages
		const multiCityPackages: Package[] = (multiCityResult.data || []).map((pkg: any) => {
			const coverImage = pkg.multi_city_package_images?.find((img: any) => img.is_cover);
			const imageUrl = coverImage?.public_url || pkg.multi_city_package_images?.[0]?.public_url || '';

			// Map database status to display status
			let displayStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'DRAFT';
			if (pkg.status === 'published') {
				displayStatus = 'PUBLISHED';
			} else if (pkg.status === 'draft') {
				displayStatus = 'DRAFT';
			} else if (pkg.status === 'archived' || pkg.status === 'suspended') {
				displayStatus = 'ARCHIVED';
			}

			return {
				id: pkg.id,
				title: pkg.title,
				type: 'Multi-City',
				status: displayStatus,
				price: pkg.base_price || 0,
				rating: 0,
				reviews: 0,
				bookings: 0,
				views: 0,
				image: imageUrl,
				createdAt: new Date(pkg.created_at),
			};
		});

		// Store packages separately by type for organized display
		const allPackages = [...activityPackages, ...multiCityPackages]
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			setPackages(allPackages);

			// Update stats (including transfer packages in count)
			const activeCount = allPackages.filter(p => p.status === 'PUBLISHED').length + 
				transferPackagesWithCardData.filter(p => p.status === 'published').length;
			const totalRevenue = allPackages.reduce((sum, p) => sum + (p.bookings * p.price), 0);
			
			setStats({
				total: allPackages.length + transferPackagesWithCardData.length,
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

	// Separate packages by type for organized display
	const filteredActivityPackages = useMemo(() => {
		return packages
			.filter(p => p.type === 'Activity')
			.filter(p => {
				if (statusFilter === 'ALL') return true;
				const pkgStatus = p.status?.toUpperCase();
				if (statusFilter === 'PUBLISHED') return pkgStatus === 'PUBLISHED';
				return pkgStatus === statusFilter;
			})
			.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [packages, statusFilter, searchQuery]);

	const filteredMultiCityPackages = useMemo(() => {
		return packages
			.filter(p => p.type === 'Multi-City')
			.filter(p => {
				if (statusFilter === 'ALL') return true;
				const pkgStatus = p.status?.toUpperCase();
				if (statusFilter === 'PUBLISHED') return pkgStatus === 'PUBLISHED';
				return pkgStatus === statusFilter;
			})
			.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [packages, statusFilter, searchQuery]);

	const filteredOtherPackages = useMemo(() => {
		return packages
			.filter(p => p.type !== 'Activity' && p.type !== 'Multi-City')
			.filter(p => {
				if (statusFilter === 'ALL') return true;
				const pkgStatus = p.status?.toUpperCase();
				if (statusFilter === 'PUBLISHED') return pkgStatus === 'PUBLISHED';
				return pkgStatus === statusFilter;
			})
			.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [packages, statusFilter, searchQuery]);

	const getStatusColor = (status: string) => {
		const upperStatus = status?.toUpperCase();
		switch (upperStatus) {
			case 'PUBLISHED':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'DRAFT':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
				return 'Published';
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

	const handleViewPackage = (pkg: Package) => {
		// Navigate to view/edit page based on package type
		const viewPath = pkg.type === 'Activity' 
			? `/operator/packages/create/activity?id=${pkg.id}&view=true`
			: pkg.type === 'Transfer'
			? `/operator/packages/create/transfer?id=${pkg.id}&view=true`
			: pkg.type === 'Multi-City'
			? `/operator/packages/create/multi-city?id=${pkg.id}&view=true`
			: `/operator/packages/create?id=${pkg.id}&view=true`;
		router.push(viewPath);
	};

	const handleEditPackage = (pkg: Package) => {
		// Navigate to edit page based on package type
		const editPath = pkg.type === 'Activity' 
			? `/operator/packages/create/activity?id=${pkg.id}`
			: pkg.type === 'Transfer'
			? `/operator/packages/create/transfer?id=${pkg.id}`
			: pkg.type === 'Multi-City'
			? `/operator/packages/create/multi-city?id=${pkg.id}`
			: `/operator/packages/create?id=${pkg.id}`;
		router.push(editPath);
	};

	const handleDuplicatePackage = async (pkg: Package) => {
		try {
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				toast.error('Please log in to duplicate packages');
				return;
			}

			toast.info('Duplicating package...');

			// Determine the table name based on package type
			const tableName = pkg.type === 'Activity' 
				? 'activity_packages'
				: pkg.type === 'Transfer'
				? 'transfer_packages'
				: pkg.type === 'Multi-City'
				? 'multi_city_packages'
				: null;

			if (!tableName) {
				toast.error('Unknown package type');
				return;
			}

			// Fetch the original package data
			const { data: originalPackage, error: fetchError } = await supabase
				.from(tableName)
				.select('*')
				.eq('id', pkg.id)
				.single();

			if (fetchError || !originalPackage) {
				console.error('Error fetching package:', fetchError);
				toast.error('Failed to duplicate package');
				return;
			}

			// Create a copy with new title and reset certain fields
			const { id, created_at, updated_at, published_at, ...packageData } = originalPackage;
			const duplicatedPackage = {
				...packageData,
				title: `${originalPackage.title} (Copy)`,
				status: 'draft' as const,
				operator_id: user.id,
			};

			// Insert the duplicated package
			const { data: newPackage, error: insertError } = await supabase
				.from(tableName)
				.insert(duplicatedPackage)
				.select()
				.single();

			if (insertError || !newPackage) {
				console.error('Error duplicating package:', insertError);
				toast.error('Failed to duplicate package');
				return;
			}

			// Copy images if they exist
			const imageTableName = pkg.type === 'Activity'
				? 'activity_package_images'
				: pkg.type === 'Transfer'
				? 'transfer_package_images'
				: pkg.type === 'Multi-City'
				? 'multi_city_package_images'
				: null;

			if (imageTableName) {
				// All image tables use 'package_id' as the foreign key column
				const { data: images } = await supabase
					.from(imageTableName)
					.select('*')
					.eq('package_id', pkg.id);

				if (images && images.length > 0) {
					const copiedImages = images.map(({ id, created_at, updated_at, uploaded_at, ...imgData }: any) => ({
						...imgData,
						package_id: newPackage.id,
					}));

					await supabase.from(imageTableName).insert(copiedImages);
				}
			}

			toast.success('Package duplicated successfully');
			
			// Refresh the packages list
			const fetchPackages = async () => {
				const supabase = createClient();
				const { data: { user } } = await supabase.auth.getUser();
				
				if (!user) return;

				const [activityResult, transferResult, multiCityResult] = await Promise.all([
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

				const allPackages = [...activityPackages, ...transferPackages, ...multiCityPackages]
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

				setPackages(allPackages);

				const activeCount = allPackages.filter(p => p.status === 'PUBLISHED' || p.status === 'ACTIVE').length;
				const totalRevenue = allPackages.reduce((sum, p) => sum + (p.bookings * p.price), 0);
				
				setStats({
					total: allPackages.length,
					active: activeCount,
					revenue: totalRevenue,
					avgRating: 4.8,
				});
			};

			await fetchPackages();

		} catch (error) {
			console.error('Error duplicating package:', error);
			toast.error('Failed to duplicate package');
		}
	};

	const handleDeletePackage = async (pkg: Package) => {
		if (!confirm(`Are you sure you want to delete "${pkg.title}"? This action cannot be undone.`)) {
			return;
		}

		try {
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				toast.error('Please log in to delete packages');
				return;
			}

			toast.info('Deleting package...');

			// Determine the table name based on package type
			const tableName = pkg.type === 'Activity' 
				? 'activity_packages'
				: pkg.type === 'Transfer'
				? 'transfer_packages'
				: pkg.type === 'Multi-City'
				? 'multi_city_packages'
				: null;

			if (!tableName) {
				toast.error('Unknown package type');
				return;
			}

			// Delete the package (images will be cascade deleted if foreign keys are set up)
			const { error: deleteError } = await supabase
				.from(tableName)
				.delete()
				.eq('id', pkg.id)
				.eq('operator_id', user.id); // Ensure user owns the package

			if (deleteError) {
				console.error('Error deleting package:', deleteError);
				toast.error('Failed to delete package');
				return;
			}

			toast.success('Package deleted successfully');
			
			// Remove from local state
			setPackages(prev => prev.filter(p => p.id !== pkg.id));
			
			// Update stats
			setStats(prev => ({
				...prev,
				total: prev.total - 1,
				active: pkg.status === 'PUBLISHED' || pkg.status === 'ACTIVE' ? prev.active - 1 : prev.active,
			}));

		} catch (error) {
			console.error('Error deleting package:', error);
			toast.error('Failed to delete package');
		}
	};

	// Transfer Package-specific handlers
	const handleViewTransferPackage = (pkg: TransferPackageCardData) => {
		router.push(`/operator/packages/create/transfer?id=${pkg.id}&view=true`);
	};

	const handleEditTransferPackage = (pkg: TransferPackageCardData) => {
		router.push(`/operator/packages/create/transfer?id=${pkg.id}`);
	};

	const handleDuplicateTransferPackage = async (pkg: TransferPackageCardData) => {
		toast.info('Duplicate feature coming soon!');
		// TODO: Implement transfer package duplication
	};

	const handleDeleteTransferPackage = async (pkg: TransferPackageCardData) => {
		if (!confirm(`Are you sure you want to delete "${pkg.title}"? This action cannot be undone.`)) {
			return;
		}

		try {
			toast.info('Deleting transfer package...');
			
			const { error } = await deleteTransferPackage(pkg.id);
			
			if (error) {
				console.error('Error deleting transfer package:', error);
				toast.error('Failed to delete transfer package');
				return;
			}

			toast.success('Transfer package deleted successfully');
			
			// Remove from local state
			setTransferPackages(prev => prev.filter(p => p.id !== pkg.id));
			
			// Update stats
			setStats(prev => ({
				...prev,
				total: prev.total - 1,
				active: pkg.status === 'published' ? prev.active - 1 : prev.active,
			}));

		} catch (error) {
			console.error('Error deleting transfer package:', error);
			toast.error('Failed to delete transfer package');
		}
	};

	// Filter transfer packages
	const filteredTransferPackages = useMemo(() => {
		return transferPackages.filter(pkg => {
			// Status filter
			if (statusFilter === 'ALL') return true;
			const pkgStatus = pkg.status?.toUpperCase();
			if (statusFilter === 'ACTIVE') return pkgStatus === 'PUBLISHED';
			return pkgStatus === statusFilter;
		}).filter(pkg => {
			// Search filter
			return !searchQuery || pkg.title.toLowerCase().includes(searchQuery.toLowerCase());
		});
	}, [transferPackages, statusFilter, searchQuery]);

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
									<p className="text-xs font-medium text-slate-600 mb-1">Published Packages</p>
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
							<option value="PUBLISHED">Published</option>
							<option value="DRAFT">Draft</option>
							<option value="ARCHIVED">Archived</option>
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
		{!loading && packages.length > 0 && 
		 filteredTransferPackages.length === 0 && 
		 filteredActivityPackages.length === 0 && 
		 filteredMultiCityPackages.length === 0 && 
		 filteredOtherPackages.length === 0 && (
			<div className="text-center py-12">
				<SearchIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
				<h3 className="text-xl font-semibold text-slate-900 mb-2">No packages found</h3>
				<p className="text-sm text-slate-600 mb-6">Try adjusting your search or filters</p>
				<Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>
					Clear Filters
				</Button>
			</div>
		)}

			{/* Transfer Packages Section with New Card */}
			{!loading && filteredTransferPackages.length > 0 && (
				<div className="mb-8">
					<h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
						<FaCar className="h-5 w-5 text-[#FF6B35]" />
						Transfer Packages ({filteredTransferPackages.length})
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredTransferPackages.map((pkg) => (
							<TransferPackageCard
								key={pkg.id}
								package={pkg}
								onView={handleViewTransferPackage}
								onEdit={handleEditTransferPackage}
								onDuplicate={handleDuplicateTransferPackage}
								onDelete={handleDeleteTransferPackage}
							/>
						))}
					</div>
				</div>
			)}

		{/* Activity Packages Section */}
		{!loading && filteredActivityPackages.length > 0 && (
			<div className="mb-8">
				<h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
					<PackageIcon className="h-5 w-5 text-[#FF6B35]" />
					Activity Packages ({filteredActivityPackages.length})
				</h2>
				<div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
					{filteredActivityPackages.map((pkg) => (
						<motion.div
							key={pkg.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all overflow-hidden">
								{/* Package Image */}
								<div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200">
									{pkg.image ? (
										<Image 
											src={pkg.image} 
											alt={pkg.title}
											fill
											className="object-cover"
											onError={(e) => {
												// Hide the image and show placeholder instead
												e.currentTarget.style.display = 'none';
												const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder') as HTMLElement;
												if (placeholder) placeholder.style.display = 'flex';
											}}
										/>
									) : null}
									
									{/* Placeholder when no image */}
									<div 
										className={`image-placeholder absolute inset-0 flex flex-col items-center justify-center text-slate-400 ${pkg.image ? 'hidden' : 'flex'}`}
									>
										<PackageIcon className="w-12 h-12 mb-2 opacity-50" />
										<span className="text-sm font-medium">No Image</span>
									</div>
									
									<div className="absolute top-2 right-2">
										<Badge className={getStatusColor(pkg.status)}>
											{getStatusLabel(pkg.status)}
										</Badge>
									</div>
								</div>
								
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
										{pkg.maxPrice && pkg.maxPrice > pkg.price ? (
											<span className="text-sm">From ${pkg.price.toFixed(2)} - ${pkg.maxPrice.toFixed(2)}</span>
										) : (
											<span>${pkg.price.toFixed(2)}</span>
										)}
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
												<Button variant="ghost" size="sm" className="hover:bg-slate-100">
													<MoreVertical className="w-4 h-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg">
												<DropdownMenuItem 
													className="cursor-pointer hover:bg-slate-50 text-slate-700"
													onClick={() => handleViewPackage(pkg)}
												>
													<Eye className="w-4 h-4 mr-2" />
													View
												</DropdownMenuItem>
												<DropdownMenuItem 
													className="cursor-pointer hover:bg-slate-50 text-slate-700"
													onClick={() => handleEditPackage(pkg)}
												>
													<Edit className="w-4 h-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem 
													className="cursor-pointer hover:bg-slate-50 text-slate-700"
													onClick={() => handleDuplicatePackage(pkg)}
												>
													<Copy className="w-4 h-4 mr-2" />
													Duplicate
												</DropdownMenuItem>
												<DropdownMenuItem 
													className="cursor-pointer hover:bg-red-50 text-red-600"
													onClick={() => handleDeletePackage(pkg)}
												>
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
				</div>
			)}

		{/* Multi-City Packages Section */}
		{!loading && filteredMultiCityPackages.length > 0 && (
			<div className="mb-8">
				<h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
					<PackageIcon className="h-5 w-5 text-[#FF6B35]" />
					Multi-City Packages ({filteredMultiCityPackages.length})
				</h2>
				<div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
					{filteredMultiCityPackages.map((pkg) => (
					<motion.div
						key={pkg.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all overflow-hidden">
							{/* Package Image */}
							<div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200">
								{pkg.image ? (
									<Image 
										src={pkg.image} 
										alt={pkg.title}
										fill
										className="object-cover"
										onError={(e) => {
											// Hide the image and show placeholder instead
											e.currentTarget.style.display = 'none';
											const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder') as HTMLElement;
											if (placeholder) placeholder.style.display = 'flex';
										}}
									/>
								) : null}
								
								{/* Placeholder when no image */}
								<div 
									className={`image-placeholder absolute inset-0 flex flex-col items-center justify-center text-slate-400 ${pkg.image ? 'hidden' : 'flex'}`}
								>
									<PackageIcon className="w-12 h-12 mb-2 opacity-50" />
									<span className="text-sm font-medium">No Image</span>
								</div>
								
								<div className="absolute top-2 right-2">
									<Badge className={getStatusColor(pkg.status)}>
										{getStatusLabel(pkg.status)}
									</Badge>
								</div>
							</div>
							
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
									{pkg.maxPrice && pkg.maxPrice > pkg.price ? (
										<span className="text-sm">From ${pkg.price.toFixed(2)} - ${pkg.maxPrice.toFixed(2)}</span>
									) : (
										<span>${pkg.price.toFixed(2)}</span>
									)}
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
											<Button variant="ghost" size="sm" className="hover:bg-slate-100">
												<MoreVertical className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg">
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-slate-50 text-slate-700"
												onClick={() => handleViewPackage(pkg)}
											>
												<Eye className="w-4 h-4 mr-2" />
												View
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-slate-50 text-slate-700"
												onClick={() => handleEditPackage(pkg)}
											>
												<Edit className="w-4 h-4 mr-2" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-slate-50 text-slate-700"
												onClick={() => handleDuplicatePackage(pkg)}
											>
												<Copy className="w-4 h-4 mr-2" />
												Duplicate
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-red-50 text-red-600"
												onClick={() => handleDeletePackage(pkg)}
											>
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
			</div>
		)}

		{/* Other Package Types Section (for future package types) */}
		{!loading && filteredOtherPackages.length > 0 && (
			<div className="mb-8">
				<h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
					<PackageIcon className="h-5 w-5 text-[#FF6B35]" />
					Other Packages ({filteredOtherPackages.length})
				</h2>
				<div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
					{filteredOtherPackages.map((pkg) => (
					<motion.div
						key={pkg.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all overflow-hidden">
							{/* Package Image */}
							<div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200">
								{pkg.image ? (
									<Image 
										src={pkg.image} 
										alt={pkg.title}
										fill
										className="object-cover"
										onError={(e) => {
											// Hide the image and show placeholder instead
											e.currentTarget.style.display = 'none';
											const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder') as HTMLElement;
											if (placeholder) placeholder.style.display = 'flex';
										}}
									/>
								) : null}
								
								{/* Placeholder when no image */}
								<div 
									className={`image-placeholder absolute inset-0 flex flex-col items-center justify-center text-slate-400 ${pkg.image ? 'hidden' : 'flex'}`}
								>
									<PackageIcon className="w-12 h-12 mb-2 opacity-50" />
									<span className="text-sm font-medium">No Image</span>
								</div>
								
								<div className="absolute top-2 right-2">
									<Badge className={getStatusColor(pkg.status)}>
										{getStatusLabel(pkg.status)}
									</Badge>
								</div>
							</div>
							
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
									{pkg.maxPrice && pkg.maxPrice > pkg.price ? (
										<span className="text-sm">From ${pkg.price.toFixed(2)} - ${pkg.maxPrice.toFixed(2)}</span>
									) : (
										<span>${pkg.price.toFixed(2)}</span>
									)}
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
											<Button variant="ghost" size="sm" className="hover:bg-slate-100">
												<MoreVertical className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg">
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-slate-50 text-slate-700"
												onClick={() => handleViewPackage(pkg)}
											>
												<Eye className="w-4 h-4 mr-2" />
												View
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-slate-50 text-slate-700"
												onClick={() => handleEditPackage(pkg)}
											>
												<Edit className="w-4 h-4 mr-2" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-slate-50 text-slate-700"
												onClick={() => handleDuplicatePackage(pkg)}
											>
												<Copy className="w-4 h-4 mr-2" />
												Duplicate
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="cursor-pointer hover:bg-red-50 text-red-600"
												onClick={() => handleDeletePackage(pkg)}
											>
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
			</div>
		)}
		</div>
	);
}
