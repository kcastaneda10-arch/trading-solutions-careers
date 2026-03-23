"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/context";
import { ArrowUpRight, Activity, Globe, Layers, BookOpen, Heart, Star } from "lucide-react";

const EXPERIENCE_IMAGES = [
  "photo-1522071820081-009f0129c71c",
  "photo-1573497019940-1c28c88b4f3e",
  "photo-1552664730-d307ca884978",
  "photo-1543269865-cbf427effbad",
];

const BENEFIT_ICONS = [BookOpen, Globe, Heart, Star];

export default function HomePage() {
  const { t, locale } = useLanguage();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen bg-black text-white flex items-end overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pb-20 pt-40 w-full">
          <p className="text-sm font-medium tracking-widest uppercase text-gray-400 mb-6">
            {t.hero.tag}
          </p>
          <h1 className="hero-text max-w-4xl mb-8 whitespace-pre-line">
            {t.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed font-light">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/vacantes" className="pill-btn pill-btn-white text-base">
              {t.hero.cta}
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </Link>
            <a href="#culture" className="pill-btn text-base text-white border border-white/30">
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {(["countries", "clients", "teus", "tons"] as const).map((key) => (
              <div key={key}>
                <p className="stat-number">{t.stats[key].value}</p>
                <p className="text-sm text-gray-500 mt-2 font-medium">{t.stats[key].label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH MINDSET */}
      <section id="culture" className="py-20 md:py-28 bg-ts-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">
              {t.culture.tag}
            </p>
            <h2 className="section-title mb-6 whitespace-pre-line">{t.culture.title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed font-light">
              {t.culture.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[Activity, Globe, Layers].map((Icon, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 hover:-translate-y-1.5 transition-transform duration-500">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3">{t.culture.cards[i].title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t.culture.cards[i].desc}</p>
              </div>
            ))}
          </div>

          {/* Black stats block */}
          <div className="mt-16 bg-black rounded-2xl p-10 md:p-14 text-white">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                  {t.culture.blackBlock.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{t.culture.blackBlock.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-3xl font-bold">{t.culture.blackBlock.maritime}</p>
                  <p className="text-sm text-gray-400 mt-1">{t.culture.blackBlock.maritimeSub}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">+10</p>
                  <p className="text-sm text-gray-400 mt-1">{t.culture.blackBlock.countriesLabel}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">+52k</p>
                  <p className="text-sm text-gray-400 mt-1">{t.culture.blackBlock.teusLabel}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">+500</p>
                  <p className="text-sm text-gray-400 mt-1">{t.culture.blackBlock.tonsLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section id="departments" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">{t.departments.tag}</p>
            <h2 className="section-title">{t.departments.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {([
              { key: "ops" as const, dept: "Operaciones", img: "photo-1578575437130-527eed3abbec", alt: locale === "es" ? "Operaciones marÃ­timas" : "Maritime operations" },
              { key: "corporate" as const, dept: "Corporate", img: "photo-1497366216548-37526070297c", alt: "Corporate" },
              { key: "commercial" as const, dept: "Comercial", img: "photo-1600880292203-757bb62b4baf", alt: locale === "es" ? "Comercial" : "Commercial" },
            ]).map((d) => (
              <Link key={d.dept} href={`/vacantes?dept=${d.dept}`} className="group bg-black text-white rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-transform duration-500">
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://images.unsplash.com/${d.img}?w=600&q=80`}
                    alt={d.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{t.departments[d.key].name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{t.departments[d.key].count}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center group-hover:rotate-45 transition-transform">
                    <ArrowUpRight size={16} strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="py-20 md:py-28 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">{t.experience.tag}</p>
            <h2 className="section-title max-w-3xl">{t.experience.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {t.experience.steps.map((exp, i) => (
              <div
                key={exp.num}
                className="relative rounded-2xl overflow-hidden min-h-[280px] flex flex-col justify-end p-10"
                style={{
                  background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.9) 100%), url('https://images.unsplash.com/${EXPERIENCE_IMAGES[i]}?w=600&q=80') center/cover`,
                }}
              >
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
                  {exp.num} â {exp.label}
                </p>
                <h3 className="text-xl font-bold mb-2">{exp.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{exp.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/vacantes" className="pill-btn pill-btn-white text-base">
              {t.experience.cta}
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">{t.benefits.tag}</p>
            <h2 className="section-title">{t.benefits.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {t.benefits.items.map((b, i) => {
              const Icon = BENEFIT_ICONS[i];
              return (
                <div key={b.title} className="bg-ts-bg rounded-2xl p-6 hover:-translate-y-1.5 transition-transform duration-500">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{b.title}</h4>
                  <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="section-title mb-6">{t.cta.title}</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 font-light">{t.cta.subtitle}</p>
          <Link href="/vacantes" className="pill-btn pill-btn-white text-base">
            {t.cta.button}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
