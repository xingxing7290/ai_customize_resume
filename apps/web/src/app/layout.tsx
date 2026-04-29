import type { Metadata } from "next";
import { cookies } from 'next/headers';
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = cookieStore.get('appLanguage')?.value === 'en' ? 'en' : 'zh';
  return {
    title: language === 'en' ? 'AI Resume Studio' : 'AI简历定制平台',
    description: language === 'en' ? 'Intelligently generate tailored resumes for specific job positions' : '智能生成针对特定岗位的定制简历',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language = cookieStore.get('appLanguage')?.value === 'en' ? 'en' : 'zh';
  return (
    <html lang={language === 'en' ? 'en' : 'zh-CN'} className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}