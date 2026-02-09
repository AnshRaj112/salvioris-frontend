import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://salvioris.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/signin',
          '/therapist-signin',
          '/forgot-password',
          '/forgot-username',
          '/reset-password',
          '/therapist-pending',
          '/vent', // Private venting space
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

