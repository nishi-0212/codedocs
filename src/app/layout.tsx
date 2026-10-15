import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "CodeDocs - Technical documentation from code",
  description:
    "Paste code in any language and get clear, structured technical documentation in seconds. READMEs, API references, docstrings and architecture overviews.",
};

export const viewport: Viewport = {
  themeColor: "#0f1011",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `try{var t=localStorage.getItem('cd-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
