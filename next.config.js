/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['gravatar.com', 'brandfetch.com', 'localhost'],
  },
}

module.exports = nextConfig 