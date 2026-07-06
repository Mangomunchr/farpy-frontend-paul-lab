"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSyncExternalStore } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

type Mode = "signin" | "signup";

const readNext = () => {
  const q = new URLSearchParams(window.location.search).get("next");
  return q && q.startsWith("/") ? q : "/account";
};
const subscribe = () => () => {};

export default function AuthPage({ mode }: { mode: Mode }) {
  const next = useSyncExternalStore(subscribe, readNext, () => "/account");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const googleHref = `/auth/google?next=${encodeURIComponent(next)}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const res = await fetch("/v1/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, next }),
    }).catch(() => null);
    if (res?.ok) {
      setStatus("sent");
      setMessage("Check your email for a Farpy sign-in link.");
      return;
    }
    setStatus("error");
    setMessage("Could not send the sign-in link. Try again in a minute.");
  };

  return (
    <>
      <SiteNav />
      <main className="fy-shell signin-simple signin-compact">
        <div className="render-flow-head">
          <h1>{mode === "signup" ? "Create account" : "Sign in"}</h1>
          <p>Accounts are required for stored balances.</p>
        </div>

        <div className="fy-auth__card">
          <a className="pj-btn fy-btn--block btn-oauth" href={googleHref}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z" />
              <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z" />
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
            </svg>
            Continue with Google
          </a>

          <div className="fy-auth__divider" aria-hidden="true">
            <span>or</span>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p className="fy-auth__sub">We will email you a one-time sign-in link. No password needed.</p>
            <button className="pj-btn pj-btn--blue fy-btn--block auth-submit" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : mode === "signup" ? "Send sign-up link" : "Send sign-in link"}
            </button>
          </form>
          {message ? (
            <p className={status === "error" ? "auth-err" : "fy-auth__sub"} role="status">
              {message}
            </p>
          ) : null}
          <p className="fy-auth__foot">
            {mode === "signup" ? (
              <>
                Already have an account? <Link href="/signin">Sign in</Link>
              </>
            ) : (
              <>
                New to Farpy? <Link href="/signup">Create account</Link>
              </>
            )}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}


