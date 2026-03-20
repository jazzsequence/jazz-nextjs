'use client';

import { useState, useCallback } from 'react';
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

/** Desktop menu item with hover-dropdown for children. */
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
        className="no-underline block px-3 py-2 text-sm font-medium text-brand-text-sub hover:text-brand-cyan transition-colors rounded font-heading"
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

/** Mobile menu item — flat stacked list, children indented below parent. */
function MobileMenuItem({
  item,
  onClose,
}: {
  item: WPMenuItem & { children?: WPMenuItem[] };
  onClose: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const linkTarget = item.target || undefined;
  const linkRel = item.target === '_blank' ? 'noopener noreferrer' : undefined;
  const transformedUrl = transformMenuUrl(item.url);

  return (
    <>
      <li>
        <Link
          href={transformedUrl}
          onClick={onClose}
          className="no-underline block px-4 py-3 text-base font-medium text-brand-text-sub hover:text-brand-cyan hover:bg-brand-surface transition-colors font-heading"
          {...(linkTarget && { target: linkTarget })}
          {...(linkRel && { rel: linkRel })}
        >
          {decodeHtmlEntities(item.title.rendered)}
        </Link>
      </li>
      {hasChildren && item.children!.map(child => (
        <li key={child.id}>
          <Link
            href={transformMenuUrl(child.url)}
            onClick={onClose}
            className="no-underline block pl-8 pr-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-cyan hover:bg-brand-surface transition-colors font-heading"
            {...(child.target && { target: child.target })}
            {...(child.target === '_blank' && { rel: 'noopener noreferrer' })}
          >
            {decodeHtmlEntities(child.title.rendered)}
          </Link>
        </li>
      ))}
    </>
  );
}

export default function Navigation({
  menuItems = [],
  isLoading = false,
  error,
  className = '',
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const organizedItems = organizeMenuItems(menuItems);
  const closeMenu = useCallback(() => setIsOpen(false), []);

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

          {/* Desktop navigation — hidden on mobile */}
          <nav role="navigation" aria-label="Main navigation" className="hidden md:block">
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

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-10 h-10 text-brand-text-sub hover:text-brand-cyan transition-colors rounded"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen(prev => !prev)}
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {/* Mobile menu panel */}
      {isOpen && (
        <nav
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-brand-border bg-brand-header"
        >
          {isLoading && (
            <p className="px-4 py-3 text-brand-muted text-sm font-heading">Loading menu...</p>
          )}
          {error && (
            <p className="px-4 py-3 text-red-400 text-sm font-heading">{error}</p>
          )}
          {!isLoading && !error && organizedItems.length > 0 && (
            <ul className="py-2">
              {organizedItems.map(item => (
                <MobileMenuItem key={item.id} item={item} onClose={closeMenu} />
              ))}
            </ul>
          )}
        </nav>
      )}
    </header>
  );
}
