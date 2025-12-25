import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/'], // Protect API routes and private dashboard
    },
    sitemap: 'https://cybermateconsulting.com/sitemap.xml',
  }
}
