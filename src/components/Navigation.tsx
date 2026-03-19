'use client';

import Link from 'next/link';
import { transformMenuUrl } from '@/lib/url-transform';
import type { WPMenuItem } from '@/lib/wordpress/types';

interface NavigationProps {
  menuItems?: WPMenuItem[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

/** Decode HTML entities (e.g. &#038; → &) in menu item titles from the WordPress API. */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

function organizeMenuItems(items: WPMenuItem[]): WPMenuItem[] {
  const itemMap = new Map<number, WPMenuItem & { children?: WPMenuItem[] }>();
  const rootItems: (WPMenuItem & { children?: WPMenuItem[] })[] = [];

  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  items.forEach(item => {
    const menuItem = itemMap.get(item.id);
    if (!menuItem) return;

    if (item.parent === 0) {
      rootItems.push(menuItem);
    } else {
      const parent = itemMap.get(item.parent);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(menuItem);
      } else {
        rootItems.push(menuItem);
      }
    }
  });

  const sortByMenuOrder = (a: WPMenuItem, b: WPMenuItem) => a.menu_order - b.menu_order;
  rootItems.sort(sortByMenuOrder);
  rootItems.forEach(item => {
    if (item.children && item.children.length > 0) {
      item.children.sort(sortByMenuOrder);
    }
  });

  return rootItems;
}

function MenuItem({ item, isChild = false }: { item: WPMenuItem & { children?: WPMenuItem[] }; isChild?: boolean }) {
  const hasChildren = item.children && item.children.length > 0;
  const linkTarget = item.target || undefined;
  const linkRel = item.target === '_blank' ? 'noopener noreferrer' : undefined;
  const transformedUrl = transformMenuUrl(item.url);

  return (
    <li
      data-menu-id={item.id}
      className={isChild ? 'ml-4' : hasChildren ? 'relative group' : 'relative'}
    >
      <Link
        href={transformedUrl}
        className="block px-3 py-2 text-sm font-medium text-brand-text-sub hover:text-brand-cyan transition-colors rounded font-heading"
        {...(linkTarget && { target: linkTarget })}
        {...(linkRel && { rel: linkRel })}
      >
        {decodeHtmlEntities(item.title.rendered)}
        {hasChildren && !isChild && (
          <svg
            className="inline-block w-3.5 h-3.5 ml-1 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </Link>
      {hasChildren && (
        <ul
          className={`${
            isChild
              ? 'mt-1'
              : 'absolute left-0 top-full bg-brand-surface border border-brand-border shadow-lg rounded-md min-w-48 py-2 hidden group-hover:block z-50'
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

export default function Navigation({
  menuItems = [],
  isLoading = false,
  error,
  className = '',
}: NavigationProps) {
  const organizedItems = organizeMenuItems(menuItems);

  return (
    <header className={`sticky top-0 z-50 bg-brand-header border-b border-brand-border backdrop-blur-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Site title — Victor Mono */}
          <Link
            href="/"
            className="font-mono font-bold text-brand-cyan text-lg tracking-tight no-underline hover:opacity-80 transition-opacity"
          >
            jazzsequence
          </Link>

          {/* Navigation */}
          <nav role="navigation" aria-label="Main navigation">
            {isLoading && (
              <span className="text-brand-muted text-sm font-heading">Loading menu...</span>
            )}
            {error && (
              <span className="text-red-400 text-sm font-heading">{error}</span>
            )}
            {!isLoading && !error && organizedItems.length > 0 && (
              <ul className="flex items-center gap-1">
                {organizedItems.map(item => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </ul>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
