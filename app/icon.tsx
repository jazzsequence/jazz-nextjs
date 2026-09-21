import { resolveIconResponse } from '@/lib/wordpress/site-info'

// Matches the ISR window used elsewhere for WordPress-sourced data (site-info.ts).
export const revalidate = 3600

export const size = {
  width: 32,
  height: 32,
}

// Best-guess metadata hint for the <link type="..."> attribute. WordPress serves the
// Site Icon in whatever format it was originally uploaded as (commonly JPEG or PNG) —
// the actual served bytes always carry the real Content-Type from WordPress (see
// resolveIconResponse), regardless of what's declared here.
export const contentType = 'image/jpeg'

export default async function Icon() {
  return resolveIconResponse('small', contentType)
}
