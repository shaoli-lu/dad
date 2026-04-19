export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://dad-ruddy.vercel.app/sitemap.xml',
  };
}
