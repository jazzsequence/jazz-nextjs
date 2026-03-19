const SOCIAL_LINKS = [
  { label: 'Personal site',  fa: 'fa-solid fa-link',       href: 'https://chrisreynolds.io' },
  { label: 'Newsletter',     fa: 'fa-solid fa-envelope',   href: 'https://us1.campaign-archive.com/home/?u=4085972eca88b58d063f1b9a5&id=85460dd934' },
  { label: 'Bluesky',        fa: 'fa-brands fa-bluesky',   href: 'https://bsky.app/profile/jazzsequence.com' },
  { label: 'GitHub',         fa: 'fa-brands fa-github',    href: 'https://github.com/jazzsequence' },
  { label: 'Instagram',      fa: 'fa-brands fa-instagram', href: 'https://instagram.com/jazzs3quence' },
  { label: 'Spotify',        fa: 'fa-brands fa-spotify',   href: 'https://open.spotify.com/user/jazzsequence' },
  { label: 'LinkedIn',       fa: 'fa-brands fa-linkedin',  href: 'https://linkedin.com/in/chrissreynolds' },
  { label: 'YouTube',        fa: 'fa-brands fa-youtube',   href: 'https://www.youtube.com/c/chrisreynoldsjazzsequence' },
  { label: 'Bandcamp',       fa: 'fa-brands fa-bandcamp',  href: 'https://music.jazzsequence.com/' },
  { label: 'SoundCloud',     fa: 'fa-brands fa-soundcloud',href: 'https://soundcloud.com/jazzs3quence' },
  { label: 'Twitch',         fa: 'fa-brands fa-twitch',    href: 'https://twitch.tv/jazzsequence' },
  { label: 'Mastodon',       fa: 'fa-brands fa-mastodon',  href: 'https://mstdn.social/@jazzsequence' },
  { label: 'WordPress.org',  fa: 'fa-brands fa-wordpress', href: 'https://profiles.wordpress.org/jazzs3quence' },
  { label: 'Etsy',           fa: 'fa-brands fa-etsy',      href: 'https://possibleoctopus.com' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-header border-t border-brand-border mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Social links */}
        <div className="flex justify-end flex-wrap gap-3 mb-4">
          {SOCIAL_LINKS.map(({ label, fa, href }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              title={label}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 bg-brand-surface-high border border-brand-border rounded text-brand-muted hover:text-brand-cyan hover:border-brand-cyan transition-colors"
            >
              <i className={fa} aria-hidden="true" />
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex justify-between items-center pt-4 border-t border-brand-border">
          <span className="font-mono font-bold text-brand-cyan text-sm">
            jazzsequence
          </span>
          <span className="font-heading text-brand-muted text-sm">
            &copy; {currentYear} Chris Reynolds
          </span>
        </div>

      </div>
    </footer>
  )
}
