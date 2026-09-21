/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-pdf trae binarios de fuentes y módulos ESM que el bundler de Next
  // rompe si intenta empaquetarlos: se deja como dependencia externa.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // pdfkit carga sus fuentes estándar con un require dinámico que el
    // rastreo de archivos de Vercel no ve: sin esto, en producción falla con
    // «Cannot find module …/pdfkit/js/standard-fonts/Helvetica.cjs».
    outputFileTracingIncludes: {
      "/api/admin/informe-vacante/**": [
        "./node_modules/pdfkit/js/standard-fonts/**/*",
        "./node_modules/pdfkit/js/data/**/*",
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
    ],
  },
};

module.exports = nextConfig;
