import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navigation from '@/components/Navigation';
import type { WPMenuItem } from '@/lib/wordpress/types';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    target,
    rel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
  }) => (
    <a href={href} className={className} target={target} rel={rel}>
      {children}
    </a>
  ),
}));

describe('Navigation', () => {
  const mockMenuItems: WPMenuItem[] = [
    {
      id: 1,
      title: { rendered: 'Home' },
      url: 'https://example.com',
      attr_title: '',
      description: '',
      type: 'custom',
      type_label: 'Custom Link',
      object: 'custom',
      object_id: 0,
      parent: 0,
      menu_order: 1,
      target: '',
      classes: [],
      xfn: [],
      invalid: false,
      meta: {},
      menus: 1,
    },
    {
      id: 2,
      title: { rendered: 'About' },
      url: 'https://example.com/about',
      attr_title: '',
      description: '',
      type: 'post_type',
      type_label: 'Page',
      object: 'page',
      object_id: 10,
      parent: 0,
      menu_order: 2,
      target: '',
      classes: [],
      xfn: [],
      invalid: false,
      meta: {},
      menus: 1,
    },
    {
      id: 3,
      title: { rendered: 'Blog' },
      url: 'https://example.com/blog',
      attr_title: '',
      description: '',
      type: 'post_type',
      type_label: 'Page',
      object: 'page',
      object_id: 20,
      parent: 0,
      menu_order: 3,
      target: '',
      classes: [],
      xfn: [],
      invalid: false,
      meta: {},
      menus: 1,
    },
  ];

  const mockNestedMenuItems: WPMenuItem[] = [
    {
      id: 1,
      title: { rendered: 'Home' },
      url: 'https://example.com',
      attr_title: '',
      description: '',
      type: 'custom',
      type_label: 'Custom Link',
      object: 'custom',
      object_id: 0,
      parent: 0,
      menu_order: 1,
      target: '',
      classes: [],
      xfn: [],
      invalid: false,
      meta: {},
      menus: 1,
    },
    {
      id: 2,
      title: { rendered: 'Parent Menu' },
      url: 'https://example.com/parent',
      attr_title: '',
      description: '',
      type: 'post_type',
      type_label: 'Page',
      object: 'page',
      object_id: 10,
      parent: 0,
      menu_order: 2,
      target: '',
      classes: [],
      xfn: [],
      invalid: false,
      meta: {},
      menus: 1,
    },
    {
      id: 3,
      title: { rendered: 'Child Menu Item' },
      url: 'https://example.com/parent/child',
      attr_title: '',
      description: '',
      type: 'post_type',
      type_label: 'Page',
      object: 'page',
      object_id: 11,
      parent: 2, // Parent is menu item #2
      menu_order: 3,
      target: '',
      classes: [],
      xfn: [],
      invalid: false,
      meta: {},
      menus: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with menu data provided', () => {
    it('should render menu items from menuItems prop', () => {
      render(<Navigation menuItems={mockMenuItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });

    it('should render links with correct href', () => {
      render(<Navigation menuItems={mockMenuItems} />);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      const aboutLink = screen.getByRole('link', { name: 'About' });

      expect(homeLink).toHaveAttribute('href', 'https://example.com');
      expect(aboutLink).toHaveAttribute('href', 'https://example.com/about');
    });

    it('should render menu items in correct order', () => {
      render(<Navigation menuItems={mockMenuItems} />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveTextContent('Home');
      expect(links[1]).toHaveTextContent('About');
      expect(links[2]).toHaveTextContent('Blog');
    });
  });

  describe('nested menu items', () => {
    it('should render parent menu items', () => {
      render(<Navigation menuItems={mockNestedMenuItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Parent Menu')).toBeInTheDocument();
    });

    it('should render child menu items under parent', () => {
      render(<Navigation menuItems={mockNestedMenuItems} />);

      expect(screen.getByText('Child Menu Item')).toBeInTheDocument();
    });

    it('should nest child items under parent', () => {
      const { container } = render(<Navigation menuItems={mockNestedMenuItems} />);

      // Find the parent list item
      const parentItem = container.querySelector('[data-menu-id="2"]');
      expect(parentItem).toBeInTheDocument();

      // Parent should have a nested list
      const nestedList = parentItem?.querySelector('ul');
      expect(nestedList).toBeInTheDocument();

      // Child item should be in the nested list
      const childItem = nestedList?.querySelector('[data-menu-id="3"]');
      expect(childItem).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should display loading state when isLoading is true', () => {
      render(<Navigation isLoading={true} />);

      expect(screen.getByText('Loading menu...')).toBeInTheDocument();
    });

    it('should not display menu items when loading', () => {
      render(<Navigation menuItems={mockMenuItems} isLoading={true} />);

      expect(screen.getByText('Loading menu...')).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when error prop is provided', () => {
      render(<Navigation error="Failed to load menu" />);

      expect(screen.getByText(/Failed to load menu/i)).toBeInTheDocument();
    });

    it('should not display menu items when error exists', () => {
      render(<Navigation menuItems={mockMenuItems} error="Failed to load menu" />);

      expect(screen.getByText(/Failed to load menu/i)).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('HTML entity decoding', () => {
    it('decodes numeric HTML entities in menu item titles', () => {
      const itemsWithEntities: WPMenuItem[] = [
        {
          id: 10,
          title: { rendered: 'TTRPG Social Contract &#038; Safety Tools' },
          url: 'https://example.com/ttrpg',
          attr_title: '', description: '', type: 'custom', type_label: 'Custom Link',
          object: 'custom', object_id: 0, parent: 0, menu_order: 1, target: '', classes: [],
        },
      ]
      render(<Navigation menuItems={itemsWithEntities} />)
      expect(screen.getByText('TTRPG Social Contract & Safety Tools')).toBeTruthy()
      expect(screen.queryByText('TTRPG Social Contract &#038; Safety Tools')).toBeNull()
    })

    it('decodes &amp; named entities in menu item titles', () => {
      const itemsWithEntities: WPMenuItem[] = [
        {
          id: 11,
          title: { rendered: 'D&amp;D Battle Tracker' },
          url: 'https://example.com/dnd',
          attr_title: '', description: '', type: 'custom', type_label: 'Custom Link',
          object: 'custom', object_id: 0, parent: 0, menu_order: 2, target: '', classes: [],
        },
      ]
      render(<Navigation menuItems={itemsWithEntities} />)
      expect(screen.getByText('D&D Battle Tracker')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('should handle empty menu items array', () => {
      render(<Navigation menuItems={[]} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should display default message when no menu items provided', () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply default Tailwind classes', () => {
      const { container } = render(<Navigation menuItems={mockMenuItems} />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('bg-white', 'shadow-md');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Navigation menuItems={mockMenuItems} className="custom-nav" />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('custom-nav');
    });

    it('should apply z-50 to dropdown menus to appear above content', () => {
      const { container } = render(<Navigation menuItems={mockNestedMenuItems} />);

      // Find the parent menu item with children
      const parentItem = container.querySelector('[data-menu-id="2"]');
      expect(parentItem).toBeInTheDocument();

      // Find the dropdown submenu
      const dropdown = parentItem?.querySelector('ul');
      expect(dropdown).toBeInTheDocument();

      // Verify z-50 class is applied for stacking context
      expect(dropdown).toHaveClass('z-50');
    });
  });

  describe('menu item target attribute', () => {
    it('should render links with target="_blank" when specified', () => {
      const itemsWithTarget: WPMenuItem[] = [
        {
          ...mockMenuItems[0],
          target: '_blank',
        },
      ];

      render(<Navigation menuItems={itemsWithTarget} />);

      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not add target or rel attributes when target is empty', () => {
      render(<Navigation menuItems={mockMenuItems} />);

      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
    });
  });

  describe('URL transformation', () => {
    it('should transform jazzsequence.com URLs to local paths', () => {
      const itemsWithJazzUrls: WPMenuItem[] = [
        {
          ...mockMenuItems[0],
          url: 'https://jazzsequence.com/music/',
          title: { rendered: 'Music' },
        },
        {
          ...mockMenuItems[1],
          url: 'https://jazzsequence.com',
          title: { rendered: 'Home' },
        },
      ];

      render(<Navigation menuItems={itemsWithJazzUrls} />);

      const musicLink = screen.getByRole('link', { name: 'Music' });
      const homeLink = screen.getByRole('link', { name: 'Home' });

      expect(musicLink).toHaveAttribute('href', '/music/');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should keep external URLs unchanged', () => {
      const itemsWithExternalUrls: WPMenuItem[] = [
        {
          ...mockMenuItems[0],
          url: 'https://github.com/jazzsequence',
          title: { rendered: 'GitHub' },
        },
      ];

      render(<Navigation menuItems={itemsWithExternalUrls} />);

      const link = screen.getByRole('link', { name: 'GitHub' });
      expect(link).toHaveAttribute('href', 'https://github.com/jazzsequence');
    });

    it('should keep relative URLs unchanged', () => {
      const itemsWithRelativeUrls: WPMenuItem[] = [
        {
          ...mockMenuItems[0],
          url: '/about/',
          title: { rendered: 'About' },
        },
      ];

      render(<Navigation menuItems={itemsWithRelativeUrls} />);

      const link = screen.getByRole('link', { name: 'About' });
      expect(link).toHaveAttribute('href', '/about/');
    });
  });
});
