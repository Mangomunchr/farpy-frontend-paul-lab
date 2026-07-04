"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WalletBalance = {
  ok?: boolean;
  balance_cents?: number;
  email?: string | null;
  error?: string;
};

const TOPUP_AMOUNTS = [1000, 2500, 5000, 10000];
const BITCOIN_TOPUP_TIERS = [
  { tier: "usd_10", amount_cents: 1000 },
  { tier: "usd_25", amount_cents: 2500 },
  { tier: "usd_50", amount_cents: 5000 },
  { tier: "usd_100", amount_cents: 10000 },
];
const LIGHTNING_TOPUP_TIERS = [
  { tier: "usd_1", amount_cents: 100 },
  { tier: "usd_5", amount_cents: 500 },
  { tier: "usd_10", amount_cents: 1000 },
];
const BITCOIN_INVOICE_ENDPOINT = "/node/v1/web-render/btcpay/bitcoin-invoice";
const LIGHTNING_INVOICE_ENDPOINT = "/node/v1/web-render/btcpay/invoice";
const LIGHTNING_ENABLED = process.env.FARPY_LIGHTNING_ENABLED === "true";

const formatCents = (value?: number | null) => `$${((value || 0) / 100).toFixed(2)}`;

export default function TopUpPage() {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAmount, setBusyAmount] = useState<number | null>(null);
  const [busyBitcoinTier, setBusyBitcoinTier] = useState<string | null>(null);
  const [busyLightningTier, setBusyLightningTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bitcoin" | "lightning">("card");
  const [error, setError] = useState("");

  const refreshBalance = async () => {
    setLoading(true);
    fetch("/v1/wallet/balance", { credentials: "include", cache: "no-store" })
      .then(async (res) => ({ res, json: (await res.json().catch(() => ({}))) as WalletBalance }))
      .then(({ res, json }) => {
        setWallet(res.ok ? json : { error: json.error || `status_${res.status}` });
      })
      .catch(() => setWallet({ error: "wallet_unavailable" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let alive = true;
    fetch("/v1/wallet/balance", { credentials: "include", cache: "no-store" })
      .then(async (res) => ({ res, json: (await res.json().catch(() => ({}))) as WalletBalance }))
      .then(({ res, json }) => {
        if (!alive) return;
        setWallet(res.ok ? json : { error: json.error || `status_${res.status}` });
      })
      .catch(() => alive && setWallet({ error: "wallet_unavailable" }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const startTopup = async (amount_cents: number) => {
    setBusyAmount(amount_cents);
    setError("");
    const res = await fetch("/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount_cents }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { checkout_url?: string; error?: string };
    if (res?.ok && json.checkout_url) {
      window.location.href = json.checkout_url;
      return;
    }
    setBusyAmount(null);
    setError(json.error || "Unable to start checkout.");
  };


  const startBitcoinTopup = async (tier: string) => {
    setBusyBitcoinTier(tier);
    setError("");
    const res = await fetch(BITCOIN_INVOICE_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { checkout_url?: string; error?: string };
    if (res?.ok && json.checkout_url) {
      window.location.href = json.checkout_url;
      return;
    }
    setBusyBitcoinTier(null);
    setError(json.error || "Unable to create Bitcoin invoice.");
  };

  const startLightningTopup = async (tier: string) => {
    setBusyLightningTier(tier);
    setError("");
    const res = await fetch(LIGHTNING_INVOICE_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { checkout_url?: string; error?: string };
    if (res?.ok && json.checkout_url) {
      window.location.href = json.checkout_url;
      return;
    }
    setBusyLightningTier(null);
    setError(json.error || "Unable to create Lightning invoice.");
  };
  const signedIn = wallet?.ok || Number.isInteger(wallet?.balance_cents);

  return (
    <main className="topup render-money-page">
      <section className="wrap render-flow-page money-compact">
        <div className="render-flow-head">
          <h1>Top up wallet</h1>
          <p>Add wallet balance for future render packages. Start with a small package.</p>
        </div>

        <section className="render-job-card" aria-label="Wallet top up">
          {loading ? (
            <p className="render-note">Checking account...</p>
          ) : signedIn ? (
            <>
              <span className="render-label">Current balance</span>
              <strong className="render-price">{formatCents(wallet?.balance_cents)}</strong>
              {wallet?.email ? <p className="fy-auth__sub">{wallet.email}</p> : null}
              <div className="topup-methods" role="tablist" aria-label="Payment method">
                <button
                  className={`topup-method${paymentMethod === "card" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => {
                    setPaymentMethod("card");
                    setError("");
                  }}
                >
                  Card
                </button>
                <button
                  className={`topup-method${paymentMethod === "bitcoin" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => {
                    setPaymentMethod("bitcoin");
                    setError("");
                  }}
                >
                  Bitcoin
                </button>
                {LIGHTNING_ENABLED ? (
                  <button
                    className={`topup-method${paymentMethod === "lightning" ? " is-active" : ""}`}
                    type="button"
                    onClick={() => {
                      setPaymentMethod("lightning");
                      setError("");
                    }}
                  >
                    Bitcoin Lightning
                  </button>
                ) : null}
              </div>

              {LIGHTNING_ENABLED && paymentMethod === "lightning" ? (
                <>
                  <p className="render-note topup-lightning-hold" id="lightning-hold-message">
                    Lightning invoices are created by Farpy and credited to this wallet after BTCPay confirms payment.
                  </p>
                  <div className="topup-amounts">
                    {LIGHTNING_TOPUP_TIERS.map(({ tier, amount_cents }) => (
                      <button
                        key={tier}
                        className="topup-amount"
                        type="button"
                        disabled={busyLightningTier !== null}
                        onClick={() => startLightningTopup(tier)}
                      >
                        <b>{formatCents(amount_cents)}</b>
                        <small>{busyLightningTier === tier ? "Opening BTCPay..." : "Create Lightning invoice"}</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : paymentMethod === "bitcoin" ? (
                <>
                  <p className="render-note topup-lightning-hold">
                    Pay a Bitcoin invoice generated by Farpy. Your wallet is credited after the payment settles.
                  </p>
                  <div className="topup-amounts">
                    {BITCOIN_TOPUP_TIERS.map(({ tier, amount_cents }) => (
                      <button
                        key={tier}
                        className="topup-amount"
                        type="button"
                        disabled={busyBitcoinTier !== null}
                        onClick={() => startBitcoinTopup(tier)}
                      >
                        <b>{formatCents(amount_cents)}</b>
                        <small>{busyBitcoinTier === tier ? "Opening Bitcoin invoice..." : "Create Bitcoin invoice"}</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="topup-amounts">
                  {TOPUP_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      className="topup-amount"
                      type="button"
                      disabled={busyAmount !== null}
                      onClick={() => startTopup(amount)}
                    >
                      <b>{formatCents(amount)}</b>
                      <small>{busyAmount === amount ? "Opening Stripe..." : "Add funds"}</small>
                    </button>
                  ))}
                </div>
              )}
              {error ? <p className="auth-err" role="alert">{error}</p> : null}
              <Link className="acct-receipt-link" href="/account" prefetch={false}>
                Back to Account
              </Link>
            </>
          ) : (
            <>
              <p className="render-note">Sign in to top up your wallet balance for render packages. Best for previews, tests, and short jobs today.</p>
              <p className="render-note">Card and Bitcoin topups are available after sign in.</p>
              <Link className="pj-btn pj-btn--blue fy-start-button" href="/signin?next=/topup" prefetch={false}>
                Sign in
              </Link>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
