/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-pdf trae binarios de fuentes y módulos ESM que el bundler de Next
  // rompe si intenta empaquetarlos: se deja como dependencia externa.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
    ],
  },
};

module.exports = nextConfig;
