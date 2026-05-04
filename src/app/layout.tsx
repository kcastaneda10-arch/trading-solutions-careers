import type { Metadata } from "next";
import { LanguageProvider } from "@/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careers — Trading Solutions",
  description: "Únete al equipo que mueve el mundo. Explora oportunidades en Trading Solutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Open Sauce Sans · alineado con tradingsolutions.com */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Open Sauce Sans (Florian Karsten) — variantes self-hosted vía CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/marcologous/open-sauce-fonts/css/OpenSauceSans.css"
        />
      </head>
      <body className="antialiased font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
