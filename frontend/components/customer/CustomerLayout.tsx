"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { settingsApi } from "@/services/api";
import { Settings } from "@/types";
import { MessageCircle } from "lucide-react";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | undefined>(undefined);

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => setSettings(res.data))
      .catch(() => {});
  }, []);

  const waUrl = settings?.whatsapp_number 
    ? `https://wa.me/${settings.whatsapp_number}`
    : "https://wa.me/917396896009";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      <Navbar />
      <main className="flex-1 pt-[132px] md:pt-[72px]">{children}</main>
      <Footer settings={settings} />

      {/* Global WhatsApp FAB */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 bg-green-500 text-white p-3.5 sm:p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-green-600 hover:-translate-y-1 transition-all z-50 group flex items-center justify-center print:hidden"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        {/* Tooltip for desktop */}
        <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block pointer-events-none">
          Need Help? Chat with us
        </span>
      </a>
    </div>
  );
}

