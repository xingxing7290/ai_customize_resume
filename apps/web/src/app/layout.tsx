import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI简历定制平台",
  description: "智能生成针对特定岗位的定制简历",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}