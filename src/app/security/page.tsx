import type { Metadata } from "next";
import SecurityCertificate from "@/components/security/SecurityCertificate";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Security Certificate",
  description:
    "Live security certificate — HTTPS/TLS, HSTS, CSP, rate limits, SSRF and path-traversal guards, plus SPF/DMARC email hardening, all measured on the running server.",
  alternates: { canonical: `${siteConfig.url}/security` },
  robots: { index: true, follow: true },
};

export default function SecurityPage(): React.JSX.Element {
  return <SecurityCertificate />;
}
