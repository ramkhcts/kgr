import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KGR iDemand Portal",
  description: "KGR End User Services — Project Intake & Fulfillment Portal for KarthikLLC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
