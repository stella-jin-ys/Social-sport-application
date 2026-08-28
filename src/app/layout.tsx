import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Group Sport",
  description: "Find your next sports group.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: ReactNode; modal: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
