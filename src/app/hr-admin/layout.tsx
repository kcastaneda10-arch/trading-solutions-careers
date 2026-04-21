import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Admin · Careers ATS — Trading Solutions",
  description: "Panel de administración del ATS — dashboard, pipeline, CV bank, pruebas y analytics",
  robots: { index: false, follow: false },
};

export default function HRAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#EBEBEB]">{children}</div>;
}
