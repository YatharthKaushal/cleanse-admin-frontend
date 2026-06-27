"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CubeIcon,
  LayersIcon,
  ArchiveIcon,
  PersonIcon,
  FileTextIcon,
  ScissorsIcon,
  GearIcon,
  Cross1Icon,
  ChatBubbleIcon,
  RocketIcon,
  MixIcon,
  BarChartIcon,
  DesktopIcon,
  UpdateIcon,
  StarIcon,
  EnvelopeClosedIcon,
  HeartIcon,
  Share1Icon,
  ImageIcon,
  ChatBubbleIcon as CommentIcon,
} from "@radix-ui/react-icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChartIcon },
  { href: "/cms", label: "Homepage", icon: DesktopIcon },
  { href: "/products", label: "Products", icon: CubeIcon },
  { href: "/bundles", label: "Bundles", icon: MixIcon },
  { href: "/categories", label: "Categories", icon: LayersIcon },
  { href: "/orders", label: "Orders", icon: ArchiveIcon },
  { href: "/customers", label: "Customers", icon: PersonIcon },
  { href: "/blogs", label: "Blogs", icon: FileTextIcon },
  { href: "/testimonials", label: "Testimonials", icon: ChatBubbleIcon },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/coupons", label: "Coupons", icon: ScissorsIcon },
  { href: "/special-coupons", label: "Special Coupons", icon: StarIcon },
  { href: "/spin-wheel", label: "Spin Wheel", icon: UpdateIcon },
  { href: "/loyalty", label: "Loyalty", icon: HeartIcon },
  { href: "/referrals", label: "Referrals", icon: Share1Icon },
  { href: "/reviews", label: "Reviews", icon: CommentIcon },
  { href: "/newsletter", label: "Newsletter", icon: EnvelopeClosedIcon },
  { href: "/whatsapp-automation", label: "WhatsApp Automation", icon: ChatBubbleIcon },
  { href: "/shipping", label: "Shipping", icon: RocketIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

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
        className={`fixed top-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-zinc-200 bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
          <span className="text-base font-semibold text-zinc-900">
            Cleanse
          </span>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 lg:hidden"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-l-2 border-zinc-900 bg-zinc-100 font-medium text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
