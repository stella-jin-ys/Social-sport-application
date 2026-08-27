import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Group Sport",
  description: "Find your next sports group.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
  modal,
}: any) {
  return (
    <html lang="en">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
