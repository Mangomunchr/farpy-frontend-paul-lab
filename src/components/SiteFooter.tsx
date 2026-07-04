const LINKS = [
  { label: "Booth", href: "/booth" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Docs", href: "/docs" },
  { label: "Downloads", href: "/downloads" },
  { label: "Proof", href: "/proof" },
  { label: "Showcase", href: "/showcase" },
  { label: "Files", href: "/files" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refunds", href: "/refunds" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "DMCA", href: "/dmca" },
  { label: "Security", href: "/security" },
  { label: "Contact", href: "/contact" },
  { label: "Status", href: "/status" },
  { label: "API", href: "/api" },
  { label: "Add-on", href: "/addon" },
];

export default function SiteFooter() {
  return (
    <footer className="fy-shell fy-footer">
      <span>(c) {new Date().getFullYear()} Farpy - Blender + Octane renders, pay by frame.</span>
      <nav aria-label="Footer">
        {LINKS.map((it) => (
          <a href={it.href} key={it.label}>
            {it.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}


