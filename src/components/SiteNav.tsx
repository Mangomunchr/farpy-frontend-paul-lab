"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Add-on", href: "/addon" },
  { label: "API", href: "/api" },
];

/** Inline hamster mark - replaces the OS-dependent emoji wordmark. */
function FarpyMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="6" r="2.75" />
      <circle cx="17.5" cy="6" r="2.75" />
      <path d="M4.5 13.5a7.5 7.5 0 0 1 15 0c0 4.1-3.36 7-7.5 7s-7.5-2.9-7.5-7Z" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Dev-only preview: matches the /account?demo=1 mockup mode.
const isDemoMode = () =>
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  (/demo/.test(window.location.search) || /demo/.test(window.location.hash));

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      setEmail("demo@farpy.com");
      return;
    }
    const controller = new AbortController();
    fetch("/v1/auth/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { authenticated?: boolean; email?: string | null } | null) => {
        if (json?.authenticated && json.email) setEmail(json.email);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const authEntry = email ? (
    <Link className="pj-btn" href="/account" prefetch={false} title={email}>
      Account
    </Link>
  ) : (
    <Link className="pj-btn" href="/signin" prefetch={false}>
      Log in
    </Link>
  );

  return (
    <header className={`fy-header fy-shell site-nav${scrolled ? " is-scrolled" : ""}`} id="nav">
      <div className="site-nav-inner">
        <Link className="fy-wordmark" href="/" aria-label="Farpy home" prefetch={false}>
          <FarpyMark />
          <span>Farpy</span>
        </Link>
        <nav className="fy-header__nav site-nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link className="pj-btn pj-btn--tertiary" href={link.href} prefetch={false} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="fy-header__nav site-nav-cta">
          {authEntry}
          <Link className="pj-btn pj-btn--blue" href="/#start" prefetch={false}>
            Send package
          </Link>
          <button
            className="site-nav-menu-btn"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (
                <>
                  <path d="m6 6 12 12" />
                  <path d="m18 6-12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="site-nav-mobile" aria-label="Primary mobile">
          {NAV_LINKS.map((link) => (
            <Link href={link.href} prefetch={false} key={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {email ? (
            <Link href="/account" prefetch={false} onClick={() => setMenuOpen(false)}>
              Account
            </Link>
          ) : (
            <Link href="/signin" prefetch={false} onClick={() => setMenuOpen(false)}>
              Log in
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
