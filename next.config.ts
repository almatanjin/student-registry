import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright builds into its own folder so it never clashes with `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    // The proxy buffers request bodies up to this size. Submission files may be up to 10 MB,
    // plus multipart form overhead; larger uploads are refused by the upload route itself.
    proxyClientMaxBodySize: "12mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
