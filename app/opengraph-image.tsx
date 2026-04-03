import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import OGCard, { OG_SIZE } from '@/components/OGCard'
import { fetchSiteInfo } from '@/lib/wordpress/site-info'

// Cache for 24 hours — regenerates daily so tagline changes propagate overnight.
export const revalidate = 86400

export const alt = 'jazzsequence.com'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  // Fetch Victor Mono Bold — loaded explicitly because Satori can't use web fonts
  // Satori requires woff (woff1) — woff2 is not supported and throws "Unsupported OpenType signature wOF2"
  const victorMonoBold = await readFile(
    join(process.cwd(), 'node_modules/@fontsource/victor-mono/files/victor-mono-latin-700-normal.woff')
  )

  // Fetch actual site tagline from WordPress
  let tagline = 'I make websites and things'
  try {
    const siteInfo = await fetchSiteInfo()
    if (siteInfo.description) tagline = siteInfo.description
  } catch {
    // Use fallback if WordPress is unreachable
  }

  return new ImageResponse(
    <OGCard tagline={tagline} />,
    {
      ...size,
      fonts: [
        {
          name: 'Victor Mono',
          data: victorMonoBold,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )
}
