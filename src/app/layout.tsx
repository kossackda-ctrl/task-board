import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import PageNav from "@/components/PageNav";

export const metadata: Metadata = {
  title: "タスクボード",
  description: "みんなのタスク管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-indigo-50 h-screen flex flex-col">
        <AppProvider>
          <PageNav />
          <div className="flex-1 min-h-0 overflow-y-auto">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
