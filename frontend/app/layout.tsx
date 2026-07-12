import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HarishFresh – Fresh Vegetables, Fruits & More",
  description:
    "Order fresh vegetables, fruits, dry fruits, and millets online. Free local delivery available. Bulk orders accepted.",
  keywords: "fresh vegetables, fruits, dry fruits, millets, online grocery, HarishFresh",
  openGraph: {
    title: "HarishFresh",
    description: "Fresh groceries delivered to your door",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "10px",
              background: "#1a1a1a",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
