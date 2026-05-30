import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "タスクボード",
  description: "みんなのタスク管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-indigo-50 min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
