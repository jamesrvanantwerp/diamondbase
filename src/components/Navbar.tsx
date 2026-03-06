"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Diamond, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book a Cage" },
  { href: "/dashboard", label: "My Dashboard" },
  { href: "/leagues", label: "HitTrax" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, member, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Diamond className="h-7 w-7 text-blue-400" />
            <span className="text-white font-bold text-xl tracking-tight">
              Diamond<span className="text-blue-400">Base</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}>
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xs font-semibold leading-tight">{member?.name ?? user.email}</p>
                    <p className="text-gray-400 text-[10px] leading-tight">{member?.tier ?? "Silver"} Member</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}>
              Admin
            </Link>
          )}
          {user ? (
            <button onClick={handleSignOut} className="text-left px-4 py-2 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-gray-800 flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
