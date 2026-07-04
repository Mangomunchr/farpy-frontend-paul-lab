"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fy-header fy-shell site-nav${scrolled ? " is-scrolled" : ""}`} id="nav">
      <div className="site-nav-inner">
        <Link className="fy-wordmark" href="/" aria-label="Farpy home" prefetch={false}>
          <span>{"\u{1F439} Farpy"}</span>
        </Link>
        <nav className="fy-header__nav site-nav-links" aria-label="Primary">
          <Link className="pj-btn pj-btn--tertiary" href="/pricing" prefetch={false}>Pricing</Link>
          <Link className="pj-btn pj-btn--tertiary" href="/addon" prefetch={false}>Add-on</Link>
          <Link className="pj-btn pj-btn--tertiary" href="/api" prefetch={false}>API</Link>
          <Link className="pj-btn pj-btn--tertiary" href="/account" prefetch={false}>Account</Link>
          <Link className="pj-btn pj-btn--tertiary" href="/topup" prefetch={false}>TopUp</Link>
          <Link className="pj-btn pj-btn--tertiary" href="/workspace" prefetch={false}>Workspace</Link>
        </nav>
        <div className="fy-header__nav site-nav-cta">
          <Link className="pj-btn pj-btn--blue" href="/#start" prefetch={false}>
            Send package
          </Link>
        </div>
      </div>
    </header>
  );
}

