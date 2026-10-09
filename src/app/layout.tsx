import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import AppProviders from "@/components/providers/AppProviders";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s - ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: ["fr_FR"],
    url: siteConfig.url,
    siteName: `${siteConfig.author} - Portfolio`,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

/** Runs before first paint — no flash, no hydration mismatch. ASCII only. */
const BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var l=null;try{l=localStorage.getItem('budi-lang')}catch(e){}if(l!=='en'&&l!=='fr'){try{var m=document.cookie.match(/(?:^|; )budi-lang=(en|fr)/);if(m){l=m[1]}}catch(e){}}if(l!=='en'&&l!=='fr'){l='en'}d.setAttribute('lang',l)}catch(e){}})();`;

/**
 * LAYER 4 — loader failsafe, zero framework dependency. If Next.js JS itself
  * fails after first paint (stale/corrupt cached chunk, blocked CDN, killed
  * tab restore), this plain timer still releases any stuck loading curtain
  * and restores scrolling. Normal flow finishes in ~3s; this fires at 9s
  * only when everything else already died.
  */
 const FAILSAFE_SCRIPT = `window.setTimeout(function(){try{var l=document.querySelector('[data-loader-root]');if(l&&!l.getAttribute('data-loader-released')){l.style.cssText+=';opacity:0!important;visibility:hidden!important;pointer-events:none!important';l.setAttribute('data-loader-released','1');}document.body.style.overflow='';}catch(e){}},9000);`;

 /**
  * If a Next.js chunk or stylesheet 404s (stale cached HTML after a redeploy)
  * or a chunk throws on execute, reload exactly once to fetch fresh assets —
  * the self-healing counterpart to the no-cache header in next.config.
  */
  const RECOVERY_SCRIPT = `(function(){try{window.addEventListener('error',function(e){try{var t=e&&e.target;var res=t&&t!==window&&(t.tagName==='SCRIPT'||t.tagName==='LINK');if(res){var u=t.src||t.href||'';if(u.indexOf('/_next/')<0)return}else{var m=(e&&e.message)||'';if(!/chunk|stylesheet/i.test(m))return}var l=document.querySelector('[data-loader-root]');if(l){l.style.cssText+=';opacity:0!important;visibility:hidden!important';l.setAttribute('data-loader-released','1')}document.body.style.overflow='';if(sessionStorage.getItem('budi-recovered'))return;sessionStorage.setItem('budi-recovered','1');window.location.reload()}catch(_){}} ,true);setTimeout(function(){try{sessionStorage.removeItem('budi-recovered')}catch(_){}},60000)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  // suppressHydrationWarning below: the boot script sets lang
  // pre-hydration on purpose — React must not warn about that diff.
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      {/* Boot runs synchronously as the first body node — valid HTML, runs
          before hydration, so theme + language apply with zero flash. */}
      <body className="bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: FAILSAFE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: RECOVERY_SCRIPT }} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
