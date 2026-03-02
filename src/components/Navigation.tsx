'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { WPMenuItem } from '@/lib/wordpress/types';

interface NavigationProps {
  menuItems?: WPMenuItem[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

/**
 * Organize menu items into a hierarchical structure
 * @param items - Flat array of menu items
 * @returns Hierarchical array with nested children
 */
function organizeMenuItems(items: WPMenuItem[]): WPMenuItem[] {
  const itemMap = new Map<number, WPMenuItem & { children?: WPMenuItem[] }>();
  const rootItems: (WPMenuItem & { children?: WPMenuItem[] })[] = [];

  // First pass: Create a map of all items
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: Build hierarchy
  items.forEach(item => {
    const menuItem = itemMap.get(item.id);
    if (!menuItem) return;

    if (item.parent === 0) {
      // Top-level item
      rootItems.push(menuItem);
    } else {
      // Child item - add to parent's children array
      const parent = itemMap.get(item.parent);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(menuItem);
      } else {
        // Parent not found, treat as root item
        rootItems.push(menuItem);
      }
    }
  });

  // Sort items by menu_order
  const sortByMenuOrder = (a: WPMenuItem, b: WPMenuItem) => a.menu_order - b.menu_order;
  rootItems.sort(sortByMenuOrder);
  rootItems.forEach(item => {
    if (item.children && item.children.length > 0) {
      item.children.sort(sortByMenuOrder);
    }
  });

  return rootItems;
}

/**
 * Render a menu item and its children recursively
 */
function MenuItem({ item, isChild = false }: { item: WPMenuItem & { children?: WPMenuItem[] }; isChild?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const linkTarget = item.target || undefined;
  const linkRel = item.target === '_blank' ? 'noopener noreferrer' : undefined;

  return (
    <li
      data-menu-id={item.id}
      className={isChild ? 'ml-4' : 'relative group'}
      onMouseEnter={() => hasChildren && setIsOpen(true)}
      onMouseLeave={() => hasChildren && setIsOpen(false)}
    >
      <Link
        href={item.url}
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 hover:text-blue-600 transition-colors rounded"
        {...(linkTarget && { target: linkTarget })}
        {...(linkRel && { rel: linkRel })}
      >
        {item.title.rendered}
        {hasChildren && !isChild && (
          <svg
            className="inline-block w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </Link>
      {hasChildren && (
        <ul
          className={`${
            isChild
              ? 'mt-1'
              : `absolute left-0 top-full mt-1 bg-white shadow-lg rounded-md min-w-48 py-2 ${
                  isOpen ? 'block' : 'hidden'
                }`
          }`}
        >
          {item.children!.map(child => (
            <MenuItem key={child.id} item={child} isChild={true} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Navigation component that displays WordPress menu items
 *
 * Features:
 * - Hierarchical menu support (parent/child relationships)
 * - Loading and error states
 * - Responsive Tailwind styling
 * - Next.js Link integration
 * - External link support (target="_blank")
 *
 * @param menuItems - Array of WordPress menu items
 * @param isLoading - Loading state
 * @param error - Error message
 * @param className - Additional CSS classes
 */
export default function Navigation({
  menuItems = [],
  isLoading = false,
  error,
  className = '',
}: NavigationProps) {
  // Loading state
  if (isLoading) {
    return (
      <nav className={`bg-white shadow-md ${className}`} role="navigation">
        <div className="container mx-auto px-4 py-3">
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </nav>
    );
  }

  // Error state
  if (error) {
    return (
      <nav className={`bg-white shadow-md ${className}`} role="navigation">
        <div className="container mx-auto px-4 py-3">
          <p className="text-red-600">{error}</p>
        </div>
      </nav>
    );
  }

  // Organize menu items into hierarchy
  const organizedItems = organizeMenuItems(menuItems);

  return (
    <nav className={`bg-white shadow-md ${className}`} role="navigation">
      <div className="container mx-auto px-4">
        {organizedItems.length > 0 ? (
          <ul className="flex flex-col md:flex-row md:space-x-2 py-3">
            {organizedItems.map(item => (
              <MenuItem key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <div className="py-3">
            {/* Empty state - nav still renders but no items */}
          </div>
        )}
      </div>
    </nav>
  );
}
