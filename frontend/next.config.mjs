/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api-backend/:path*', destination: 'http://localhost:4000/api/:path*' },
      { source: '/go/:path*', destination: 'http://localhost:4000/go/:path*' },
    ];
  },
};

export default nextConfig;
