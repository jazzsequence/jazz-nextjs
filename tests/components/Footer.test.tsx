import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({
    commitShort: 'abc1234',
    commitHash: 'abc1234abcdef1234567890abcdef1234567890ab',
    buildTime: '2026-01-01T00:00:00.000Z',
  }),
}))

describe('Footer', () => {
  it('renders a footer element', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    expect(container.querySelector('footer')).toBeTruthy()
  })

  it('renders the site title "jazzsequence"', async () => {
    const FooterEl = await Footer()
    render(FooterEl)
    // "jazzsequence" appears in the bottom bar and the profile card
    expect(screen.getAllByText('jazzsequence').length).toBeGreaterThanOrEqual(1)
  })

  it('does not apply the neon-text class to the footer site title', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    expect(container.querySelector('.neon-text')).toBeNull()
  })

  it('renders copyright text with the current year', async () => {
    const FooterEl = await Footer()
    render(FooterEl)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(`${year}.*Chris Reynolds`))).toBeTruthy()
  })

  it('renders social links with Font Awesome icons', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    const faIcons = container.querySelectorAll('i[class*="fa-"]')
    expect(faIcons.length).toBeGreaterThan(0)
  })

  it('renders social links with accessible aria-labels', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    const socialLinks = container.querySelectorAll('a[aria-label]')
    expect(socialLinks.length).toBeGreaterThan(5)
  })

  it('includes a GitHub social link', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    const githubLink = container.querySelector('a[aria-label*="GitHub"]')
    expect(githubLink).toBeTruthy()
    expect((githubLink as HTMLAnchorElement)?.href).toContain('github.com/jazzsequence')
  })

  it('includes a Bluesky social link', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    const bskyLink = container.querySelector('a[aria-label*="Bluesky"]')
    expect(bskyLink).toBeTruthy()
  })

  it('renders build info with "Last Built" label', async () => {
    const FooterEl = await Footer()
    render(FooterEl)
    expect(screen.getByText(/Last Built:.*MT/s)).toBeTruthy()
  })

  it('renders the commit hash as a link to GitHub', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    const commitLink = container.querySelector('a[href*="/commit/abc1234abcdef"]')
    expect(commitLink).toBeTruthy()
    expect(commitLink?.textContent).toBe('abc1234')
  })

  it('renders the ActivityPub webfinger address @jazzsequence@jazzsequence.com', async () => {
    const FooterEl = await Footer()
    render(FooterEl)
    // Webfinger appears as the profile label and in the copy instruction code block
    expect(screen.getAllByText(/@jazzsequence@jazzsequence\.com/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Check out the GitHub repo" link text', async () => {
    const FooterEl = await Footer()
    render(FooterEl)
    expect(screen.getByText(/Check out the GitHub repo/)).toBeTruthy()
  })

  it('links the GitHub repo text to jazz-nextjs repository', async () => {
    const FooterEl = await Footer()
    const { container } = render(FooterEl)
    const repoLink = container.querySelector('a[href*="jazz-nextjs"]')
    expect(repoLink).toBeTruthy()
  })
})
