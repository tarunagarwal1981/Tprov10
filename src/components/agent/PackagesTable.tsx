"use client";

import React, { useState, useMemo } from 'react';
import { FiPackage, FiMapPin, FiCalendar, FiDollarSign, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PackageTableRow {
  id: string;
  title: string;
  cities: Array<{ name: string; nights: number }>;
  totalNights: number;
  price: number | null;
  currency: string;
  operatorName?: string;
  featuredImageUrl?: string;
  type: 'multi_city' | 'multi_city_hotel';
}

interface PackagesTableProps {
  packages: PackageTableRow[];
  onSelectPackage: (packageId: string, packageType: 'multi_city' | 'multi_city_hotel') => void;
  loading?: boolean;
  rowsPerPage?: number;
}

export const PackagesTable: React.FC<PackagesTableProps> = ({
  packages,
  onSelectPackage,
  loading = false,
  rowsPerPage = 20,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(packages.length / rowsPerPage);

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return packages.slice(startIndex, endIndex);
  }, [packages, currentPage, rowsPerPage]);

  const formatCities = (cities: Array<{ name: string; nights: number }>) => {
    if (!cities || cities.length === 0) return 'N/A';
    return cities.map(c => `${c.name} (${c.nights}N)`).join(' → ');
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null || price === undefined) return 'Contact for price';
    return `${currency || 'USD'} ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full p-6 mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <FiPackage className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-gray-600 font-medium">No packages found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your query criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Package Title</TableHead>
              <TableHead>Cities & Nights</TableHead>
              <TableHead className="w-[100px]">Total Nights</TableHead>
              <TableHead className="w-[150px]">Price</TableHead>
              <TableHead className="w-[120px]">Operator</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPackages.map((pkg) => (
              <TableRow key={pkg.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-colors">
                <TableCell>
                  {pkg.featuredImageUrl ? (
                    <img
                      src={pkg.featuredImageUrl}
                      alt={pkg.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <FiPackage className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{pkg.title}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    <span className="line-clamp-2">{formatCities(pkg.cities)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm flex items-center gap-1">
                    <FiCalendar className="w-4 h-4 text-gray-500" />
                    <span>{pkg.totalNights} nights</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                    <FiDollarSign className="w-4 h-4" />
                    <span>{formatPrice(pkg.price, pkg.currency)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-gray-500">
                    {pkg.operatorName || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {pkg.type === 'multi_city' ? 'Multi-City' : 'Multi-City Hotel'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => onSelectPackage(pkg.id, pkg.type)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <FiPlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, packages.length)} of {packages.length} packages
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-gray-300 hover:bg-blue-50 hover:border-blue-300"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 ${currentPage === page ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : 'border-gray-300 hover:bg-blue-50 hover:border-blue-300'}`}
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-gray-300 hover:bg-blue-50 hover:border-blue-300"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

