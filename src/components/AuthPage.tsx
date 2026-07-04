"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSyncExternalStore } from "react";
import SiteNav from "@/components/SiteNav";

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
            Continue with Google
          </a>

          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>
          <h2 className="fy-auth__title">Email sign-in</h2>
          <p className="fy-auth__sub">Enter your email and we will send a one-time sign-in link.</p>
          <form className="auth-form" onSubmit={submit}>
            <input
              className="auth-input"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button className="pj-btn pj-btn--blue fy-btn--block auth-submit" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send sign-in link"}
            </button>
          </form>
          {message ? (
            <p className={status === "error" ? "auth-err" : "fy-auth__sub"} role="status">
              {message}
            </p>
          ) : null}
          <Link className="pj-btn fy-btn--block" href="/#start" prefetch={false}>
            Send package
          </Link>
        </div>
      </main>
    </>
  );
}


