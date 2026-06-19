/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // PGlite ships a WASM Postgres — keep it external so Next requires it at
    // runtime (Node) instead of trying to bundle the .wasm into a serverless trace.
    serverComponentsExternalPackages: ["@electric-sql/pglite"],
  },
};

export default nextConfig;
