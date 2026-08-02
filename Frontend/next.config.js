/** @type {import('next').NextConfig} */
const nextConfig = {images: {
    domains: ['res.cloudinary.com','d1t78adged64l7.cloudfront.net'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
   
  },
}

module.exports = nextConfig
