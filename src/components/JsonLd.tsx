// Renders a JSON-LD structured-data block. Server component — the script ships
// in the initial HTML so crawlers and AI engines read it without running JS.
//
// We stringify ourselves and escape `<` to `<` so a value can never break
// out of the <script> element (the one real XSS vector for inline JSON-LD).
export default function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // Structured data is intentionally raw JSON, not React-rendered.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
