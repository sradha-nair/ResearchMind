import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResearchMind AI — Multi-Agent Research Intelligence",
  description:
    "Four specialized AI agents collaborate in real time to research any topic, analyze findings, challenge assumptions, and deliver a polished research report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
