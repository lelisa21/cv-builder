'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/AuthContext';
import { LanguageCode } from '@/types';
import Logo from '@/components/Logo';
import AuthModal from '@/components/auth/AuthModal';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { t, language, setLanguage, theme, toggleTheme } = useApp();
  const { user, profile, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/templates', label: t.nav.templates },
    { href: '/builder', label: t.nav.builder },
    { href: '/jobs', label: t.nav.jobs },
    { href: '/letters', label: t.nav.letters },
  ];

  const languages: { code: LanguageCode; label: string; natives: string }[] = [
    { code: 'en', label: 'English', natives: 'EN' },
    { code: 'om', label: 'Afaan Oromo', natives: 'OM' },
    { code: 'am', label: 'አማርኛ', natives: 'አማ' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const displayName =
    profile?.fullName?.trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'My Account';

  const userInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
  };

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-full text-[13.5px] font-medium transition-colors ${
      pathname === href
        ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--brand-mist)] dark:hover:text-zinc-100'
    }`;

  return (
    <>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <nav className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] backdrop-blur-md">
        <div className="max-w-[1120px] mx-auto px-5">
          <div className="flex items-center justify-between h-[68px]">
            <Logo size="md" showBadge={false} asLink={true} />

            <div className="hidden lg:flex items-center gap-0.5">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-2 py-1 rounded-full border border-[var(--line)] bg-white dark:bg-zinc-900 text-[var(--ink)] text-xs font-semibold hover:border-[var(--brand)]/30 transition-all cursor-pointer"
                    aria-expanded={userMenuOpen}
                    aria-label="User account menu"
                  >
                    <span className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[10px] font-bold">
                      {userInitial}
                    </span>
                    <span className="hidden sm:inline max-w-[110px] truncate">{displayName}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-[var(--line)] py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-[var(--line)]">
                        <p className="text-xs font-bold text-[var(--ink)] truncate">{displayName}</p>
                        <p className="text-[11px] text-[var(--muted)] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--brand-mist)]"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/profile#saved-cvs"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--brand-mist)]"
                      >
                        Saved CVs
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full border border-[var(--line)] text-[13px] font-semibold text-[var(--ink)] hover:border-[var(--brand)]/30 cursor-pointer"
                >
                  Sign in
                </button>
              )}

              <Link
                href="/builder"
                className="hidden md:inline-flex px-3.5 py-1.5 rounded-full bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-deep)]"
              >
                Open CV Studio
              </Link>

              <select
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="px-2 py-1.5 rounded-full border border-[var(--line)] text-xs bg-white dark:bg-zinc-900 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.natives}
                  </option>
                ))}
              </select>

              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-full border border-[var(--line)] hover:bg-[var(--brand-mist)] transition-colors"
              >
                {theme === 'light' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className="lg:hidden p-2 rounded-full border border-[var(--line)]"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeWidth={1.8} d="M6 6l12 12M18 6L6 18" />
                  ) : (
                    <path strokeLinecap="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="lg:hidden pb-4 flex flex-col gap-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
              {!user && (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="mt-2 px-3 py-2 rounded-full bg-[var(--brand)] text-white text-sm font-semibold"
                >
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
