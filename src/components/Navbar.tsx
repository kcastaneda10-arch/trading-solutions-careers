"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/context";
import LanguageBanner from "./LanguageBanner";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <LanguageBanner />
      <nav className="fixed top-8 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/68fb7b9474bf8f90808cd50f/69026c53bdd2f248a012a1d2_New%20logo%20Trading%20SOlutions-03.jpg"
              alt="Trading Solutions"
              className="h-8"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#culture" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {t.nav.culture}
            </Link>
            <Link href="/#departments" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {t.nav.areas}
            </Link>
            <Link href="/#experience" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {t.nav.experience}
            </Link>
            <Link href="/vacantes" className="pill-btn pill-btn-primary text-sm !py-2.5 !px-5">
              {t.nav.viewJobs}
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 pb-6 pt-4">
            <div className="flex flex-col gap-4">
              <Link href="/#culture" onClick={() => setMobileOpen(false)} className="text-base font-medium text-gray-700">
                {t.nav.culture}
              </Link>
              <Link href="/#departments" onClick={() => setMobileOpen(false)} className="text-base font-medium text-gray-700">
                {t.nav.areas}
              </Link>
              <Link href="/#experience" onClick={() => setMobileOpen(false)} className="text-base font-medium text-gray-700">
                {t.nav.experience}
              </Link>
              <Link href="/vacantes" onClick={() => setMobileOpen(false)} className="pill-btn pill-btn-primary text-sm justify-center mt-2">
                {t.nav.viewJobs}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
