/** @type {import('next').NextConfig} */

const nextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: [
    "10.94.21.63"
  ],

}

export default nextConfig