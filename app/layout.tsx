import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cross-Team Launch Coordinator",
  description:
    "Concept prototype: a multi-agent coordinator that checks a launch request against Finance, People, and Product before it ships.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
