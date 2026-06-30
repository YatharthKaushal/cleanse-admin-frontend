"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  Package,
  ShoppingCart,
  Users,
  Newspaper,
  Boxes,
  LayoutDashboard,
  LayoutTemplate,
  LayoutGrid,
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
  ArrowRight,
} from "lucide-react";
import {
  adminProductApi,
  adminOrderApi,
  adminCustomerApi,
  adminBlogApi,
  adminBundleApi,
} from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { formatPrice } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* All admin destinations — keeps "search anything, go anywhere".      */
/* ------------------------------------------------------------------ */
const PAGES = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "overview sales analytics report home" },
  { label: "Homepage", href: "/cms", icon: LayoutTemplate, keywords: "cms content hero banner landing" },
  { label: "Products", href: "/products", icon: Package, keywords: "catalog items sku inventory stock" },
  { label: "Bundles", href: "/bundles", icon: Boxes, keywords: "combo kit pack set" },
  { label: "Categories", href: "/categories", icon: LayoutGrid, keywords: "collection group tag type" },
  { label: "Orders", href: "/orders", icon: ShoppingCart, keywords: "sales purchases checkout transactions" },
  { label: "Customers", href: "/customers", icon: Users, keywords: "users buyers people accounts" },
  { label: "Blogs", href: "/blogs", icon: Newspaper, keywords: "posts articles journal news" },
  { label: "Testimonials", href: "/testimonials", icon: MessageSquareQuote, keywords: "quotes feedback praise" },
  { label: "Media", href: "/media", icon: Images, keywords: "images files assets gallery uploads" },
  { label: "Coupons", href: "/coupons", icon: Ticket, keywords: "discount promo code voucher offer" },
  { label: "Special Coupons", href: "/special-coupons", icon: BadgePercent, keywords: "discount promo influencer code" },
  { label: "Spin Wheel", href: "/spin-wheel", icon: Disc3, keywords: "game prize lucky draw reward" },
  { label: "Loyalty", href: "/loyalty", icon: Gem, keywords: "points rewards tier membership" },
  { label: "Referrals", href: "/referrals", icon: Share2, keywords: "refer invite affiliate share" },
  { label: "Reviews", href: "/reviews", icon: Star, keywords: "ratings stars feedback product" },
  { label: "Newsletter", href: "/newsletter", icon: Mail, keywords: "email subscribers campaign marketing" },
  { label: "WhatsApp Automation", href: "/whatsapp-automation", icon: MessageCircle, keywords: "messages templates chat notify" },
  { label: "Shipping", href: "/shipping", icon: Truck, keywords: "delivery shiprocket courier rates zones" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "config preferences store account" },
  { label: "Developer Options", href: "/developer-options", icon: Terminal, keywords: "api keys webhooks code integration" },
];

/* Live-data sources — each returns up to 5 matches with a deep link. */
const SOURCES = [
  {
    key: "products",
    group: "Products",
    icon: Package,
    fetch: (q) => adminProductApi.list({ search: q, limit: 5 }),
    href: (it) => `/products/${it._id}`,
    title: (it) => it.name,
    subtitle: (it) =>
      [it.price != null ? formatPrice(it.price) : null,
       it.totalStock != null ? `${it.totalStock} in stock` : null]
        .filter(Boolean)
        .join(" · "),
  },
  {
    key: "orders",
    group: "Orders",
    icon: ShoppingCart,
    fetch: (q) => adminOrderApi.list({ search: q, limit: 5 }),
    href: () => `/orders`,
    title: (it) => it.orderNumber || it._id,
    subtitle: (it) =>
      [it.user?.fullName, it.pricing?.total != null ? formatPrice(it.pricing.total) : null]
        .filter(Boolean)
        .join(" · "),
  },
  {
    key: "customers",
    group: "Customers",
    icon: Users,
    fetch: (q) => adminCustomerApi.list({ search: q, limit: 5 }),
    href: () => `/customers`,
    title: (it) => it.fullName || it.email,
    subtitle: (it) => [it.email, it.phone].filter(Boolean).join(" · "),
  },
  {
    key: "blogs",
    group: "Blogs",
    icon: Newspaper,
    fetch: (q) => adminBlogApi.list({ search: q, limit: 5 }),
    href: (it) => `/blogs/${it._id}`,
    title: (it) => it.title,
    subtitle: (it) => it.status || "Blog post",
  },
  {
    key: "bundles",
    group: "Bundles",
    icon: Boxes,
    fetch: (q) => adminBundleApi.list({ search: q, limit: 5 }),
    href: (it) => `/bundles/${it._id}`,
    title: (it) => it.name,
    subtitle: (it) => (it.price != null ? formatPrice(it.price) : "Bundle"),
  },
];

/* Find the first array of objects in any API response shape. */
function firstArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== "object") return [];
  for (const k of Object.keys(obj)) {
    if (Array.isArray(obj[k]) && (obj[k].length === 0 || typeof obj[k][0] === "object")) {
      return obj[k];
    }
  }
  return [];
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entityItems, setEntityItems] = useState([]);
  const [active, setActive] = useState(0);

  const debounced = useDebounce(query.trim(), 250);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const reqId = useRef(0);

  /* page matches (instant, no network) */
  const pageItems = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.keywords.toLowerCase().includes(q),
    )
      .slice(0, 6)
      .map((p) => ({
        id: `page:${p.href}`,
        group: "Pages",
        icon: p.icon,
        title: p.label,
        subtitle: "Go to page",
        href: p.href,
      }));
  }, [debounced]);

  /* live entity search */
  useEffect(() => {
    if (debounced.length < 2) {
      setEntityItems([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);

    Promise.allSettled(SOURCES.map((s) => s.fetch(debounced))).then((results) => {
      if (id !== reqId.current) return; // stale
      const items = [];
      results.forEach((res, i) => {
        if (res.status !== "fulfilled") return;
        const src = SOURCES[i];
        firstArray(res.value)
          .slice(0, 5)
          .forEach((it) => {
            const title = src.title(it);
            if (!title) return;
            items.push({
              id: `${src.key}:${it._id || title}`,
              group: src.group,
              icon: src.icon,
              title: String(title),
              subtitle: src.subtitle(it) || "",
              href: src.href(it),
            });
          });
      });
      setEntityItems(items);
      setLoading(false);
    });
  }, [debounced]);

  /* flattened list for keyboard navigation */
  const flat = useMemo(() => [...pageItems, ...entityItems], [pageItems, entityItems]);

  useEffect(() => setActive(0), [flat.length]);

  /* grouped for rendering, preserving flat index */
  const grouped = useMemo(() => {
    const map = new Map();
    flat.forEach((item, index) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push({ ...item, index });
    });
    return Array.from(map.entries());
  }, [flat]);

  const go = useCallback(
    (item) => {
      if (!item) return;
      setOpen(false);
      setQuery("");
      setEntityItems([]);
      inputRef.current?.blur();
      router.push(item.href);
    },
    [router],
  );

  /* close on outside click */
  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* Cmd/Ctrl+K focus shortcut */
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showPanel = open && debounced.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, orders, customers, pages…"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-16 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:flex">
          ⌘K
        </kbd>
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-xl">
          {flat.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-400">
              {loading ? "Searching…" : `No results for “${debounced}”`}
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    {group}
                  </span>
                  {group !== "Pages" && loading && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-zinc-900" />
                  )}
                </div>
                <ul>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.index === active;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(item.index)}
                          onClick={() => go(item)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                            isActive ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                              isActive ? "bg-white/15" : "bg-zinc-100"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-600"}`}
                              strokeWidth={1.75}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span
                                className={`block truncate text-xs ${
                                  isActive ? "text-zinc-300" : "text-zinc-400"
                                }`}
                              >
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? "text-white" : "text-transparent"
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}

          <div className="mt-1 flex items-center justify-between border-t border-zinc-100 px-3 pt-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> to open
            </span>
            <span>↑↓ to navigate · Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
