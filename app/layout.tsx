import type { Metadata } from "next";
import { Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const frankRuhl = Frank_Ruhl_Libre({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["hebrew", "latin"],
  variable: "--font-frank",
});

export const metadata: Metadata = {
  title: "עיתון הזמן",
  description: "מגזין היסטוריה לתלמידי תיכון",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${frankRuhl.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
