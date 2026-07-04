import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export type InfoSection = {
  id?: string;
  heading: string;
  body?: string;
  items?: string[];
};

type InfoPageProps = {
  eyebrow: string;
  title: string;
  updated?: string;
  lede: string;
  sections: InfoSection[];
};

export default function InfoPage({ eyebrow, title, updated, lede, sections }: InfoPageProps) {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">{eyebrow}</p>
              <h1 className="legal-title">{title}</h1>
              {updated ? <p className="legal-updated">Last updated {updated}</p> : null}
              <p className="legal-lede">{lede}</p>
            </header>

            <nav className="legal-toc" aria-label="On this page">
              {sections.map((section) => (
                <a key={section.id ?? section.heading} href={`#${section.id ?? slugify(section.heading)}`}>
                  {section.heading}
                </a>
              ))}
            </nav>

            <div className="legal-body">
              {sections.map((section) => {
                const id = section.id ?? slugify(section.heading);
                return (
                  <section key={id} id={id} className="legal-section">
                    <h2>{section.heading}</h2>
                    {section.body ? <p>{section.body}</p> : null}
                    {section.items ? (
                      <ul>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
