"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Scroll-reveal director.
//
// The inline boot script in layout.tsx already added `reveals-on` to <html>,
// but only when motion is allowed AND IntersectionObserver exists, so the
// hidden state never traps content for no-JS or reduced-motion users — they
// see everything by default. Here we:
//   1. stagger grouped reveals by assigning --reveal-delay per child,
//   2. observe every [data-reveal] and add .is-in once it scrolls into view
//      (one-shot — we never re-hide on scroll up, which feels broken),
//   3. drive a cheap, rAF-throttled parallax on the hero grid for depth.
//
// This lives in the root layout, so it never unmounts across client-side
// navigations. We key the effect on the pathname so that when a page's
// [data-reveal] nodes are torn down and rebuilt (e.g. returning to "/#proof"
// from a proof page), we re-attach the observer to the *fresh* DOM. Without
// this, the new nodes go unobserved, .is-in is never added, and everything
// below the un-gated filmstrip stays stuck at opacity:0.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("reveals-on")) return;

    // 1 — stagger grouped children so a row of steps/cards cascades in.
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
      const step = Number(group.dataset.revealStep ?? 80);
      group
        .querySelectorAll<HTMLElement>(":scope > [data-reveal]")
        .forEach((el, i) => el.style.setProperty("--reveal-delay", `${i * step}ms`));
    });

    // 2 — reveal on intersect, then stop watching.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      // If we land mid-page (a hash deep-link like "/#proof" scrolls past the
      // top), anything already above the viewport would never intersect — so
      // reveal it immediately instead of trapping it hidden. Everything still
      // in or below view is observed and animates in normally.
      if (el.getBoundingClientRect().bottom < 0) {
        el.classList.add("is-in");
      } else {
        io.observe(el);
      }
    });

    // 3 — hero grid parallax. Only computes while the hero is on screen.
    const hero = document.querySelector<HTMLElement>(".hero");
    let raf = 0;
    let onScroll: (() => void) | undefined;
    if (hero) {
      onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const y = window.scrollY;
          if (y < window.innerHeight) hero.style.setProperty("--hero-shift", `${y * 0.11}px`);
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
