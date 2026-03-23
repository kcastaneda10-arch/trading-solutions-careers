"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/context";
import { jobs } from "@/data/jobs";
import { ArrowLeft, MapPin, Check, ArrowUpRight, Upload, X, CheckCircle } from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams();
  const job = jobs.find((j) => j.id === Number(id));
  const { t, locale } = useLanguage();
  const [showApply, setShowApply] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const modeName = (m: string) => (t.modeNames as Record<string, string>)[m] || m;
  const deptName = (d: string) => (t.deptNames as Record<string, string>)[d] || d;

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="pt-40 pb-20 text-center min-h-screen bg-white">
          <h1 className="section-title mb-4">{t.jobs.notFound}</h1>
          <Link href="/vacantes" className="pill-btn pill-btn-primary">
            {t.jobs.viewAll}
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowApply(false);
    setSubmitted(true);
  };

  return (
    <>
      <Navbar />

      {/* Hero header */}
      <div className="bg-black text-white pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <Link
            href="/vacantes"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            {t.jobs.backToJobs}
          </Link>
          <span className="tag mb-4 bg-white/15 text-white border-transparent">{deptName(job.dept)}</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-3 tracking-tight">{job.title[locale]}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {job.location}
            </span>
            <span>Â·</span>
            <span>{modeName(job.mode)}</span>
            <span>Â·</span>
            <span>{job.level}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="mb-10">
            <p className="text-gray-600 leading-relaxed text-base">{job.description[locale]}</p>
            <p className="mt-4 font-bold text-xl">{job.salary}</p>
          </div>

          <div className="mb-10">
            <h3 className="font-bold text-lg mb-5">{t.jobs.whatYouDo}</h3>
            <div className="space-y-3">
              {job.responsibilities[locale].map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-black flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                  <p className="text-sm text-gray-600">{r}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="font-bold text-lg mb-5">{t.jobs.whatWeSeek}</h3>
            <div className="space-y-3">
              {job.requirements[locale].map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0 mt-2" />
                  <p className="text-sm text-gray-600">{r}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-10">
            {job.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <button
            onClick={() => setShowApply(true)}
            className="pill-btn pill-btn-primary w-full justify-center text-base"
          >
            {t.jobs.applyBtn}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Apply Modal */}
      {showApply && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowApply(false); }}
        >
          <div className="bg-white rounded-2xl max-w-[720px] w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t.jobs.applyTo}</p>
                  <h2 className="text-xl font-bold">{job.title[locale]}</h2>
                </div>
                <button
                  onClick={() => setShowApply(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.jobs.fullName}</label>
                    <input type="text" required className="input-field" placeholder={t.jobs.fullNamePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.jobs.email}</label>
                    <input type="email" required className="input-field" placeholder={t.jobs.emailPlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.jobs.phone}</label>
                    <input type="tel" className="input-field" placeholder={t.jobs.phonePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.jobs.linkedin}</label>
                    <input type="url" className="input-field" placeholder={t.jobs.linkedinPlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.jobs.cvLabel}</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-black transition-colors cursor-pointer">
                      <Upload size={24} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {t.jobs.cvDrag} <span className="text-black font-medium">{t.jobs.cvSelect}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{t.jobs.cvFormats}</p>
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.jobs.whyTs}</label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder={t.jobs.whyTsPlaceholder}
                    />
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button type="submit" className="pill-btn pill-btn-primary flex-1 justify-center">
                    {t.jobs.submit}
                    <ArrowUpRight size={16} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => setShowApply(false)} className="pill-btn pill-btn-outline">
                    {t.jobs.cancel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {submitted && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSubmitted(false); }}
        >
          <div className="bg-white rounded-2xl max-w-[480px] w-full">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t.jobs.successTitle}</h3>
              <p className="text-gray-500 mb-8">{t.jobs.successMsg}</p>
              <Link href="/vacantes" className="pill-btn pill-btn-primary">
                {t.jobs.backToJobsBtn}
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
