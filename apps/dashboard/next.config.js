const { setupDevPlatform } = require("@cloudflare/next-on-pages/next-dev");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      stream: false,
      constants: false,
    };
    return config;
  },
};

if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}

module.exports = nextConfig;
