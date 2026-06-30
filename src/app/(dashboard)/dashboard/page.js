"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  DownloadIcon,
  MixerHorizontalIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CubeIcon,
  PersonIcon,
  ArchiveIcon,
} from "@radix-ui/react-icons";
import { adminDashboardApi } from "@/lib/endpoints";
import { AreaChart, DonutGauge, Sparkline } from "./_components/charts";
import { normalizeSeries, normalizeProducts } from "./_components/data";
import { exportExcel, exportCsv } from "./_components/export";

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
const statusColors = {
  pending: "bg-zinc-100 text-zinc-700 border-zinc-200",
  confirmed: "bg-zinc-900 text-white border-zinc-900",
  processing: "bg-zinc-100 text-zinc-700 border-zinc-200",
  shipped: "bg-zinc-100 text-zinc-700 border-zinc-200",
  delivered: "bg-zinc-900 text-white border-zinc-900",
  cancelled: "bg-white text-zinc-500 border-zinc-300 line-through",
  returned: "bg-white text-zinc-500 border-zinc-300",
};

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

function inr(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}
function inrShort(amount) {
  const n = Number(amount || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  return `₹${n}`;
}
function num(v) {
  return Number(v || 0).toLocaleString("en-IN");
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* trend % from first→last of a numeric series */
function seriesTrend(series, key) {
  const vals = series.map((s) => s[key]).filter((v) => Number.isFinite(v));
  if (vals.length < 2) return null;
  const prev = vals[vals.length - 2];
  const last = vals[vals.length - 1];
  if (!prev) return null;
  return ((last - prev) / Math.abs(prev)) * 100;
}

/* ------------------------------------------------------------------ */
/* small UI pieces                                                   */
/* ------------------------------------------------------------------ */
function TrendBadge({ value }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
        up ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white"
      }`}
    >
      {up ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, value, sub, trend, spark, sparkColor, dark, icon }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className={`text-sm ${dark ? "text-zinc-300" : "text-zinc-500"}`}>
          {label}
        </p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            dark ? "bg-white/10 text-white" : "bg-zinc-900 text-white"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <TrendBadge value={trend} />
            {sub && (
              <span className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-400"}`}>
                {sub}
              </span>
            )}
          </div>
        </div>
        {spark && spark.length > 1 && (
          <Sparkline
            data={spark}
            color={dark ? "#ffffff" : sparkColor || "#18181b"}
          />
        )}
      </div>
    </div>
  );
}

function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* simple Radix-select-free dropdown trigger styled button */
function Menu({ trigger, children, align = "end" }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({ children, onSelect, active }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none data-[highlighted]:bg-zinc-100"
    >
      <span className="capitalize">{children}</span>
      {active && <CheckIcon className="h-4 w-4 text-zinc-900" />}
    </DropdownMenu.Item>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                              */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState("month");
  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [topProducts, setTopProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* base overview */
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminDashboardApi.overview();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* product report (top sellers) */
  const fetchProducts = useCallback(async () => {
    try {
      const res = await adminDashboardApi.productReport();
      setTopProducts(normalizeProducts(res));
    } catch {
      setTopProducts([]);
    }
  }, []);

  /* sales series — refetched on period change */
  const fetchSeries = useCallback(async (p) => {
    setSeriesLoading(true);
    try {
      const res = await adminDashboardApi.salesReport({ period: p, range: p });
      setSeries(normalizeSeries(res, p));
    } catch {
      setSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchProducts();
  }, [fetchOverview, fetchProducts]);

  useEffect(() => {
    fetchSeries(period);
  }, [period, fetchSeries]);

  const {
    totalOrders = 0,
    totalRevenue = 0,
    totalCustomers = 0,
    averageOrderValue = 0,
    ordersToday = 0,
    revenueToday = 0,
    recentOrders = [],
    lowStockProducts = [],
  } = data || {};

  /* derived */
  const revenueTrend = useMemo(() => seriesTrend(series, "revenue"), [series]);
  const ordersTrend = useMemo(() => seriesTrend(series, "orders"), [series]);
  const revSpark = useMemo(() => series.map((s) => s.revenue), [series]);
  const ordSpark = useMemo(() => series.map((s) => s.orders), [series]);

  const periodRevenue = useMemo(
    () => series.reduce((a, s) => a + s.revenue, 0),
    [series],
  );
  const periodOrders = useMemo(
    () => series.reduce((a, s) => a + s.orders, 0),
    [series],
  );

  const salesGrowth = useMemo(() => {
    if (revenueTrend !== null) return revenueTrend;
    return 0;
  }, [revenueTrend]);

  const topByRevenue = useMemo(
    () =>
      [...topProducts]
        .sort((a, b) => (b.sold || b.revenue) - (a.sold || a.revenue))
        .slice(0, 5),
    [topProducts],
  );

  /* filtered recent orders */
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recentOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(o.orderNumber || "").toLowerCase().includes(q) ||
        String(o.user?.fullName || "").toLowerCase().includes(q) ||
        String(o.user?.email || "").toLowerCase().includes(q)
      );
    });
  }, [recentOrders, search, statusFilter]);

  /* exports */
  const orderRows = filteredOrders.map((o) => [
    o.orderNumber || "",
    o.user?.fullName || "—",
    o.user?.email || "",
    o.status || "",
    Number(o.pricing?.total || 0),
    o.createdAt ? fmtDate(o.createdAt) : "",
  ]);
  const orderCols = ["Order #", "Customer", "Email", "Status", "Total (₹)", "Date"];

  function handleExportExcel() {
    const periodLabel = PERIODS.find((p) => p.value === period)?.label || "";
    exportExcel(
      [
        {
          title: `Key Metrics — ${periodLabel}`,
          columns: ["Metric", "Value"],
          rows: [
            ["Total Revenue", totalRevenue],
            ["Total Orders", totalOrders],
            ["Total Customers", totalCustomers],
            ["Average Order Value", averageOrderValue],
            ["Orders Today", ordersToday],
            ["Revenue Today", revenueToday],
            [`Revenue (${periodLabel})`, periodRevenue],
            [`Orders (${periodLabel})`, periodOrders],
          ],
        },
        {
          title: `Sales Over Time — ${periodLabel}`,
          columns: ["Period", "Revenue", "Orders"],
          rows: series.map((s) => [s.label, s.revenue, s.orders]),
        },
        {
          title: "Recent Orders",
          columns: orderCols,
          rows: orderRows,
        },
      ],
      `cleanse-dashboard-${period}.xls`,
    );
  }

  function handleExportCsv() {
    exportCsv(orderCols, orderRows, `cleanse-orders-${period}.csv`);
  }

  /* ------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <p className="text-sm text-zinc-400">Failed to load dashboard data.</p>
        <button
          onClick={fetchOverview}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const periodLabel = PERIODS.find((p) => p.value === period)?.label || "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Sales Overview</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Your beauty store performance at a glance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, customers…"
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 sm:w-60"
            />
          </div>

          {/* period */}
          <Menu
            trigger={
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300">
                {periodLabel}
                <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
              </button>
            }
          >
            {PERIODS.map((p) => (
              <MenuItem
                key={p.value}
                active={p.value === period}
                onSelect={() => setPeriod(p.value)}
              >
                {p.label}
              </MenuItem>
            ))}
          </Menu>

          {/* status filter */}
          <Menu
            trigger={
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300">
                <MixerHorizontalIcon className="h-4 w-4 text-zinc-400" />
                {statusFilter === "all" ? "Filter" : `Status: ${statusFilter}`}
              </button>
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem
                key={s}
                active={s === statusFilter}
                onSelect={() => setStatusFilter(s)}
              >
                {s === "all" ? "All statuses" : s}
              </MenuItem>
            ))}
          </Menu>

          {/* export */}
          <Menu
            trigger={
              <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                <DownloadIcon className="h-4 w-4" />
                Export
              </button>
            }
          >
            <MenuItem onSelect={handleExportExcel}>Export to Excel (.xls)</MenuItem>
            <MenuItem onSelect={handleExportCsv}>Export orders (.csv)</MenuItem>
          </Menu>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          dark
          label="Total Revenue"
          value={inr(totalRevenue)}
          sub="all time"
          trend={revenueTrend}
          spark={revSpark}
          icon={<span className="text-sm font-semibold">₹</span>}
        />
        <KpiCard
          label="Total Orders"
          value={num(totalOrders)}
          sub="all time"
          trend={ordersTrend}
          spark={ordSpark}
          icon={<ArchiveIcon className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Customers"
          value={num(totalCustomers)}
          sub="all time"
          icon={<PersonIcon className="h-4 w-4" />}
        />
        <KpiCard
          label="Avg. Order Value"
          value={inr(averageOrderValue)}
          sub="per order"
          icon={<CubeIcon className="h-4 w-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* sales over time */}
        <Card
          className="lg:col-span-2"
          title="Sales Over Time"
          action={
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-900" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-400" /> Orders
              </span>
              <span className="hidden rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 sm:inline">
                {periodLabel}
              </span>
            </div>
          }
        >
          {seriesLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-end gap-x-8 gap-y-2">
                <div>
                  <p className="text-xs text-zinc-500">
                    Revenue · {periodLabel}
                  </p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {inr(periodRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Orders · {periodLabel}</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {num(periodOrders)}
                  </p>
                </div>
              </div>
              <AreaChart
                data={series}
                height={300}
                formatRevenue={inrShort}
                formatOrders={num}
              />
            </>
          )}
        </Card>

        {/* growth gauge */}
        <Card title="Sales Growth">
          <div className="flex flex-col items-center">
            <div className="flex justify-center py-2">
              <DonutGauge percent={salesGrowth} />
            </div>
            <p className="mt-1 text-center text-xs text-zinc-500">
              {periodLabel} revenue vs previous period
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-xs text-zinc-500">Orders Today</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {num(ordersToday)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-xs text-zinc-500">Revenue Today</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {inrShort(revenueToday)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders + Top products row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* recent orders */}
        <Card
          className="lg:col-span-2"
          title="Recent Orders"
          action={
            <span className="text-xs text-zinc-400">
              {filteredOrders.length} shown
            </span>
          }
        >
          <div className="-mx-5 max-h-[420px] overflow-auto px-5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-100 text-left">
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Order #</th>
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Customer</th>
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Total</th>
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Status</th>
                  <th className="py-2.5 font-medium text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      No orders match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/60"
                    >
                      <td className="py-3 pr-3 font-medium text-zinc-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-zinc-700">
                          {order.user?.fullName || "—"}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {order.user?.email || ""}
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-medium text-zinc-900">
                        {inr(order.pricing?.total)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                            statusColors[order.status] ||
                            "bg-zinc-50 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500">
                        {order.createdAt ? fmtDate(order.createdAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* top selling products */}
        <Card title="Top Selling Products">
          {topByRevenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              No product data available.
            </p>
          ) : (
            <ul className="space-y-3">
              {topByRevenue.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {p.sold ? `${num(p.sold)} sold` : ""}
                      {p.sold && p.revenue ? " · " : ""}
                      {p.revenue ? inrShort(p.revenue) : ""}
                    </p>
                  </div>
                  {Number.isFinite(p.stock) && (
                    <span className="shrink-0 text-xs text-zinc-400">
                      {num(p.stock)} left
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Low stock */}
      <Card
        title="Low Stock Products"
        action={
          <span className="text-xs text-zinc-400">
            {lowStockProducts.length} items
          </span>
        }
      >
        {lowStockProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            All products are well stocked.
          </p>
        ) : (
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-100 text-left">
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Product</th>
                  <th className="py-2.5 font-medium text-zinc-400">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => {
                  const stock = product.totalStock ?? 0;
                  return (
                    <tr
                      key={product._id}
                      className="border-b border-zinc-50 hover:bg-zinc-50/60"
                    >
                      <td className="py-3 pr-3 font-medium text-zinc-900">
                        {product.name}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            stock < 5
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {stock} in stock
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
