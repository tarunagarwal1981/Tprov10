'use client';

import React from 'react';
import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb Navigation Component
 * 
 * Displays navigation path with links
 * Example: Home > Benefits > Current Page
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 px-4">
      <ol className="flex items-center gap-2 max-w-6xl mx-auto text-sm">
        {/* Home Link */}
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FiHome className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <FiChevronRight className="w-4 h-4 text-gray-400" />
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-orange-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium" aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}



