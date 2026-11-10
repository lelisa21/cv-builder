'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useApp } from '@/lib/AppContext';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="border-t border-[var(--line)] bg-white dark:bg-[#0b1018]">
      <div className="max-w-[1120px] mx-auto px-5 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <Logo size="md" showBadge={false} asLink={true} />
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-sm">{t.brand.productBlurb}</p>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed max-w-sm">
              <span className="font-semibold text-[var(--ink)]">{t.brand.company}</span>
              {' — '}
              {t.brand.companyBlurb}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
              {t.brand.product}
            </h4>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/" className="hover:text-[var(--brand)]">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-[var(--brand)]">
                  {t.nav.templates}
                </Link>
              </li>
              <li>
                <Link href="/builder" className="hover:text-[var(--brand)]">
                  {t.nav.builder}
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-[var(--brand)]">
                  {t.nav.jobs}
                </Link>
              </li>
              <li>
                <Link href="/letters" className="hover:text-[var(--brand)]">
                  {t.nav.letters}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
              {t.brand.company}
            </h4>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{t.brand.category}</p>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <a href="https://github.com/shBikatTech" className="hover:text-[var(--brand)]" target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/BikatTech-shashura-4935a2259/"
                  className="hover:text-[var(--brand)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:BikatTechshashura@gmail.com" className="hover:text-[var(--brand)]">
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <p>
            © {new Date().getFullYear()} {t.brand.company}. {t.brand.ecosystemLine}
          </p>
          <p>English · Afaan Oromoo · አማርኛ</p>
        </div>
      </div>
    </footer>
  );
}
