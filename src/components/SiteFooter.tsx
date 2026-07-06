const GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Add-on", href: "/addon" },
      { label: "API", href: "/api" },
      { label: "Downloads", href: "/downloads" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Account", href: "/account" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Privacy", href: "/terms" },
      { label: "Refunds", href: "/refunds" },
      { label: "Acceptable Use", href: "/acceptable-use" },
      { label: "DMCA", href: "/dmca" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="fy-shell fy-footer">
      <div className="fy-footer__grid">
        <div className="fy-footer__brand">
          <span className="fy-footer__wordmark">Farpy</span>
          <p className="fy-footer__tagline">
            Blender + Octane renders, pay by frame.
          </p>
        </div>
        <nav className="fy-footer__cols" aria-label="Footer">
          {GROUPS.map((group) => (
            <div className="fy-footer__col" key={group.title}>
              <span className="fy-footer__heading">{group.title}</span>
              <ul className="fy-footer__list">
                {group.links.map((it) => (
                  <li key={it.label}>
                    <a href={it.href}>{it.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="fy-footer__copyright">
        (c) {new Date().getFullYear()} Farpy. All rights reserved.
      </p>
    </footer>
  );
}
