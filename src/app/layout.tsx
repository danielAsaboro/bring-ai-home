import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deck",
  description: "Build an argument as a playable set of cards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
