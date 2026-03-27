'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SearchBarProps {
  /** Controlled open state — owned by Navigation so it can animate nav items out. */
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Accessible desktop search bar — controlled by Navigation.
 *
 * When open: icon becomes X, input fills the nav area (nav items animate out separately).
 * When closed: icon-only button.
 *
 * WCAG 2.1 AA:
 *   - role="search" on <form>
 *   - aria-label / aria-expanded / aria-controls on trigger
 *   - focus moves to input on open; returns to trigger on close
 *   - Escape closes and restores focus
 */
export default function SearchBar({ isOpen, onOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    },
    [onClose]
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // If focus moved to another element within the header (e.g. the hamburger button
    // that appears while search is open), don't collapse — let that click fire normally.
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const header = e.currentTarget.closest('header');
    if (relatedTarget && header?.contains(relatedTarget)) {
      return;
    }
    if (!query.trim()) {
      onClose();
    }
  }, [query, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (!query.trim()) {
        e.preventDefault();
      }
    },
    [query]
  );

  return (
    <form
      role="search"
      method="get"
      action="/search"
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
      style={{
        flex: isOpen ? '1 1 0%' : '0 0 auto',
        // When opening: grow immediately. When closing: wait for input to fade out (0.15s) then shrink.
        transition: isOpen ? 'flex 0.2s ease-in-out' : 'flex 0.15s ease-in-out 0.15s',
      }}
    >
      {/* Magnifying glass — opens search; clicking again closes (if input is empty) */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="Search"
        aria-expanded={isOpen}
        aria-controls="search-input"
        onClick={isOpen && !query.trim() ? onClose : onOpen}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 text-brand-text-sub hover:text-brand-cyan transition-colors rounded focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:outline-none"
      >
        <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden="true" />
      </button>

      {/* Input — fades in when open, fills remaining nav width via flex-1 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="search-input-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex items-center"
          >
            <input type="hidden" name="type" value="all" />
            <input
              ref={inputRef}
              id="search-input"
              type="search"
              name="q"
              aria-label="Search query"
              autoComplete="off"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={(e) => handleBlur(e)}
              placeholder="Search…"
              className="w-full bg-transparent border-b border-brand-border text-brand-text-sub placeholder-brand-muted text-sm px-2 py-1 focus-visible:outline-none focus-visible:border-brand-cyan transition-colors"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
