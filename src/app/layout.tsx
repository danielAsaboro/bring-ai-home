import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Closet",
  description: "A private fashion feed built from the clothes you own.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
