/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://forex-calculator.onrender.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api'],
      },
    ],
    additionalSitemaps: [
      'https://forex-calculator.onrender.com/sitemap.xml',
    ],
  },
  changefreq: 'daily',
  priority: 1.0,
  sitemapSize: 7000,
  exclude: ['/api/*'],
}
