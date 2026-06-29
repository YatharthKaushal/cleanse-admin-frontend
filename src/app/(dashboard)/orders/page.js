"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArchiveIcon,
  ChevronRightIcon,
  CheckCircledIcon,
  Cross1Icon,
  ChatBubbleIcon,
  ReloadIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import * as Tabs from "@radix-ui/react-tabs";
import { adminOrderApi, adminShiprocketApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import { useDebounce } from "@/lib/use-debounce";
import DataTable from "@/components/data-table";
import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import Pagination from "@/components/pagination";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const ORDER_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Order placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "pickup_scheduled", label: "Awaiting pickup" },
  { value: "shipped", label: "Picked up" },
  { value: "in_transit", label: "On the way" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rto_in_transit", label: "Coming back to us" },
  { value: "rto_delivered", label: "Back at warehouse" },
  { value: "return_requested", label: "Return requested" },
  { value: "return_approved", label: "Return approved" },
  { value: "returned", label: "Returned" },
  { value: "refund_initiated", label: "Refund started" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_STATUSES = [
  { value: "all", label: "All Payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

// Plain-language label per internal status code (admin-facing).
const PLAIN = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  pickup_scheduled: "Awaiting pickup",
  shipped: "Picked up",
  in_transit: "On the way",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rto_in_transit: "Coming back to us",
  rto_delivered: "Back at warehouse",
  return_requested: "Return requested",
  return_approved: "Return approved",
  returned: "Returned",
  refund_initiated: "Refund started",
  refunded: "Refunded",
};
const plain = (s) => PLAIN[s] || (s || "").replace(/_/g, " ");

// Mirrors backend VALID_TRANSITIONS (admin/order.controller.js).
const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["pickup_scheduled", "cancelled"],
  pickup_scheduled: ["shipped", "in_transit", "rto_in_transit", "cancelled"],
  shipped: ["in_transit", "rto_in_transit"],
  in_transit: ["out_for_delivery", "rto_in_transit"],
  out_for_delivery: ["delivered", "rto_in_transit"],
  delivered: ["return_requested"],
  rto_in_transit: ["rto_delivered"],
  rto_delivered: ["refund_initiated"],
  return_requested: ["return_approved", "delivered"],
  return_approved: ["returned"],
  returned: ["refund_initiated"],
  refund_initiated: ["refunded"],
  cancelled: ["refund_initiated"],
};

// The admin's routine next-step per status (forward path only). Other
// transitions (courier/auto/branches) are NOT primary buttons.
const ADMIN_CTA = {
  pending: { to: "confirmed", label: "Confirm order" },
  confirmed: { to: "processing", label: "Start processing" },
  processing: { to: "packed", label: "Mark as packed" },
  packed: {
    to: "pickup_scheduled",
    label: "Book courier pickup",
    confirm: {
      title: "Book courier pickup?",
      description:
        "This assigns a tracking number and requests a courier pickup from your warehouse (uses your Shiprocket wallet). The status updates automatically once it's collected.",
    },
  },
};

// Whose turn is it / what's happening, per status.
const STAGE_HELP = {
  pending: { owner: "you", text: "Your turn: confirm the order to start fulfilment." },
  confirmed: { owner: "you", text: "Your turn: start processing the order." },
  processing: { owner: "you", text: "Your turn: pack the order." },
  packed: { owner: "you", text: "Your turn: pack it, then book the courier pickup." },
  pickup_scheduled: { owner: "courier", text: "Pickup booked. The courier collects it on its scheduled run (cut-off based). Updates automatically." },
  shipped: { owner: "courier", text: "Picked up by the courier. On its way." },
  in_transit: { owner: "courier", text: "Automatic — parcel is on its way. Status updates on its own." },
  out_for_delivery: { owner: "courier", text: "Automatic — out for delivery today." },
  delivered: { owner: "courier", text: "Delivered. Nothing more to do." },
  cancelled: { owner: "you", text: "Order cancelled." },
  rto_in_transit: { owner: "courier", text: "Automatic — parcel is being returned to us." },
  rto_delivered: { owner: "courier", text: "Returned parcel is back. Restock/refund handled automatically." },
  return_requested: { owner: "customer", text: "Customer requested a return — approve or reject below." },
  return_approved: { owner: "automatic", text: "Automatic — reverse pickup arranged." },
  returned: { owner: "courier", text: "Item returned to us." },
  refund_initiated: { owner: "automatic", text: "Refund in progress." },
  refunded: { owner: "automatic", text: "Refund complete." },
};

// Forward steps for the visual stepper.
const STEPS = [
  { code: "pending", owner: "customer" },
  { code: "confirmed", owner: "you" },
  { code: "processing", owner: "you" },
  { code: "packed", owner: "you" },
  { code: "pickup_scheduled", owner: "you" },
  { code: "shipped", owner: "courier" },
  { code: "in_transit", owner: "courier" },
  { code: "out_for_delivery", owner: "courier" },
  { code: "delivered", owner: "courier" },
];
const STEP_INDEX = STEPS.reduce((m, s, i) => ((m[s.code] = i), m), {});

/* ------------------------------------------------------------------ */
/* Owner icons + badges (SVG, no emoji)                               */
/* ------------------------------------------------------------------ */

function IconStore({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1.5-5h15L21 9" /><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    </svg>
  );
}
function IconGear({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconTruck({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconUser({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const OWNERS = {
  you: { label: "You", Icon: IconStore, text: "text-zinc-700", bg: "bg-zinc-100", dot: "bg-zinc-700" },
  automatic: { label: "Automatic", Icon: IconGear, text: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  courier: { label: "Courier", Icon: IconTruck, text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  customer: { label: "Customer", Icon: IconUser, text: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500" },
};
// backend actor → owner key
const ACTOR_OWNER = { admin: "you", system: "automatic", courier: "courier", customer: "customer" };

function OwnerBadge({ owner, withLabel = true, size = "sm" }) {
  const o = OWNERS[owner] || OWNERS.you;
  const Icon = o.Icon;
  const ic = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${o.bg} ${o.text}`}>
      <Icon className={ic} />
      {withLabel && o.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Status badges / formatting                                         */
/* ------------------------------------------------------------------ */

function statusColor(status) {
  switch (status) {
    case "delivered":
      return "bg-green-50 text-green-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "refunded":
    case "returned":
    case "refund_initiated":
      return "bg-zinc-100 text-zinc-600";
    case "rto_in_transit":
    case "rto_delivered":
      return "bg-orange-50 text-orange-700";
    case "return_requested":
    case "return_approved":
      return "bg-amber-50 text-amber-700";
    case "pickup_scheduled":
    case "shipped":
    case "in_transit":
    case "out_for_delivery":
      return "bg-blue-50 text-blue-700";
    case "pending":
      return "bg-zinc-100 text-zinc-500";
    default:
      return "bg-zinc-50 text-zinc-600";
  }
}
function paymentColor(status) {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "refunded":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function GiftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" /><path d="M12 8v13" /><path d="M12 8S10 3 7.5 3a2.5 2.5 0 0 0 0 5H12" /><path d="M12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5H12" />
    </svg>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === "delivered" ? "bg-green-500"
          : status === "cancelled" ? "bg-red-500"
          : ["pickup_scheduled", "shipped", "in_transit", "out_for_delivery"].includes(status) ? "bg-blue-500"
          : ["rto_in_transit", "rto_delivered"].includes(status) ? "bg-orange-500"
          : ["return_requested", "return_approved"].includes(status) ? "bg-amber-500"
          : "bg-zinc-400"
      }`} />
      {plain(status)}
    </span>
  );
}

function PaymentBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentColor(status)}`}>
      {status || "pending"}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const COLUMNS = [
  { key: "orderId", label: "Order", sortable: true, sortKey: "orderId" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items", className: "hidden sm:table-cell" },
  { key: "total", label: "Total", sortable: true, sortKey: "pricing.total" },
  { key: "payment", label: "Payment", className: "hidden md:table-cell" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date", sortable: true, sortKey: "createdAt" },
  { key: "actions", label: "", width: "40px" },
];

/* ------------------------------------------------------------------ */
/* List page                                                          */
/* ------------------------------------------------------------------ */

export default function OrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sort, setSort] = useState("-createdAt");
  const debouncedSearch = useDebounce(search, 300);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter && paymentFilter !== "all") params.paymentStatus = paymentFilter;
      const data = await adminOrderApi.list(params);
      setOrders(data.orders || []);
      if (data.pagination) {
        setPagination((prev) => ({ ...prev, page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total }));
      }
    } catch {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sort, debouncedSearch, statusFilter, paymentFilter, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPagination((prev) => ({ ...prev, page: 1 })); }, [debouncedSearch, statusFilter, paymentFilter]);

  const handleSort = (field) => setSort((prev) => (prev === field ? `-${field}` : prev === `-${field}` ? field : `-${field}`));
  const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
  const sortDir = sort.startsWith("-") ? "desc" : "asc";

  const openDetail = async (order) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await adminOrderApi.get(order._id);
      setSelectedOrder(data.order || data);
    } catch {
      showToast("Failed to load order details", "error");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage and track all customer orders</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by order ID or name..." />
        </div>
        <SelectFilter value={statusFilter} onValueChange={setStatusFilter} placeholder="All Statuses" options={ORDER_STATUSES} />
        <SelectFilter value={paymentFilter} onValueChange={setPaymentFilter} placeholder="All Payments" options={PAYMENT_STATUSES} />
        <button onClick={fetchOrders} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50">
          <ReloadIcon className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {!loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <ArchiveIcon className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-base font-medium text-zinc-700">No orders found</h3>
          <p className="text-sm text-zinc-500">
            {search || (statusFilter && statusFilter !== "all") || (paymentFilter && paymentFilter !== "all")
              ? "Try adjusting your search or filters"
              : "Orders will appear here when customers place them"}
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={orders}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={loading}
            renderRow={(order) => (
              <tr key={order._id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 cursor-pointer" onClick={() => openDetail(order)}>
                <td className="px-4 py-3"><span className="font-medium text-zinc-900 text-xs tracking-wide">{order.orderId}</span></td>
                <td className="px-4 py-3">
                  <p className="text-sm text-zinc-900 truncate max-w-[160px]">{order.user?.fullName || order.shippingAddress?.fullName || "—"}</p>
                  <p className="text-xs text-zinc-400 truncate max-w-[160px]">{order.user?.email || order.contactEmail || ""}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-sm text-zinc-600">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</span>
                </td>
                <td className="px-4 py-3"><span className="text-sm font-medium text-zinc-900">&#8377;{order.pricing?.total?.toLocaleString("en-IN") || "0"}</span></td>
                <td className="px-4 py-3 hidden md:table-cell"><PaymentBadge status={order.payment?.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    {order.giftWrap && (
                      <span title="Gift wrap requested" className="inline-flex items-center rounded-full bg-purple-50 p-1 text-purple-600">
                        <GiftIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs text-zinc-400">{formatDate(order.createdAt)}</span></td>
                <td className="px-4 py-3"><ChevronRightIcon className="h-4 w-4 text-zinc-300" /></td>
              </tr>
            )}
          />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          />
        </>
      )}

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
          <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl focus:outline-none" aria-describedby={undefined}>
            <VisuallyHidden.Root><Dialog.Title>Order Details</Dialog.Title></VisuallyHidden.Root>
            {detailLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
            ) : selectedOrder ? (
              <OrderDetail order={selectedOrder} onUpdated={(o) => { setSelectedOrder(o); fetchOrders(); }} />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order detail drawer                                                */
/* ------------------------------------------------------------------ */

function OrderDetail({ order, onUpdated }) {
  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Order {order.orderId}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
        </div>
        <Dialog.Close asChild>
          <button className="rounded p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"><Cross1Icon className="h-4 w-4" /></button>
        </Dialog.Close>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs.Root defaultValue="details" className="flex flex-col h-full">
          <Tabs.List className="flex border-b border-zinc-200 px-6">
            <Tabs.Trigger value="details" className="px-4 py-2.5 text-sm font-medium text-zinc-400 border-b-2 border-transparent transition-colors data-[state=active]:text-zinc-900 data-[state=active]:border-zinc-900">Details</Tabs.Trigger>
            <Tabs.Trigger value="activity" className="px-4 py-2.5 text-sm font-medium text-zinc-400 border-b-2 border-transparent transition-colors data-[state=active]:text-zinc-900 data-[state=active]:border-zinc-900">
              Activity ({order.adminNotes?.length || 0})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="details" className="flex-1 p-6 space-y-6">
            <FulfillmentBlock order={order} onUpdated={onUpdated} />
            <ItemsPaymentSection order={order} />
            <CustomerDeliverySection order={order} />
            <AdvancedOps order={order} onUpdated={onUpdated} />
          </Tabs.Content>

          <Tabs.Content value="activity" className="flex-1 p-6">
            <ActivityFeed order={order} onUpdated={onUpdated} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fulfillment block                                                  */
/* ------------------------------------------------------------------ */

function FulfillmentBlock({ order, onUpdated }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState("");
  const s = order.shipping || {};
  const status = order.status;
  const cta = ADMIN_CTA[status];
  const help = STAGE_HELP[status] || { owner: "automatic", text: "" };
  const canCancel = (VALID_TRANSITIONS[status] || []).includes("cancelled");
  const isReturnReq = status === "return_requested";

  const setStatus = async (to) => {
    setBusy(to);
    try {
      const data = await adminOrderApi.updateStatus(order._id, to);
      onUpdated(data.order || data);
      showToast(`Marked as "${plain(to)}"`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update", "error");
    } finally {
      setBusy("");
    }
  };

  const approveReturn = async (action) => {
    setBusy(action);
    try {
      const data = await adminOrderApi.approveReturn(order._id, action);
      onUpdated(data.order || data);
      showToast(`Return ${action}d`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy("");
    }
  };

  const accent = OWNERS[help.owner]?.dot || "bg-zinc-300";
  const yourTurn = help.owner === "you" || isReturnReq;

  return (
    <div className="space-y-4">
      {/* Hero: current stage + the one next action */}
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="flex">
          <span className={`w-1 shrink-0 ${accent}`} />
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    {yourTurn ? "Your turn" : "Current stage"}
                  </span>
                  <OwnerBadge owner={help.owner} />
                </div>
                <p className="mt-1 text-lg font-semibold leading-tight text-zinc-900">{plain(status)}</p>
                <p className="text-[11px] text-zinc-400">status: {status}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={status} />
                <PaymentBadge status={order.payment?.status} />
              </div>
            </div>

            <p className="text-sm text-zinc-500">{help.text}</p>

            {/* Primary action / return / cancel */}
            {(cta || isReturnReq || canCancel) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {cta && (
                  cta.confirm ? (
                    <ConfirmAction
                      title={cta.confirm.title}
                      description={cta.confirm.description}
                      confirmLabel={cta.label}
                      onConfirm={() => setStatus(cta.to)}
                      trigger={
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50" disabled={!!busy}>
                          <IconTruck className="h-4 w-4" /> {cta.label}
                        </button>
                      }
                    />
                  ) : (
                    <button onClick={() => setStatus(cta.to)} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                      {busy === cta.to ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : <CheckCircledIcon className="h-3.5 w-3.5" />} {cta.label}
                    </button>
                  )
                )}
                {isReturnReq && (
                  <>
                    <button onClick={() => approveReturn("approve")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                      <CheckIcon className="h-3.5 w-3.5" /> Approve return
                    </button>
                    <button onClick={() => approveReturn("reject")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
                      <Cross1Icon className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}
                {canCancel && (
                  <ConfirmAction
                    title="Cancel this order?"
                    description="The order will be cancelled and any booked courier shipment cancelled. Paid orders are refunded automatically."
                    confirmLabel="Cancel order"
                    danger
                    onConfirm={() => setStatus("cancelled")}
                    trigger={<button className="ml-auto text-xs text-red-500 hover:text-red-600">Cancel order</button>}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vertical journey timeline */}
      <VerticalTimeline order={order} />

      {/* Shipment facts */}
      {(s.shiprocketOrderId || s.awbNumber) && <ShipmentFacts s={s} />}
    </div>
  );
}

// Branch (off the forward chain) status → owner.
const BRANCH_OWNER = {
  cancelled: "you",
  rto_in_transit: "courier",
  rto_delivered: "courier",
  return_requested: "customer",
  return_approved: "you",
  returned: "courier",
  refund_initiated: "automatic",
  refunded: "automatic",
};

// Build code→timestamp map from order timestamps + the attributed activity log.
function buildStamps(order) {
  const stamps = {};
  if (order.createdAt) stamps.pending = order.createdAt;
  if (order.confirmedAt) stamps.confirmed = order.confirmedAt;
  if (order.pickupBookedAt) stamps.pickup_scheduled = order.pickupBookedAt;
  if (order.shippedAt) stamps.shipped = order.shippedAt;
  if (order.deliveredAt) stamps.delivered = order.deliveredAt;
  if (order.cancelledAt) stamps.cancelled = order.cancelledAt;
  for (const n of order.adminNotes || []) {
    const m = (n.event || "").match(/^(?:status|tracking):(.+)$/);
    if (m && !stamps[m[1]]) stamps[m[1]] = n.addedAt;
  }
  return stamps;
}

function VerticalTimeline({ order }) {
  const status = order.status;
  const stamps = buildStamps(order);
  const fwdIdx = STEP_INDEX[status];
  const isBranch = fwdIdx === undefined;
  const reached = !isBranch
    ? fwdIdx
    : stamps.delivered ? 7 : stamps.shipped ? 4 : stamps.confirmed ? 1 : 0;

  const rows = STEPS.map((step, i) => ({
    code: step.code,
    owner: step.owner,
    at: stamps[step.code],
    state: i < reached ? "done" : i === reached && !isBranch ? "current" : i <= reached ? "done" : "upcoming",
  }));
  if (isBranch) {
    rows.push({ code: status, owner: BRANCH_OWNER[status] || "automatic", at: stamps[status], state: "current", branch: true });
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Journey</h3>
      <ol className="relative">
        {rows.map((r, i) => (
          <TimelineRow key={`${r.code}-${i}`} row={r} last={i === rows.length - 1} />
        ))}
      </ol>
    </div>
  );
}

function TimelineRow({ row, last }) {
  const done = row.state === "done";
  const current = row.state === "current";
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span className="absolute left-[6px] top-3.5 h-full w-px bg-zinc-200" />}
      <span className={`relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
        row.branch ? "bg-orange-500"
          : done ? "bg-zinc-900"
          : current ? "bg-white ring-2 ring-zinc-900"
          : "bg-white ring-2 ring-zinc-200"
      }`}>
        {done && !row.branch && <CheckIcon className="h-2.5 w-2.5 text-white" />}
      </span>
      <div className="-mt-0.5 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm ${current ? "font-semibold text-zinc-900" : done ? "text-zinc-700" : "text-zinc-400"}`}>{plain(row.code)}</span>
          {row.at && <span className="shrink-0 text-[11px] text-zinc-400">{formatDateTime(row.at)}</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">{row.code}</span>
          <OwnerBadge owner={row.owner} size="xs" />
        </div>
      </div>
    </li>
  );
}

// Shiprocket brand mark + badge (brand purple #854DFF).
function IconRocket({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ShiprocketBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#854DFF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#854DFF]">
      <IconRocket className="h-3 w-3" /> Powered by Shiprocket
    </span>
  );
}

function ShipmentFacts({ s }) {
  const [copied, setCopied] = useState(false);
  const copy = (v) => {
    if (!v) return;
    navigator.clipboard?.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="rounded-lg border border-[#854DFF]/20 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Shipment</h3>
        <ShiprocketBadge />
      </div>
      <Fact label="Tracking number">
        {s.awbNumber ? (
          <span className="inline-flex items-center gap-1 font-mono">
            {s.awbNumber}
            <button onClick={() => copy(s.awbNumber)} className="text-zinc-400 hover:text-zinc-700" title="Copy">
              {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            </button>
          </span>
        ) : "— (not booked yet)"}
      </Fact>
      <Fact label="Courier">{s.courierName || "—"}</Fact>
      <Fact label="Latest status">{s.lastTrackingStatus || "—"}</Fact>
      <Fact label="Pickup">{s.pickupScheduledDate ? formatDateTime(s.pickupScheduledDate) : "—"}</Fact>
      <Fact label="Est. delivery">{s.estimatedDelivery ? formatDate(s.estimatedDelivery) : "—"}</Fact>
      <Fact label="Last update">{s.lastWebhookAt ? formatDateTime(s.lastWebhookAt) : "—"}</Fact>
      <div className="flex flex-wrap gap-3 pt-1">
        {s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#854DFF] hover:underline"><ExternalLinkIcon className="h-3 w-3" /> Track parcel</a>}
        {s.labelUrl && <a href={s.labelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#854DFF] hover:underline"><ExternalLinkIcon className="h-3 w-3" /> Shipping label</a>}
        {s.manifestUrl && <a href={s.manifestUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#854DFF] hover:underline"><ExternalLinkIcon className="h-3 w-3" /> Handover sheet</a>}
      </div>
      {s.returnShipment?.awbNumber && (
        <div className="mt-2 rounded border border-zinc-100 bg-zinc-50 p-2">
          <p className="text-[11px] font-medium text-zinc-500">Return pickup</p>
          <Fact label="Tracking">{s.returnShipment.awbNumber}</Fact>
          <Fact label="Courier">{s.returnShipment.courierName || "—"}</Fact>
        </div>
      )}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-zinc-400 shrink-0">{label}</span>
      <span className="text-xs text-zinc-700 text-right break-all">{children}</span>
    </div>
  );
}

/* Advanced / manual override actions (each explains it's normally automatic). */
function AdvancedOps({ order, onUpdated }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [couriers, setCouriers] = useState(null);
  const [courierId, setCourierId] = useState("");
  const [ndrComment, setNdrComment] = useState("");
  const s = order.shipping || {};

  const run = async (key, fn, msg) => {
    setBusy(key);
    try {
      const data = await fn();
      if (data?.order) onUpdated(data.order);
      if (msg) showToast(msg, "success");
      return data;
    } catch (err) {
      showToast(err?.response?.data?.message || "Operation failed", "error");
      return null;
    } finally {
      setBusy("");
    }
  };
  const openUrl = (u) => (u ? window.open(u, "_blank", "noopener") : showToast("No document URL", "error"));

  const AUTO_NOTE = "This normally happens automatically when you click \"Hand to courier\". Only use this to override or retry manually.";

  return (
    <div className="rounded-lg border border-zinc-200">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-medium text-zinc-700">Advanced / manual overrides</p>
          <p className="text-[11px] text-zinc-400">You normally don't need these — the steps above happen automatically.</p>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-zinc-100 p-4 space-y-3">
          {!s.shiprocketOrderId && (
            <ConfirmAction title="Send to Shiprocket now?" description={AUTO_NOTE} confirmLabel="Send"
              onConfirm={() => run("sync", () => adminShiprocketApi.sync(order._id), "Sent to Shiprocket")}
              trigger={<OverrideBtn busy={busy === "sync"}>Send to Shiprocket</OverrideBtn>} />
          )}
          {s.shiprocketOrderId && !s.awbNumber && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <OverrideBtn busy={busy === "couriers"} onClick={async () => { const d = await run("couriers", () => adminShiprocketApi.serviceability(order._id)); if (d?.serviceability) setCouriers(d.serviceability.couriers || []); }}>Check couriers</OverrideBtn>
                {couriers && (
                  <select value={courierId} onChange={(e) => setCourierId(e.target.value)} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs">
                    <option value="">Auto (recommended)</option>
                    {couriers.map((c) => <option key={c.courierId} value={c.courierId}>{c.name} — ₹{c.rate} / {c.estimatedDays}d</option>)}
                  </select>
                )}
                <ConfirmAction title="Assign tracking number?" description={AUTO_NOTE} confirmLabel="Assign"
                  onConfirm={() => run("awb", () => adminShiprocketApi.assignAwb(order._id, courierId || undefined), "Tracking number assigned")}
                  trigger={<OverrideBtn busy={busy === "awb"} primary>Assign tracking number</OverrideBtn>} />
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <ConfirmAction title="Schedule pickup?" description={AUTO_NOTE} confirmLabel="Schedule"
              onConfirm={() => run("pickup", () => adminShiprocketApi.pickup(order._id), "Pickup scheduled")}
              trigger={<OverrideBtn busy={busy === "pickup"}>Schedule pickup</OverrideBtn>} />
            <OverrideBtn busy={busy === "label"} onClick={async () => { const d = await run("label", () => adminShiprocketApi.label(order._id)); openUrl(d?.url); }}>Label</OverrideBtn>
            <OverrideBtn busy={busy === "manifest"} onClick={async () => { const d = await run("manifest", () => adminShiprocketApi.manifest(order._id)); openUrl(d?.url); }}>Handover sheet</OverrideBtn>
            <OverrideBtn busy={busy === "invoice"} onClick={async () => { const d = await run("invoice", () => adminShiprocketApi.invoice(order._id)); openUrl(d?.url); }}>Invoice</OverrideBtn>
            <OverrideBtn busy={busy === "track"} onClick={() => run("track", () => adminShiprocketApi.track(order._id))} disabled={!s.awbNumber}>Refresh tracking</OverrideBtn>
            <ConfirmAction title="Cancel the courier shipment?" description="Cancels the booking with the courier. The order status is not changed here." confirmLabel="Cancel shipment" danger
              onConfirm={() => run("cancel", () => adminShiprocketApi.cancel(order._id), "Cancellation requested")}
              trigger={<OverrideBtn busy={busy === "cancel"} danger>Cancel shipment</OverrideBtn>} />
          </div>
          {s.awbNumber && (
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <p className="text-[11px] font-medium text-zinc-500">Failed delivery (NDR) — normally handled automatically</p>
              <input value={ndrComment} onChange={(e) => setNdrComment(e.target.value)} placeholder="Comment (required)" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs" />
              <div className="flex gap-2">
                <OverrideBtn busy={busy === "ndrre"} disabled={!ndrComment.trim()} onClick={() => run("ndrre", () => adminShiprocketApi.ndr(order._id, "re-attempt", ndrComment), "Re-attempt requested")}>Re-attempt delivery</OverrideBtn>
                <OverrideBtn busy={busy === "ndrret"} danger disabled={!ndrComment.trim()} onClick={() => run("ndrret", () => adminShiprocketApi.ndr(order._id, "return", ndrComment), "Return requested")}>Return to us</OverrideBtn>
              </div>
            </div>
          )}
          {order.status === "delivered" && !s.returnShipment?.shipmentId && (
            <div className="pt-2 border-t border-zinc-100">
              <ConfirmAction title="Create a return pickup?" description="Books a reverse pickup from the customer back to your warehouse." confirmLabel="Create return"
                onConfirm={() => run("return", () => adminShiprocketApi.createReturn(order._id), "Return pickup created")}
                trigger={<OverrideBtn busy={busy === "return"}>Create return pickup</OverrideBtn>} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OverrideBtn({ children, onClick, busy, disabled, primary, danger }) {
  const cls = primary
    ? "bg-zinc-900 text-white hover:bg-zinc-800"
    : danger
    ? "border border-red-200 text-red-600 hover:bg-red-50"
    : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50";
  return (
    <button onClick={onClick} disabled={busy || disabled} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${cls}`}>
      {busy ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : null}{children}
    </button>
  );
}

/* Radix AlertDialog confirm wrapper */
function ConfirmAction({ trigger, title, description, confirmLabel = "Confirm", onConfirm, danger }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
          <AlertDialog.Title className="text-sm font-semibold text-zinc-900">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sm text-zinc-500">{description}</AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button onClick={onConfirm} className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800"}`}>{confirmLabel}</button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Items / Pricing / Customer sections                                */
/* ------------------------------------------------------------------ */

// Items + Payment combined in a single card (price breakdown stays an accordion).
function ItemsPaymentSection({ order }) {
  const [open, setOpen] = useState(false);
  const p = order.pricing || {};
  return (
    <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
      {/* Items */}
      <div className="p-3">
        <h3 className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">Items to pack ({order.items?.length || 0})</h3>
        <div className="space-y-2">
          {(order.items || []).map((item, idx) => {
            const product = item.product;
            const primaryImg = product?.images?.find((i) => i.isPrimary)?.url || product?.images?.[0]?.url;
            const img = item.image || primaryImg || "/images/placeholder.jpg";
            return (
              <div key={idx} className="flex items-center gap-3">
                <img src={img} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-zinc-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-400">Qty: {item.quantity}{item.selectedSize ? ` / Size: ${item.selectedSize}` : ""}</p>
                </div>
                <span className="text-sm font-medium text-zinc-900 shrink-0">&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment (accordion) */}
      <div>
        <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-zinc-900">Total</span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">&#8377;{p.total?.toLocaleString("en-IN") || "0"}</span>
            <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
        {open && (
          <div className="border-t border-zinc-100 px-4 py-3 space-y-2">
            <Row label="Subtotal" value={p.subtotal} />
            <Row label="Shipping" value={p.shippingCost} />
            {p.giftWrapCost > 0 && <Row label="Gift wrap" value={p.giftWrapCost} />}
            {(p.couponDiscount > 0 || p.tierDiscount > 0 || p.bundleDiscountTotal > 0 || p.loyaltyDiscount > 0 || p.specialCouponDiscountTotal > 0) && (
              <Row label="Discounts" value={-((p.couponDiscount||0)+(p.tierDiscount||0)+(p.bundleDiscountTotal||0)+(p.loyaltyDiscount||0)+(p.specialCouponDiscountTotal||0))} positiveGreen />
            )}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-zinc-100">
              <span className="text-zinc-900">Total</span>
              <span className="text-zinc-900">&#8377;{p.total?.toLocaleString("en-IN") || "0"}</span>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1">{order.payment?.method?.toUpperCase()} · {order.payment?.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, positiveGreen }) {
  const v = Number(value || 0);
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={positiveGreen && v < 0 ? "text-green-600" : "text-zinc-700"}>
        {v < 0 ? "-" : ""}&#8377;{Math.abs(v).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function CustomerDeliverySection({ order }) {
  const a = order.shippingAddress || {};
  const user = order.user;
  const accountName = user?.fullName || order.contactEmail || a.fullName;
  const accountEmail = user?.email || order.contactEmail;
  const accountPhone = user?.phone ? `${user.countryCode || "+91"} ${user.phone}` : order.contactPhone;
  const recipPhone = a.phone ? `${a.countryCode || "+91"} ${a.phone}` : "";
  // Same person? compare recipient name + phone digits with account.
  const digits = (x) => (x || "").replace(/\D/g, "").slice(-10);
  const sameAsAccount =
    a.fullName && accountName && a.fullName.trim().toLowerCase() === String(accountName).trim().toLowerCase() &&
    (!a.phone || !user?.phone || digits(a.phone) === digits(user.phone));

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Customer &amp; delivery</h3>
      <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
        {/* Account */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-medium text-zinc-400 uppercase">Account</span>
            <OwnerBadge owner="customer" />
          </div>
          <p className="text-sm font-medium text-zinc-900">{accountName || "Guest"}</p>
          <p className="text-sm text-zinc-500">{accountEmail || "—"}</p>
          <p className="text-sm text-zinc-500">{accountPhone || "—"}</p>
        </div>

        {/* Deliver to */}
        <div className="pt-2 border-t border-zinc-100">
          <span className="text-[10px] font-medium text-zinc-400 uppercase">Deliver to</span>
          {sameAsAccount && <span className="ml-2 text-[10px] text-zinc-400">(same as account)</span>}
          {!sameAsAccount && <p className="text-sm font-medium text-zinc-900 mt-0.5">{a.fullName}</p>}
          <p className="text-sm text-zinc-500 mt-0.5">{a.address1}</p>
          {a.address2 && <p className="text-sm text-zinc-500">{a.address2}</p>}
          <p className="text-sm text-zinc-500">{a.city}, {a.state} {a.pincode}</p>
          {!sameAsAccount && recipPhone && <p className="text-sm text-zinc-400 mt-0.5">{recipPhone}</p>}
        </div>

        {/* Billing only if different */}
        {order.billingSameAsShipping === false && order.billingAddress?.address1 && (
          <div className="pt-2 border-t border-zinc-100">
            <span className="text-[10px] font-medium text-zinc-400 uppercase">Billing</span>
            <p className="text-sm text-zinc-500 mt-0.5">{order.billingAddress.fullName}</p>
            <p className="text-sm text-zinc-500">{order.billingAddress.address1}</p>
            <p className="text-sm text-zinc-500">{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.pincode}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity feed (merged timeline + notes, attributed)                */
/* ------------------------------------------------------------------ */

function ActivityFeed({ order, onUpdated }) {
  const { showToast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [adding, setAdding] = useState(false);

  const addNote = async () => {
    if (!noteText.trim()) return;
    setAdding(true);
    try {
      const data = await adminOrderApi.addNote(order._id, noteText.trim());
      onUpdated(data.order || data);
      setNoteText("");
      showToast("Note added", "success");
    } catch {
      showToast("Failed to add note", "error");
    } finally {
      setAdding(false);
    }
  };

  const entries = [...(order.adminNotes || [])].reverse();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." rows={3}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 resize-none" />
        <button onClick={addNote} disabled={!noteText.trim() || adding} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {adding ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : <ChatBubbleIcon className="h-3.5 w-3.5" />} Add Note
        </button>
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">No activity yet</p>
        ) : (
          entries.map((e, idx) => {
            const owner = ACTOR_OWNER[e.actor] || "you";
            const o = OWNERS[owner];
            const Icon = o.Icon;
            return (
              <div key={idx} className="flex gap-2.5 rounded-lg border border-zinc-200 p-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${o.bg} ${o.text}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-700">{e.note}</p>
                  <p className="text-xs text-zinc-400">
                    {o.label}
                    {e.isOverride && <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">override</span>}
                    {" · "}{formatDateTime(e.addedAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <WebhookLogViewer orderId={order._id} />
    </div>
  );
}

const WH_RESULT = {
  processed: "bg-green-50 text-green-700",
  duplicate: "bg-zinc-100 text-zinc-500",
  unknown_order: "bg-amber-50 text-amber-700",
  unauthorized: "bg-red-50 text-red-700",
  bad_request: "bg-red-50 text-red-700",
  error: "bg-red-50 text-red-700",
};

// Raw Shiprocket webhook audit log — technical, collapsed by default.
function WebhookLogViewer({ orderId }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminShiprocketApi.orderWebhookLogs(orderId);
      setLogs(data.logs || []);
    } catch {
      showToast("Failed to load webhook logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && logs === null) load();
  };

  return (
    <div className="rounded-lg border border-zinc-200">
      <button onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-medium text-zinc-700">Webhook log (technical)</p>
          <p className="text-[11px] text-zinc-400">Raw courier updates received — for debugging.</p>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-zinc-100 p-3 space-y-2">
          <div className="flex justify-end">
            <button onClick={load} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800">
              <ReloadIcon className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          {loading && logs === null ? (
            <p className="text-xs text-zinc-400 py-4 text-center">Loading…</p>
          ) : !logs || logs.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No webhook calls recorded for this order yet.</p>
          ) : (
            logs.map((l, i) => (
              <div key={l._id || i} className="rounded border border-zinc-100">
                <button onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${WH_RESULT[l.result] || "bg-zinc-100 text-zinc-500"}`}>{l.result}</span>
                    <span className="truncate text-xs text-zinc-600">{l.currentStatus || l.shipmentStatus || "—"} (id {l.currentStatusId ?? "—"})</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-zinc-400">{formatDateTime(l.receivedAt)}</span>
                </button>
                {expanded[i] && (
                  <div className="border-t border-zinc-100 p-2">
                    <div className="mb-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
                      <span>HTTP {l.responseCode}</span>
                      <span>auth: {l.authorized ? "ok" : "fail"}</span>
                      {l.appliedStatus && <span>→ {l.appliedStatus}</span>}
                      {l.error && <span className="text-red-600">err: {l.error}</span>}
                    </div>
                    <pre className="max-h-56 overflow-auto rounded bg-zinc-50 p-2 text-[10px] leading-relaxed text-zinc-700">{JSON.stringify(l.payload, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
