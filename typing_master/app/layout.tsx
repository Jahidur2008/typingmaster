import type { Metadata } from "next";
import {
  Fira_Code,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Bengali,
  Roboto_Mono,
} from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/settings-provider";
import { AuthProvider } from "@/lib/auth-context";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";
import {
  FONT_OPTIONS,
  PALETTE_VARS,
  PRESETS,
} from "@/lib/theme/presets";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-noto-bengali",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Typing Master — Test, practice and master your typing",
    template: "%s — Typing Master",
  },
  description:
    "A minimal, distraction-free typing tutor. Take tests, practice drills, learn Bengali & English layouts, compete live and climb the leaderboard.",
  keywords: [
    "typing test",
    "typing speed",
    "wpm test",
    "monkeytype",
    "bengali typing",
    "avro typing",
    "touch typing",
    "typing practice",
    "typing master",
    "speed typing",
  ],
  authors: [{ name: "Typing Master Team" }],
  creator: "Typing Master",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Typing Master",
    title: "Typing Master — Distraction-Free Typing Tutor",
    description:
      "A minimal, distraction-free typing tutor. Take tests, practice drills, learn Bengali & English layouts, compete live and climb the leaderboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Master — Distraction-Free Typing Tutor",
    description:
      "Minimalist typing tutor with real-time analytics, live multiplayer competitions, and Bengali typing support.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Applied before paint so persisted settings (theme mode, palette,
 * typing font) never flash. Mirrors applySettingsToDOM() from the
 * settings store against the zustand-persist JSON in "tm-settings".
 * Falls back to the legacy "tm-theme" key for the base dark/light mode.
 */
const themeScript = `(function(){try{
var d={presets:${JSON.stringify(Object.fromEntries(Object.entries(PRESETS).map(([id, p]) => [id, { dark: p.dark, light: p.light }])))},fonts:${JSON.stringify(Object.fromEntries(Object.entries(FONT_OPTIONS).map(([id, f]) => [id, f.stack])))},vars:${JSON.stringify(PALETTE_VARS)}};
var raw=localStorage.getItem("tm-settings");
var st=raw?((JSON.parse(raw)||{}).state||{}):{};
var r=document.documentElement,s=r.style;
if(st.themeMode==="light"){r.dataset.theme="light"}
else if(!st.themeMode){try{if(localStorage.getItem("tm-theme")==="light")r.dataset.theme="light"}catch(e){}}
var pal=st.themeSource==="custom"?st.customColors:(st.themeSource==="preset"&&st.presetId!=="default"?(d.presets[st.presetId]||{})[st.themeMode||"dark"]:null);
if(pal){for(var k in d.vars){if(pal[k])s.setProperty(d.vars[k],pal[k]);else s.removeProperty(d.vars[k])}}
var f=st.fontFamily?d.fonts[st.fontFamily]:null;
if(f)s.setProperty("--typing-font-family",f);
if(st.fontSize)s.setProperty("--typing-font-size",st.fontSize+"px");
if(st.lineHeight)s.setProperty("--typing-line-height",String(st.lineHeight));
var mc=(pal&&pal.main)?pal.main:(st.themeMode==="light"?"#d09b00":"#e2b714");
var bc=(pal&&pal.bg)?pal.bg:(st.themeMode==="light"?"#f1efe9":"#323437");
try{
  var cv=document.createElement("canvas");
  cv.width=64;cv.height=64;
  var cx=cv.getContext("2d");
  if(cx){
    cx.fillStyle=mc;cx.beginPath();
    if(cx.roundRect)cx.roundRect(0,0,64,64,14);else cx.rect(0,0,64,64);
    cx.fill();
    cx.strokeStyle=bc;cx.lineWidth=4.5;cx.lineCap="round";cx.lineJoin="round";
    cx.beginPath();
    if(cx.roundRect)cx.roundRect(10,14,44,36,6);else cx.rect(10,14,44,36);
    cx.stroke();
    cx.fillStyle=bc;
    [18,27,36,45].forEach(function(x){cx.beginPath();cx.arc(x,24,2.5,0,Math.PI*2);cx.fill()});
    [22.5,31.5,40.5].forEach(function(x){cx.beginPath();cx.arc(x,33,2.5,0,Math.PI*2);cx.fill()});
    cx.beginPath();cx.moveTo(20,42);cx.lineTo(44,42);cx.stroke();
    var pUrl=cv.toDataURL("image/png");
    var el=document.getElementById("tm-dynamic-favicon");
    if(el)el.remove();
    var nl=document.createElement("link");
    nl.id="tm-dynamic-favicon";
    nl.rel="icon";
    nl.type="image/png";
    nl.sizes="64x64";
    nl.href=pUrl;
    document.head.appendChild(nl);
  }
}catch(err){}
}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${robotoMono.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-main focus:text-bg focus:font-mono focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-text transition-all"
        >
          Skip to content
        </a>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SettingsProvider>
          <DynamicFavicon />
          <AuthProvider>
            <MaintenanceGate>
              <Navbar />
              <main id="main-content" className="flex-1 focus:outline-none">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </MaintenanceGate>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
