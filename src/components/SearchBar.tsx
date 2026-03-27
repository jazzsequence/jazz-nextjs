'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * Accessible collapsible search bar.
 *
 * Collapsed: icon-only trigger button.
 * Expanded:  icon stays as prefix, input expands right via framer-motion width animation.
 *
 * WCAG 2.1 AA requirements satisfied:
 *   - role="search" on the <form>
 *   - trigger: aria-label="Search", aria-expanded, aria-controls="search-input"
 *   - input:   id="search-input", aria-label="Search query", type="search"
 *   - Escape collapses and returns focus to trigger
 *   - Blur collapses only when input is empty (allows submit click)
 */
export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Move focus to input whenever the bar expands
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    // Return focus to the trigger button
    triggerRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        close();
      }
    },
    [close]
  );

  const handleBlur = useCallback(() => {
    // Only collapse if the input is empty — if the user has typed something
    // they may be clicking the submit button, so keep it open.
    if (!query.trim()) {
      close();
    }
  }, [query, close]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const term = query.trim();
      if (!term) return;
      router.push(`/search?q=${encodeURIComponent(term).replace(/%20/g, '+')}&type=all`);
      close();
    },
    [query, router, close]
  );

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center"
    >
      {/* Trigger button — always visible */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="Search"
        aria-expanded={isOpen}
        aria-controls="search-input"
        onClick={open}
        className="flex items-center justify-center w-8 h-8 text-brand-text-sub hover:text-brand-cyan transition-colors rounded focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:outline-none"
      >
        <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden="true" />
      </button>

      {/* Animated input container — expands to the right */}
      <motion.div
        animate={{ width: isOpen ? 240 : 0 }}
        initial={{ width: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
        className="flex items-center"
      >
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          aria-label="Search query"
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Search…"
          className="w-full bg-transparent border-b border-brand-border text-brand-text-sub placeholder-brand-muted text-sm px-2 py-1 focus-visible:outline-none focus-visible:border-brand-cyan transition-colors"
        />
      </motion.div>
    </form>
  );
}
