/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The project ships without an ESLint setup; don't let `next build` depend on one.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
