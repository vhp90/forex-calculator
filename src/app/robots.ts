import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/calculator'],
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://thedailybroker.com/sitemap.xml',
    host: 'https://thedailybroker.com',
  }
}
