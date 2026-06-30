"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Boxes,
  LayoutGrid,
  ShoppingCart,
  Users,
  Newspaper,
  MessageSquareQuote,
  Images,
  Ticket,
  BadgePercent,
  Disc3,
  Gem,
  Share2,
  Star,
  Mail,
  MessageCircle,
  Truck,
  Settings,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cms", label: "Homepage", icon: LayoutTemplate },
  { href: "/products", label: "Products", icon: Package },
  { href: "/bundles", label: "Bundles", icon: Boxes },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/blogs", label: "Blogs", icon: Newspaper },
  { href: "/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/media", label: "Media", icon: Images },
  { href: "/coupons", label: "Coupons", icon: Ticket },
  { href: "/special-coupons", label: "Special Coupons", icon: BadgePercent },
  { href: "/spin-wheel", label: "Spin Wheel", icon: Disc3 },
  { href: "/loyalty", label: "Loyalty", icon: Gem },
  { href: "/referrals", label: "Referrals", icon: Share2 },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/newsletter", label: "Newsletter", icon: Mail },
  { href: "/whatsapp-automation", label: "WhatsApp Automation", icon: MessageCircle },
  { href: "/shipping", label: "Shipping", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/developer-options", label: "Developer Options", icon: Terminal },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // restore persisted desktop collapse state
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-zinc-200 bg-white transition-all duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "lg:w-60"}`}
      >
        {/* Header: logo (expanded) / monogram (collapsed on desktop) */}
        <div
          className={`flex h-14 items-center justify-between border-b border-zinc-200 ${
            collapsed ? "px-3 lg:justify-center lg:px-0" : "px-4"
          }`}
        >
          {/* Full wordmark — always on mobile, only when expanded on desktop */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`flex items-center ${collapsed ? "lg:hidden" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Cleanse"
              className="h-7 w-auto brightness-0"
            />
          </Link>

          {/* Monogram — desktop collapsed only */}
          {collapsed && (
            <Link
              href="/dashboard"
              onClick={onClose}
              className="hidden lg:flex"
              aria-label="Cleanse"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cleanse-monogram.svg"
                alt="Cleanse"
                className="h-8 w-8 brightness-0"
              />
            </Link>
          )}

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop collapse / expand toggle (floating on the right edge) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-[3.25rem] -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:text-zinc-900 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>

        <nav
          className={`flex-1 overflow-y-auto py-4 ${
            collapsed ? "px-2 lg:px-2.5" : "px-3"
          }`}
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href} className="group relative">
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`flex items-center rounded-lg py-2 text-sm transition-colors ${
                      collapsed
                        ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0"
                        : "gap-3 px-3"
                    } ${
                      active
                        ? "bg-zinc-900 font-medium text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                    <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
                  </Link>

                  {/* Tooltip — desktop, collapsed only */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 lg:block">
                      {label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
