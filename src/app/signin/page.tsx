import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Farpy with an email magic link. Accounts are required for stored balances.",
  alternates: { canonical: "/signin" },
  robots: { index: false, follow: false },
};

export default function SignInRoute() {
  return <AuthPage mode="signin" />;
}
