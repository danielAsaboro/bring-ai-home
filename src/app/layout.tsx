import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Replay",
  description: "A tape library for recording, editing, and following repeatable work.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
