/* ------------------------------------------------------------------ */
/* Defensive normalizers — the report endpoints' exact shape is not    */
/* guaranteed, so we fuzzy-match common field names and fall back      */
/* gracefully to an empty result instead of crashing the dashboard.    */
/* ------------------------------------------------------------------ */

function firstArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== "object") return [];
  // Prefer well-known keys, then any array of objects.
  const preferred = [
    "data",
    "series",
    "sales",
    "salesByDay",
    "salesByMonth",
    "daily",
    "monthly",
    "results",
    "items",
    "points",
    "chart",
    "report",
    "products",
    "topProducts",
    "topSelling",
  ];
  for (const k of preferred) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  for (const k of Object.keys(obj)) {
    if (Array.isArray(obj[k]) && obj[k].length && typeof obj[k][0] === "object") {
      return obj[k];
    }
  }
  return [];
}

function pick(obj, keys, fallback = 0) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function formatLabel(raw, period) {
  if (raw === undefined || raw === null) return "";
  // numeric month (1-12)
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (typeof raw === "number") {
    if (raw >= 1 && raw <= 12 && period === "year") return months[raw - 1];
    return String(raw);
  }
  const str = String(raw);
  // looks like a date?
  const d = new Date(str);
  if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}/.test(str)) {
    if (period === "year") return months[d.getMonth()];
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  return str;
}

export function normalizeSeries(report, period = "month") {
  const arr = firstArray(report);
  return arr
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const label = formatLabel(
        pick(item, ["label", "date", "day", "month", "name", "period", "_id"], ""),
        period,
      );
      const revenue = Number(
        pick(item, [
          "revenue", "totalRevenue", "total", "sales", "totalSales",
          "amount", "value", "grossRevenue",
        ]),
      );
      const orders = Number(
        pick(item, [
          "orders", "totalOrders", "count", "numOrders", "orderCount",
          "ordersCount", "quantity",
        ]),
      );
      return { label, revenue: revenue || 0, orders: orders || 0 };
    })
    .filter(Boolean);
}

export function normalizeProducts(report) {
  const arr = firstArray(report);
  return arr
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      return {
        id: pick(item, ["_id", "id", "productId"], Math.random()),
        name: pick(item, ["name", "title", "productName"], "Untitled"),
        sold: Number(
          pick(item, [
            "sold", "totalSold", "unitsSold", "sales", "quantitySold",
            "totalQuantity", "count",
          ]),
        ),
        revenue: Number(pick(item, ["revenue", "totalRevenue", "total", "amount"])),
        stock: Number(
          pick(item, ["stock", "totalStock", "stockRemaining", "inventory"], NaN),
        ),
        image: pick(item, ["image", "thumbnail", "imageUrl"], null),
      };
    })
    .filter(Boolean);
}
