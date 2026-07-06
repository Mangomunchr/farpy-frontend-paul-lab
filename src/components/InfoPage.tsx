import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export type InfoSection = {
  id?: string;
  heading: string;
  body?: string;
  items?: string[];
  /** Consecutive card sections render together in a two-column card grid. */
  card?: boolean;
};

type InfoPageProps = {
  eyebrow: string;
  title: string;
  updated?: string;
  lede: string;
  sections: InfoSection[];
  toc?: boolean;
};

export default function InfoPage({ eyebrow, title, updated, lede, sections, toc = true }: InfoPageProps) {
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

            {toc ? (
              <nav className="legal-toc" aria-label="On this page">
                {sections.map((section) => (
                  <a key={section.id ?? section.heading} href={`#${section.id ?? slugify(section.heading)}`}>
                    {section.heading}
                  </a>
                ))}
              </nav>
            ) : null}

            <div className="legal-body">
              {groupSections(sections).map((block, index) =>
                Array.isArray(block) ? (
                  <div className="legal-card-grid" key={`cards-${index}`}>
                    {block.map((section) => {
                      const id = section.id ?? slugify(section.heading);
                      return (
                        <section key={id} id={id} className="legal-section pj-card legal-card">
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
                ) : (
                  (() => {
                    const id = block.id ?? slugify(block.heading);
                    return (
                      <section key={id} id={id} className="legal-section">
                        <h2>{block.heading}</h2>
                        {block.body ? <p>{block.body}</p> : null}
                        {block.items ? (
                          <ul>
                            {block.items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                    );
                  })()
                ),
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function groupSections(sections: InfoSection[]): (InfoSection | InfoSection[])[] {
  const blocks: (InfoSection | InfoSection[])[] = [];
  for (const section of sections) {
    if (section.card) {
      const last = blocks[blocks.length - 1];
      if (Array.isArray(last)) last.push(section);
      else blocks.push([section]);
    } else {
      blocks.push(section);
    }
  }
  return blocks;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
