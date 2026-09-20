/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
