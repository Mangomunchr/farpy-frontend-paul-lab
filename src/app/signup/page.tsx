import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Farpy account for wallet balance and package history.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

export default function SignUpRoute() {
  return <AuthPage mode="signup" />;
}
