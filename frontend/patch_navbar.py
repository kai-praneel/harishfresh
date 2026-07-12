import re
import os

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/frontend/components/customer/Navbar.tsx"
with open(file_path, "r") as f:
    content = f.read()

old_links = """  const links = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Categories" },
    { href: "/search", label: "Products" },
  ];"""

new_links = """  const links = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Categories" },
    { href: "/search", label: "Products" },
    { href: "/track", label: "Track Order" },
    { href: "/#contact", label: "Contact Us" },
  ];"""

if old_links in content:
    content = content.replace(old_links, new_links)

old_desktop = """          {/* Desktop Search Pill & Nav */}
          {pathname !== "/search" && (
            <div className="hidden md:flex flex-1 items-center justify-center px-8">
              <Link 
                href="/search"
                className="flex items-center gap-3 bg-gray-50 hover:bg-white text-gray-500 w-full max-w-xl px-5 py-3 rounded-2xl transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300"
              >
                <Search className="w-5 h-5 text-green-700" />
                <span className="text-[15px] font-medium text-gray-500">Search for "tomatoes", "mangoes", "milk"...</span>
              </Link>
            </div>
          )}"""

new_desktop = """          {/* Desktop Search Pill & Nav */}
          <div className="hidden md:flex flex-1 items-center justify-center px-6">
            {pathname !== "/search" && (
              <Link 
                href="/search"
                className="flex items-center gap-3 bg-gray-50 hover:bg-white text-gray-500 w-full max-w-md px-5 py-2.5 rounded-2xl transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 mr-6"
              >
                <Search className="w-5 h-5 text-green-700" />
                <span className="text-[14px] font-medium text-gray-500 truncate">Search for "tomatoes"...</span>
              </Link>
            )}
            <div className="flex items-center gap-6">
              <Link href="/track" className="text-sm font-bold text-gray-600 hover:text-green-700 transition-colors">
                Track Order
              </Link>
              <Link href="/#contact" className="text-sm font-bold text-gray-600 hover:text-green-700 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>"""

if old_desktop in content:
    content = content.replace(old_desktop, new_desktop)

with open(file_path, "w") as f:
    f.write(content)

print("Navbar patched successfully")
