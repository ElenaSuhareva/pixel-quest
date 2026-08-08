import "./globals.css";
import "@/styles/home.css";
import { Pixelify_Sans } from "next/font/google";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Pixel Quest",
  description: "Учебные мини-игры по русскому языку",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={pixelify.className}>
      <body>{children}</body>
    </html>
  );
}
