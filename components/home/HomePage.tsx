'use client';

import Link from 'next/link';
import { useApp } from '@/lib/AppContext';

const templates = [
  {
    id: 'navy-professional',
    name: 'Navy Professional',
    role: 'Leadership & technology',
    art: 'linear-gradient(180deg, #0c3b74 0%, #0c3b74 38%, #f4f6f9 38%)',
  },
  {
    id: 'slate-timeline',
    name: 'Slate Timeline',
    role: 'Career narrative',
    art: 'linear-gradient(180deg, #2c3848 0%, #2c3848 34%, #eef1f4 34%)',
  },
  {
    id: 'modern-executive',
    name: 'Modern Executive',
    role: 'Senior corporate',
    art: 'linear-gradient(180deg, #4c1728 0%, #4c1728 34%, #f5f0f3 34%)',
  },
  {
    id: 'academic-graduate',
    name: 'Academic Graduate',
    role: 'Research & campus',
    art: 'linear-gradient(180deg, #ffffff 0%, #ffffff 28%, #f8fafc 28%)',
  },
];

function IconMonitor() {
  return (
    <svg className="arch-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg className="arch-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg className="arch-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.5 18h9.2A4.3 4.3 0 0 0 21 13.8a4.2 4.2 0 0 0-3.8-4.2A6 6 0 0 0 6.2 11.1 3.8 3.8 0 0 0 7.5 18Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg className="arch-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 16.5h2.2a1.6 1.6 0 0 0 0-3.2H8.5V12m5 4.5V12h2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatIcon({ d }: { d: string }) {
  return (
    <span className="feat-icon" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function HomePage() {
  const { t } = useApp();
  const h = t.home;

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-wrap home-hero-grid">
          <div className="home-hero-copy">
            <h1 className="home-h1 mt-4 text-[clamp(40px,6.2vw,72px)]">{h.heroTitle}</h1>
            <p className="home-lead mt-5 text-[17px] max-w-[34rem]">{h.heroSubtitle}</p>
            <div className="home-hero-actions">
              <Link href="/builder" className="home-btn home-btn-primary">
                {h.ctaPrimary}
              </Link>
              <Link href="/templates" className="home-btn home-btn-ghost">
                {h.ctaSecondary}
              </Link>
            </div>
            <div className="home-proof">
              <div className="home-proof-item">
                <strong>{h.proof1Title}</strong>
                <span>{h.proof1Desc}</span>
              </div>
              <div className="home-proof-item">
                <strong>{h.proof2Title}</strong>
                <span>{h.proof2Desc}</span>
              </div>
              <div className="home-proof-item">
                <strong>{h.proof3Title}</strong>
                <span>{h.proof3Desc}</span>
              </div>
            </div>
          </div>

          <div className="home-preview">
            <div className="home-preview-stage">
              <div className="cv-mini" aria-hidden>
                <div className="cv-mini-top">
                  <div>
                    <div className="cv-mini-name">Abeba Kebede</div>
                    <div className="cv-mini-role">Product designer</div>
                  </div>
                  <div className="cv-mini-meta">
                    Addis Ababa
                    <br />
                    abeba@bikattech.com
                    <br />
                    +251 90 000 0000
                  </div>
                </div>
                <div className="cv-mini-cols">
                  <div>
                    <div className="cv-block">
                      <div className="cv-label">{h.previewSkills}</div>
                      <div className="cv-bar w-80" />
                      <div className="cv-bar w-60" />
                      <div className="cv-bar w-90" />
                      <div className="cv-bar w-45" />
                    </div>
                    <div className="cv-block">
                      <div className="cv-label">{h.previewEducation}</div>
                      <div className="cv-bar ink w-90" />
                      <div className="cv-bar ink w-60" />
                      <div className="cv-bar ink w-80" />
                    </div>
                  </div>
                  <div>
                    <div className="cv-block">
                      <div className="cv-label">{h.previewExperience}</div>
                      <div className="cv-bar ink w-90" />
                      <div className="cv-bar ink w-80" />
                      <div className="cv-bar ink w-60" />
                      <div className="cv-bar ink w-90" />
                      <div className="cv-bar ink w-45" />
                    </div>
                    <div className="cv-block">
                      <div className="cv-label">{h.previewProjects}</div>
                      <div className="cv-bar ink w-80" />
                      <div className="cv-bar ink w-60" />
                      <div className="cv-bar ink w-90" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="home-chip-row">
                <span className="home-chip">{h.chipLive}</span>
                <span className="home-chip">{h.chipLocal}</span>
                <span className="home-chip">{h.chipExport}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section pt-0">
        <div className="home-wrap">
          <div className="home-section-head">
            <h2 className="home-h2 mt-3 text-[clamp(28px,4vw,44px)]">{h.archTitle}</h2>
            <p className="home-lead mt-3 text-[16px]">{h.archSubtitle}</p>
          </div>

          <div className="arch-card">
            <div className="arch-title">{h.archCardTitle}</div>
            <div className="arch-stack">
              <div className="arch-node arch-frontend">
                <IconMonitor />
                <h3>{h.archFrontend}</h3>
                <p>{h.archFrontendDesc}</p>
              </div>
              <div className="arch-flow" aria-hidden>
                ↕
              </div>
              <div className="arch-mid">
                <div className="arch-node arch-local">
                  <IconDatabase />
                  <h3>{h.archLocal}</h3>
                  <p>{h.archLocalDesc}</p>
                </div>
                <div className="arch-node arch-cloud">
                  <IconCloud />
                  <h3>{h.archCloud}</h3>
                  <p>{h.archCloudDesc}</p>
                </div>
              </div>
              <div className="arch-flow" aria-hidden>
                ↓
              </div>
              <div className="arch-node arch-docs">
                <IconPdf />
                <h3>{h.archDocs}</h3>
                <p>{h.archDocsDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-wrap">
          <div className="home-section-head">
            <h2 className="home-h2 mt-3 text-[clamp(28px,4vw,44px)]">{h.howTitle}</h2>
          </div>
          <div className="steps">
            <article className="step">
              <div className="step-num">01</div>
              <h3>{h.how1Title}</h3>
              <p>{h.how1Desc}</p>
            </article>
            <article className="step">
              <div className="step-num">02</div>
              <h3>{h.how2Title}</h3>
              <p>{h.how2Desc}</p>
            </article>
            <article className="step">
              <div className="step-num">03</div>
              <h3>{h.how3Title}</h3>
              <p>{h.how3Desc}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-wrap">
          <div className="home-section-head">
            <h2 className="home-h2 mt-3 text-[clamp(28px,4vw,44px)]">{h.featuresTitle}</h2>
            <p className="home-lead mt-3 text-[16px]">{h.featuresSubtitle}</p>
          </div>
          <div className="feat-grid">
            <div className="feat-main">
              <article className="feat">
                <FeatIcon d="M4 6h16M4 12h10M4 18h16" />
                <h3>{h.feature1Title}</h3>
                <p>{h.feature1Desc}</p>
              </article>
              <article className="feat">
                <FeatIcon d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
                <h3>{h.feature2Title}</h3>
                <p>{h.feature2Desc}</p>
              </article>
            </div>
            <div className="feat-side">
              <article className="feat">
                <FeatIcon d="M4 19V5m0 14 7-4 9 4V7l-9-4-7 4" />
                <h3>{h.feature3Title}</h3>
                <p>{h.feature3Desc}</p>
              </article>
              <article className="feat">
                <FeatIcon d="M5 7h14v12H5zM8 7V5h8v2M9 12h6" />
                <h3>{h.feature4Title}</h3>
                <p>{h.feature4Desc}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-wrap">
          <div className="home-section-head flex flex-col md:flex-row md:items-end md:justify-between gap-4 max-w-none">
            <div className="max-w-xl">
              <h2 className="home-h2 mt-3 text-[clamp(28px,4vw,44px)]">{h.templatesTitle}</h2>
              <p className="home-lead mt-3 text-[16px]">{h.templatesSubtitle}</p>
            </div>
            <Link href="/builder" className="home-btn home-btn-ghost">
              {h.templatesCta}
            </Link>
          </div>
          <div className="tpl-grid">
            {templates.map((tpl) => (
              <Link key={tpl.id} href={`/builder?template=${tpl.id}`} className="tpl">
                <div className="tpl-art" style={{ background: tpl.art }}>
                  <div className="h-full rounded-md bg-white/90 border border-black/5 p-3 flex flex-col gap-2">
                    <div className="h-2 w-1/2 rounded bg-[var(--brand)]/80" />
                    <div className="h-1.5 w-full rounded bg-slate-200" />
                    <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                    <div className="mt-auto grid grid-cols-3 gap-1.5">
                      <div className="h-8 rounded bg-slate-100" />
                      <div className="h-8 rounded bg-slate-100 col-span-2" />
                    </div>
                  </div>
                </div>
                <div className="tpl-body">
                  <h3>{tpl.name}</h3>
                  <p>{tpl.role}</p>
                  <span className="tpl-cta">{h.useTemplate}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-wrap">
          <div className="home-section-head center">
            <h2 className="home-h2 mt-3 text-[clamp(28px,4vw,44px)]">{h.trustTitle}</h2>
          </div>
          <div className="trust-grid">
            <article className="trust">
              <h3>{h.trust1Title}</h3>
              <p>{h.trust1Desc}</p>
            </article>
            <article className="trust">
              <h3>{h.trust2Title}</h3>
              <p>{h.trust2Desc}</p>
            </article>
            <article className="trust">
              <h3>{h.trust3Title}</h3>
              <p>{h.trust3Desc}</p>
            </article>
            <article className="trust">
              <h3>{h.trust4Title}</h3>
              <p>{h.trust4Desc}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-finale">
        <div className="home-wrap">
          <div className="home-finale-card">
            <div>
              <h2>{h.ctaTitle}</h2>
              <p>{h.ctaSubtitle}</p>
            </div>
            <div className="flex md:justify-end">
              <Link href="/builder" className="home-btn home-btn-on-dark">
                {h.ctaButton}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
