/** @type {import('next').NextConfig} */
module.exports = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
  async redirects() {
    return [
      {
        source: '/_error',
        destination: '/',
        permanent: true,
      },
    ]
  }
}
