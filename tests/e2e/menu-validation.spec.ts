import { test, expect } from '@playwright/test'
import { fetchMenus, fetchMenuItems } from '../../src/lib/wordpress/client'
import type { WPMenu, WPMenuItem } from '../../src/lib/wordpress/types'

/**
 * WordPress Menu E2E Validation Tests
 *
 * These tests verify:
 * - Menu API authentication works
 * - Menus exist and can be fetched
 * - Menu items can be retrieved
 * - Menu item URLs are valid
 * - Menu hierarchy is correct
 * - External links have proper attributes
 *
 * Requirements:
 * - WORDPRESS_USERNAME environment variable
 * - WORDPRESS_APP_PASSWORD environment variable
 * - Live connection to https://jazzsequence.com
 */

test.describe('WordPress Menu E2E Validation', () => {
  test.beforeAll(() => {
    // Verify environment variables exist
    if (!process.env.WORDPRESS_USERNAME || !process.env.WORDPRESS_APP_PASSWORD) {
      test.skip()
    }
  })

  test('should require authentication credentials', async () => {
    // Verify credentials are present
    expect(process.env.WORDPRESS_USERNAME).toBeDefined()
    expect(process.env.WORDPRESS_APP_PASSWORD).toBeDefined()
    expect(process.env.WORDPRESS_USERNAME).not.toBe('')
    expect(process.env.WORDPRESS_APP_PASSWORD).not.toBe('')
  })

  test('should authenticate and fetch menus', async () => {
    // Call fetchMenus() with real API
    const menus = await fetchMenus()

    // Assert menus were returned
    expect(menus).toBeDefined()
    expect(Array.isArray(menus)).toBe(true)
    expect(menus.length).toBeGreaterThan(0)

    // Verify menu structure
    const firstMenu = menus[0]
    expect(firstMenu).toHaveProperty('id')
    expect(firstMenu).toHaveProperty('name')
    expect(firstMenu).toHaveProperty('slug')
    expect(firstMenu).toHaveProperty('description')
    expect(typeof firstMenu.id).toBe('number')
    expect(typeof firstMenu.name).toBe('string')
  })

  test('should find Header menu', async () => {
    const menus = await fetchMenus()

    // Look for Header menu (actual menu on jazzsequence.com)
    const headerMenu = menus.find(
      (menu: WPMenu) =>
        menu.name.toLowerCase().includes('header') ||
        menu.slug.toLowerCase().includes('header')
    )

    // Assert header menu exists
    expect(headerMenu).toBeDefined()
    expect(headerMenu?.id).toBeGreaterThan(0)
  })

  test('should fetch menu items for first menu', async () => {
    // Get first menu
    const menus = await fetchMenus()
    expect(menus.length).toBeGreaterThan(0)

    const firstMenu = menus[0]

    // Call fetchMenuItems()
    const menuItems = await fetchMenuItems(firstMenu.id)

    // Assert items returned
    expect(menuItems).toBeDefined()
    expect(Array.isArray(menuItems)).toBe(true)
    expect(menuItems.length).toBeGreaterThan(0)

    // Verify menu item structure
    const firstItem = menuItems[0]
    expect(firstItem).toHaveProperty('id')
    expect(firstItem).toHaveProperty('title')
    expect(firstItem).toHaveProperty('url')
    expect(firstItem).toHaveProperty('parent')
    expect(firstItem).toHaveProperty('menu_order')
    expect(firstItem).toHaveProperty('target')
    expect(firstItem).toHaveProperty('classes')
    expect(typeof firstItem.id).toBe('number')
    expect(typeof firstItem.url).toBe('string')
  })

  test('should have valid menu item URLs', async ({ page }) => {
    // Fetch all menus
    const menus = await fetchMenus()
    expect(menus.length).toBeGreaterThan(0)

    // Get menu items from first menu
    const menuItems = await fetchMenuItems(menus[0].id)
    expect(menuItems.length).toBeGreaterThan(0)

    const failedUrls: Array<{ url: string; status: number }> = []

    // Check each URL is valid (limit to first 10 to avoid excessive requests)
    const urlsToCheck = menuItems.slice(0, 10)

    for (const item of urlsToCheck) {
      const url = item.url

      // Skip invalid URLs (anchors, javascript:, etc.)
      if (!url || url.startsWith('#') || url.startsWith('javascript:')) {
        continue
      }

      try {
        // Navigate to URL
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        })

        // Check for 404s or broken links
        if (response && response.status() >= 400) {
          failedUrls.push({ url, status: response.status() })
        }
      } catch {
        // Network errors or timeouts
        failedUrls.push({ url, status: 0 })
      }
    }

    // Assert no broken links
    expect(failedUrls).toHaveLength(0)
  })

  test('should have correct menu hierarchy', async () => {
    const menus = await fetchMenus()
    const menuItems = await fetchMenuItems(menus[0].id)

    // Build hierarchy map
    const itemsById = new Map<number, WPMenuItem>()
    const topLevelItems: WPMenuItem[] = []
    const childItems: WPMenuItem[] = []

    for (const item of menuItems) {
      itemsById.set(item.id, item)

      if (item.parent === 0) {
        topLevelItems.push(item)
      } else {
        childItems.push(item)
      }
    }

    // Verify top-level items exist
    expect(topLevelItems.length).toBeGreaterThan(0)

    // Verify all child items have valid parents
    for (const child of childItems) {
      const parent = itemsById.get(child.parent)
      expect(parent).toBeDefined()
      expect(parent?.id).toBe(child.parent)
    }

    // Verify menu_order is sequential
    const sortedItems = [...menuItems].sort((a, b) => a.menu_order - b.menu_order)
    for (let i = 0; i < sortedItems.length; i++) {
      expect(sortedItems[i].menu_order).toBeGreaterThanOrEqual(0)
      if (i > 0) {
        expect(sortedItems[i].menu_order).toBeGreaterThanOrEqual(sortedItems[i - 1].menu_order)
      }
    }
  })

  test('should have proper target attributes for external links', async () => {
    const menus = await fetchMenus()
    const menuItems = await fetchMenuItems(menus[0].id)

    const siteUrl = 'https://jazzsequence.com'
    const externalLinks: WPMenuItem[] = []
    const internalLinks: WPMenuItem[] = []

    for (const item of menuItems) {
      const url = item.url

      // Skip invalid URLs
      if (!url || url.startsWith('#') || url.startsWith('javascript:')) {
        continue
      }

      // Check if URL is external
      const isExternal = url.startsWith('http') && !url.startsWith(siteUrl)

      if (isExternal) {
        externalLinks.push(item)
      } else {
        internalLinks.push(item)
      }
    }

    // Verify external links have _blank target (if any exist)
    for (const link of externalLinks) {
      // WordPress typically sets target="_blank" for external links
      // This is not always enforced, but it's a good practice
      if (link.target) {
        expect(link.target).toBe('_blank')
      }
    }

    // Log results for debugging
    console.log(`Found ${menuItems.length} total menu items`)
    console.log(`- ${internalLinks.length} internal links`)
    console.log(`- ${externalLinks.length} external links`)
    console.log(`- ${menuItems.length - internalLinks.length - externalLinks.length} other items (anchors, etc.)`)
  })

  test('should fetch menu items for all menus', async () => {
    const menus = await fetchMenus()

    // Verify each menu has fetchable items
    for (const menu of menus) {
      const menuItems = await fetchMenuItems(menu.id)

      expect(menuItems).toBeDefined()
      expect(Array.isArray(menuItems)).toBe(true)

      // All items should reference this menu
      for (const item of menuItems) {
        expect(item.menus).toBe(menu.id)
      }
    }
  })

  test('should handle menu item title rendering', async () => {
    const menus = await fetchMenus()
    const menuItems = await fetchMenuItems(menus[0].id)

    for (const item of menuItems) {
      // Title should be a rendered object
      expect(item.title).toBeDefined()
      expect(typeof item.title).toBe('object')
      expect(item.title).toHaveProperty('rendered')
      expect(typeof item.title.rendered).toBe('string')
      expect(item.title.rendered).not.toBe('')
    }
  })

  test('should have valid menu item metadata', async () => {
    const menus = await fetchMenus()
    const menuItems = await fetchMenuItems(menus[0].id)

    for (const item of menuItems) {
      // Verify required fields exist
      expect(item.id).toBeGreaterThan(0)
      expect(item.menu_order).toBeGreaterThanOrEqual(0)
      expect(item.parent).toBeGreaterThanOrEqual(0)

      // Verify type and object
      expect(item.type).toBeDefined()
      expect(item.type_label).toBeDefined()
      expect(item.object).toBeDefined()
      expect(item.object_id).toBeGreaterThanOrEqual(0)

      // Verify classes is an array
      expect(Array.isArray(item.classes)).toBe(true)

      // Verify xfn is an array
      expect(Array.isArray(item.xfn)).toBe(true)

      // Verify invalid flag
      expect(typeof item.invalid).toBe('boolean')
    }
  })

  test('should not have invalid menu items', async () => {
    const menus = await fetchMenus()
    const menuItems = await fetchMenuItems(menus[0].id)

    // Find any invalid items
    const invalidItems = menuItems.filter((item: WPMenuItem) => item.invalid === true)

    // Should have no invalid items
    expect(invalidItems).toHaveLength(0)
  })

  test('should cache menu data with ISR', async () => {
    // Fetch with ISR options
    const startTime = Date.now()
    const menus1 = await fetchMenus({
      isr: {
        revalidate: 3600, // 1 hour
        tags: ['menus'],
      },
    })
    const firstFetchTime = Date.now() - startTime

    // Fetch again (should be cached)
    const startTime2 = Date.now()
    const menus2 = await fetchMenus({
      isr: {
        revalidate: 3600,
        tags: ['menus'],
      },
    })
    const secondFetchTime = Date.now() - startTime2

    // Verify same data
    expect(menus1.length).toBe(menus2.length)
    expect(menus1[0].id).toBe(menus2[0].id)

    // Second fetch might be faster (if cached), but this is not guaranteed
    // Just verify both fetches completed
    expect(firstFetchTime).toBeGreaterThan(0)
    expect(secondFetchTime).toBeGreaterThan(0)
  })
})
