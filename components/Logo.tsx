'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showBadge?: boolean;
  asLink?: boolean;
  className?: string;
}

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 52,
} as const;

export default function Logo({
  size = 'md',
  showText = true,
  showBadge = false,
  asLink = true,
  className = '',
}: LogoProps) {
  const px = SIZE_PX[size];
  const productSize = {
    sm: 'text-[16px]',
    md: 'text-[19px]',
    lg: 'text-[26px]',
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span className="relative shrink-0 overflow-hidden" style={{ width: px, height: px }}>
        <Image
          src="/logo.png"
          alt=""
          width={px * 2}
          height={px * 2}
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{ width: px * 1.85, height: px * 1.85 }}
        />
      </span>
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-2">
            <span
              className={`${productSize} font-semibold tracking-[-0.03em] text-[var(--ink)] dark:text-zinc-50`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CV Studio
            </span>
            {showBadge && (
              <span className="hidden sm:inline-flex text-[9px] font-semibold uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/10">
                Product
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
            by BikatTech
          </span>
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-md"
        aria-label="CV Studio by BikatTech"
      >
        {content}
      </Link>
    );
  }

  return content;
}
