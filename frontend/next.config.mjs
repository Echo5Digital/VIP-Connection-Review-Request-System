/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      { source: '/api-backend/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/go/:path*', destination: `${backendUrl}/go/:path*` },
    ];
  },
};

export default nextConfig;
