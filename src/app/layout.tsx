import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homebook",
  description: "The living binder for a home.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
