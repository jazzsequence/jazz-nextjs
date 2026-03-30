import { useState } from 'react';
import type { Meta } from '@storybook/nextjs-vite';
import SearchBar from '@/components/SearchBar';

/**
 * SearchBar — controlled collapsible search field used in the desktop Navigation.
 *
 * The component is controlled (isOpen/onOpen/onClose props) so that Navigation
 * can animate nav items out when search opens. Stories use a stateful wrapper
 * decorator to simulate the controlled behaviour interactively.
 *
 * WCAG 2.1 AA: role="search", aria-expanded, focus management, Escape to close.
 */

/** Stateful wrapper so Storybook can drive the controlled component interactively. */
function SearchBarWrapper(props: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(props.defaultOpen ?? false);
  return (
    <div className="flex items-center bg-brand-header px-4 py-2 rounded-lg min-w-72">
      <SearchBar
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Components/SearchBar',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

/** Default collapsed state — shows only the magnifying-glass button. */
export const Collapsed = {
  name: 'Collapsed (default)',
  render: () => <SearchBarWrapper />,
};

/** Expanded state — shows the input field. Click X or press Escape to close. */
export const Expanded = {
  render: () => <SearchBarWrapper defaultOpen />,
};
