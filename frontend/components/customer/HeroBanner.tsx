"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, Truck, ShieldCheck } from "lucide-react";

interface HeroBannerProps {
  settings?: any;
}

export default function HeroBanner({ settings }: HeroBannerProps) {
  return (
    <section className="relative pt-4 pb-4 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#e2f3d3] rounded-[2rem] overflow-hidden relative flex flex-col md:flex-row items-stretch min-h-[450px]">
          
          <div className="relative z-10 flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            {settings?.free_delivery_message && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-[#0f3d20] text-sm font-semibold mb-6 w-fit shadow-sm border border-white/40">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#429522] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#429522]"></span>
                </span>
                {settings.free_delivery_message}
              </div>
            )}
            
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-4">
              <span className="block text-[#0f3d20]">Fresh.</span>
              <span className="block text-[#0f3d20]">Healthy.</span>
              <span className="block text-[#529b27]">Daily.</span>
            </h1>

            <p className="text-gray-700 text-lg sm:text-xl font-medium max-w-sm mb-8">
              Farm fresh groceries delivered to your doorstep.
            </p>

            <div>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-[#429522] hover:bg-[#34781a] text-white font-bold px-8 py-3.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-lg"
              >
                Shop Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-4 sm:gap-6 text-sm font-semibold text-[#0f3d20] flex-wrap">
              <div className="flex items-center gap-2">
                <div className="bg-transparent rounded-full">
                  <Leaf className="w-4 h-4 text-[#429522]" />
                </div>
                100% Fresh
              </div>
              <div className="w-px h-5 bg-black/10 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="bg-transparent rounded-full">
                  <Truck className="w-4 h-4 text-[#429522]" />
                </div>
                Fast Delivery
              </div>
              <div className="w-px h-5 bg-black/10 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="bg-transparent rounded-full">
                  <ShieldCheck className="w-4 h-4 text-[#429522]" />
                </div>
                Safe & Trusted
              </div>
            </div>
          </div>

          <div className="relative w-full md:w-1/2 min-h-[350px] md:min-h-[450px] flex-shrink-0">
            <Image 
              src="/images/hero-basket.png" 
              alt="Fresh vegetables in a basket" 
              fill 
              className="object-cover object-center md:object-right"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
