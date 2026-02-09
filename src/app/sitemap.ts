import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://salvioris.com'
  const lastModified = new Date()

  return [
    // Main marketing / landing pages
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/vent`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // Auth & account flows
    {
      url: `${baseUrl}/signup`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/forgot-username`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/reset-password`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Therapist flows
    {
      url: `${baseUrl}/therapist-signup`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/therapist-signin`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/therapist-pending`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // Admin
    {
      url: `${baseUrl}/admin`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]
}

