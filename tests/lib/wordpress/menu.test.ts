import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { fetchMenus, fetchMenuItems } from '@/lib/wordpress/client';
import type { WPMenu, WPMenuItem } from '@/lib/wordpress/types';

describe('WordPress Menu API', () => {
  const API_BASE = 'https://jazzsequence.com/wp-json/wp/v2';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMenus', () => {
    it('should fetch all available menus', async () => {
      const mockMenus: WPMenu[] = [
        {
          id: 1,
          name: 'Primary Menu',
          slug: 'primary',
          description: 'Main navigation menu',
          count: 5,
          meta: {},
          locations: ['primary'],
        },
        {
          id: 2,
          name: 'Footer Menu',
          slug: 'footer',
          description: 'Footer navigation',
          count: 3,
          meta: {},
          locations: ['footer'],
        },
      ];

      server.use(
        http.get(`${API_BASE}/menus`, () => {
          return HttpResponse.json(mockMenus);
        })
      );

      const menus = await fetchMenus();

      expect(menus).toHaveLength(2);
      expect(menus[0].name).toBe('Primary Menu');
      expect(menus[1].slug).toBe('footer');
    });

    it('should handle authentication for protected menu endpoint', async () => {
      const mockMenus: WPMenu[] = [
        {
          id: 1,
          name: 'Primary Menu',
          slug: 'primary',
          description: '',
          count: 5,
          meta: {},
          locations: [],
        },
      ];

      server.use(
        http.get(`${API_BASE}/menus`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          if (!authHeader) {
            return HttpResponse.json(
              {
                code: 'rest_cannot_view',
                message: 'Sorry, you are not allowed to view menus.',
                data: { status: 401 },
              },
              { status: 401 }
            );
          }
          return HttpResponse.json(mockMenus);
        })
      );

      // Without auth, should throw
      await expect(fetchMenus()).rejects.toThrow();

      // With auth environment variables, should work
      // (This would be tested in integration tests with actual env vars)
    });

    it('should handle empty menu list', async () => {
      server.use(
        http.get(`${API_BASE}/menus`, () => {
          return HttpResponse.json([]);
        })
      );

      const menus = await fetchMenus();
      expect(menus).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get(`${API_BASE}/menus`, () => {
          return HttpResponse.json(
            {
              code: 'rest_error',
              message: 'Server error',
              data: { status: 500 },
            },
            { status: 500 }
          );
        })
      );

      await expect(fetchMenus()).rejects.toThrow();
    });
  });

  describe('fetchMenuItems', () => {
    it('should fetch menu items for a specific menu', async () => {
      const mockMenuItems: WPMenuItem[] = [
        {
          id: 1,
          title: { rendered: 'Home' },
          url: 'https://jazzsequence.com',
          attr_title: '',
          description: '',
          type: 'custom',
          type_label: 'Custom Link',
          object: 'custom',
          object_id: 1,
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
          url: 'https://jazzsequence.com/about',
          attr_title: '',
          description: '',
          type: 'post_type',
          type_label: 'Page',
          object: 'page',
          object_id: 42,
          parent: 0,
          menu_order: 2,
          target: '',
          classes: [],
          xfn: [],
          invalid: false,
          meta: {},
          menus: 1,
        },
      ];

      server.use(
        http.get(`${API_BASE}/menu-items`, ({ request }) => {
          const url = new URL(request.url);
          const menuId = url.searchParams.get('menus');

          if (menuId === '1') {
            return HttpResponse.json(mockMenuItems);
          }
          return HttpResponse.json([]);
        })
      );

      const items = await fetchMenuItems(1);

      expect(items).toHaveLength(2);
      expect(items[0].title.rendered).toBe('Home');
      expect(items[1].object).toBe('page');
    });

    it('should handle nested menu items (parent/child)', async () => {
      const mockMenuItems: WPMenuItem[] = [
        {
          id: 1,
          title: { rendered: 'Parent Item' },
          url: 'https://jazzsequence.com/parent',
          attr_title: '',
          description: '',
          type: 'custom',
          type_label: 'Custom Link',
          object: 'custom',
          object_id: 1,
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
          title: { rendered: 'Child Item' },
          url: 'https://jazzsequence.com/parent/child',
          attr_title: '',
          description: '',
          type: 'custom',
          type_label: 'Custom Link',
          object: 'custom',
          object_id: 2,
          parent: 1,
          menu_order: 1,
          target: '',
          classes: [],
          xfn: [],
          invalid: false,
          meta: {},
          menus: 1,
        },
      ];

      server.use(
        http.get(`${API_BASE}/menu-items`, () => {
          return HttpResponse.json(mockMenuItems);
        })
      );

      const items = await fetchMenuItems(1);

      expect(items[0].parent).toBe(0);
      expect(items[1].parent).toBe(1);
    });

    it('should handle empty menu items', async () => {
      server.use(
        http.get(`${API_BASE}/menu-items`, () => {
          return HttpResponse.json([]);
        })
      );

      const items = await fetchMenuItems(999);
      expect(items).toEqual([]);
    });

    it('should support ISR caching', async () => {
      const mockMenuItems: WPMenuItem[] = [
        {
          id: 1,
          title: { rendered: 'Home' },
          url: 'https://jazzsequence.com',
          attr_title: '',
          description: '',
          type: 'custom',
          type_label: 'Custom Link',
          object: 'custom',
          object_id: 1,
          parent: 0,
          menu_order: 1,
          target: '',
          classes: [],
          xfn: [],
          invalid: false,
          meta: {},
          menus: 1,
        },
      ];

      server.use(
        http.get(`${API_BASE}/menu-items`, () => {
          return HttpResponse.json(mockMenuItems);
        })
      );

      const items = await fetchMenuItems(1, {
        isr: { revalidate: 3600, tags: ['menu-1'] },
      });

      expect(items).toHaveLength(1);
    });
  });
});
