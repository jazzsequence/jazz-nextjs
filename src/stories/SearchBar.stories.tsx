import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SearchBar from '@/components/SearchBar';

/**
 * SearchBar — accessible collapsible search field in the navigation bar.
 *
 * Collapsed: magnifying-glass icon-only trigger.
 * Expanded:  input expands to the right using a framer-motion width animation.
 *
 * WCAG 2.1 AA: role="search" on form, aria-expanded on trigger, focus management
 * on open/close, Escape to collapse, blur-to-collapse when empty.
 */
const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    nextjs: {
      appDirectory: true,
      navigation: {
        push: () => {},
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-end bg-brand-header px-4 py-2 rounded-lg min-w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

/** Default collapsed state — shows only the magnifying-glass button. */
export const Default: Story = {
  name: 'Collapsed (default)',
};

/**
 * Expanded state — click the magnifying-glass in the Canvas to see the
 * animation; this story documents the open appearance.
 *
 * To preview the expanded state statically, the story uses play() to
 * simulate a button click after mount.
 */
export const Expanded: Story = {
  name: 'Expanded',
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Search' });
    await userEvent.click(btn);
  },
};

/** Expanded with a pre-typed query — shows the filled input state. */
export const WithQuery: Story = {
  name: 'With query text',
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Search' });
    await userEvent.click(btn);
    const input = canvas.getByRole('searchbox');
    await userEvent.type(input, 'miles davis');
  },
};
