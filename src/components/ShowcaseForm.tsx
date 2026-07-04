"use client";

import { useMemo, useState } from "react";

const SUPPORT_EMAIL = "support@farpy.com";

type FormState = {
  artistName: string;
  email: string;
  portfolio: string;
  tool: string;
  projectLink: string;
  description: string;
  permission: boolean;
};

const initialState: FormState = {
  artistName: "",
  email: "",
  portfolio: "",
  tool: "Blender",
  projectLink: "",
  description: "",
  permission: false,
};

export default function ShowcaseForm() {
  const [form, setForm] = useState<FormState>(initialState);

  const canSubmit = Boolean(form.artistName.trim() && form.email.trim() && form.permission);

  const mailto = useMemo(() => {
    const subject = "Farpy Showcase submission";
    const body = [
      "Farpy Showcase submission",
      "",
      `Artist name: ${form.artistName}`,
      `Email: ${form.email}`,
      `Portfolio / X / ArtStation: ${form.portfolio}`,
      `Tool used: ${form.tool}`,
      `Project link: ${form.projectLink}`,
      "",
      "Short description:",
      form.description,
      "",
      `Rights confirmation: ${form.permission ? "I confirm I own or have rights to submit this work." : "Not confirmed yet."}`,
    ].join("\n");
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [form]);

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="showcase-form" aria-label="Showcase submission form">
      <div className="showcase-fields">
        <label>
          <span>Artist name</span>
          <input
            value={form.artistName}
            onChange={(event) => update("artistName", event.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          <span>Portfolio / X / ArtStation link</span>
          <input
            type="url"
            value={form.portfolio}
            onChange={(event) => update("portfolio", event.target.value)}
            placeholder="https://"
          />
        </label>
        <label>
          <span>Project link <small>(optional)</small></span>
          <input
            type="url"
            value={form.projectLink}
            onChange={(event) => update("projectLink", event.target.value)}
            placeholder="https://"
          />
        </label>
        <label>
          <span>Tool</span>
          <select value={form.tool} onChange={(event) => update("tool", event.target.value)}>
            <option>Blender</option>
            <option>Octane</option>
            <option>Other</option>
          </select>
        </label>
        <label className="showcase-wide">
          <span>Short description</span>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={5}
          />
        </label>
        <label className="showcase-check showcase-wide">
          <input
            type="checkbox"
            checked={form.permission}
            onChange={(event) => update("permission", event.target.checked)}
          />
          <span>I confirm I own or have rights to submit this work.</span>
        </label>
      </div>

      <div className="showcase-submit">
        <a
          className="pj-btn pj-btn--blue"
          href={canSubmit ? mailto : undefined}
          aria-disabled={!canSubmit}
        >
          Submit your work
        </a>
        <small>Required: artist name, email, and rights confirmation.</small>
      </div>
    </section>
  );
}
