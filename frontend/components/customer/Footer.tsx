import Link from "next/link";
import { Phone, MapPin, MessageCircle } from "lucide-react";

interface FooterProps {
  settings?: {
    store_name: string;
    store_address: string;
    whatsapp_number: string;
    gmaps_link?: string;
    store_latitude?: number;
    store_longitude?: number;
  };
}

export default function Footer({ settings }: FooterProps) {
  const waUrl = `https://wa.me/${settings?.whatsapp_number || "917396896009"}`;

  return (
    <footer className="bg-green-900 text-green-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="HarishFresh Logo"
                className="w-9 h-9 object-contain rounded-lg"
              />
              <span className="font-display text-xl font-bold text-white">
                {settings?.store_name || "HarishFresh"}
              </span>
            </div>
            <p className="text-green-300 text-sm leading-relaxed">
              Your trusted source for fresh vegetables, fruits, dry fruits, and millets.
              Farm fresh, delivered daily.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/search", label: "All Products" },
                { href: "/cart", label: "Cart" },
                { href: "/category/vegetables", label: "Vegetables" },
                { href: "/category/fruits", label: "Fruits" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-green-300 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <div className="space-y-3">
              {settings?.store_address && (
                <div className="flex gap-2 text-green-300 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>{settings.store_address}</span>
                    <br />
                    <a
                      href={
                        settings?.gmaps_link || (settings?.store_latitude && settings?.store_longitude
                          ? `https://www.google.com/maps/search/?api=1&query=${settings.store_latitude},${settings.store_longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.store_address)}`)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-green-200 hover:underline text-xs inline-flex items-center gap-0.5 mt-1 font-medium"
                    >
                      View Location →
                    </a>
                  </div>
                </div>
              )}
              {settings?.whatsapp_number && (
                <div className="flex gap-2 text-green-300 text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>+{settings.whatsapp_number}</span>
                </div>
              )}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors mt-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-green-800 pt-6 text-center">
          <p className="text-green-400 text-sm">
            © {new Date().getFullYear()} {settings?.store_name || "HarishFresh"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
