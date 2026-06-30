"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MagnifyingGlassIcon, Cross1Icon, EyeOpenIcon } from "@radix-ui/react-icons";
import { adminCustomerApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

function orderStatusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return "bg-green-50 text-green-700";
  if (s === "processing" || s === "confirmed") return "bg-yellow-50 text-yellow-700";
  if (s === "cancelled" || s === "failed") return "bg-red-50 text-red-700";
  if (s === "shipped" || s === "dispatched") return "bg-blue-50 text-blue-700";
  if (s === "pending") return "bg-zinc-100 text-zinc-600";
  return "bg-zinc-100 text-zinc-600";
}

function CustomerDetailModal({ customerId, onClose }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    adminCustomerApi
      .get(customerId)
      .then((d) => setData(d))
      .catch(() => showToast("Failed to load customer details", "error"))
      .finally(() => setLoading(false));
  }, [customerId, showToast]);

  const customer = data?.customer;
  const orders = data?.orders || [];
  const addresses = data?.addresses || [];
  const loyaltyTransactions = data?.loyaltyTransactions || [];
  const referralCount = data?.referralCount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 rounded-t-xl">
          <h2 className="text-base font-semibold text-zinc-900">Customer Details</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Loading customer details...</div>
        ) : !customer ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Customer not found</div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Customer Info Header */}
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
              <h3 className="text-lg font-semibold text-zinc-900">{customer.fullName}</h3>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div>
                  <span className="text-zinc-500">Email:</span>{" "}
                  <span className="text-zinc-700">{customer.email}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Phone:</span>{" "}
                  <span className="text-zinc-700">
                    {customer.countryCode || "+91"} {customer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Joined:</span>{" "}
                  <span className="text-zinc-700">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Loyalty Points:</span>{" "}
                  <span className="text-zinc-700 font-medium">{customer.loyaltyPoints ?? 0}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Referrals:</span>{" "}
                  <span className="text-zinc-700 font-medium">{referralCount}</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">Recent Orders</h4>
              {orders.length === 0 ? (
                <p className="text-sm text-zinc-400">No orders found</p>
              ) : (
                <div className="rounded-lg border border-zinc-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Order #</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Total</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 10).map((order) => (
                        <tr
                          key={order._id}
                          className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                        >
                          <td className="px-3 py-2 font-medium text-zinc-900">
                            {order.orderNumber || order._id?.slice(-8)}
                          </td>
                          <td className="px-3 py-2 text-zinc-600">
                            &#8377;{order.total ?? order.totalAmount ?? 0}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-zinc-600">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Addresses */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">Addresses</h4>
              {addresses.length === 0 ? (
                <p className="text-sm text-zinc-400">No addresses found</p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr, idx) => (
                    <div
                      key={addr._id || idx}
                      className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-700"
                    >
                      {[addr.line1 || addr.addressLine1, addr.line2 || addr.addressLine2, addr.city, addr.state, addr.pincode || addr.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                      {addr.label && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {addr.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loyalty Transactions */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">Loyalty Transactions</h4>
              {loyaltyTransactions.length === 0 ? (
                <p className="text-sm text-zinc-400">No loyalty transactions found</p>
              ) : (
                <div className="rounded-lg border border-zinc-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Points</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Description</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loyaltyTransactions.map((txn, idx) => (
                        <tr
                          key={txn._id || idx}
                          className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                        >
                          <td className="px-3 py-2 text-zinc-900 capitalize">{txn.type || "—"}</td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                (txn.points ?? 0) >= 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {(txn.points ?? 0) >= 0 ? "+" : ""}
                              {txn.points ?? 0}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-zinc-600">{txn.description || "—"}</td>
                          <td className="px-3 py-2 text-zinc-600">
                            {txn.createdAt
                              ? new Date(txn.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState(null);
  const debounceRef = useRef(null);

  const fetchCustomers = useCallback(
    async (p = page, q = search) => {
      setLoading(true);
      try {
        const data = await adminCustomerApi.list({ page: p, limit: 20, search: q || undefined });
        setCustomers(data.customers || []);
        setPagination(data.pagination || { total: 0, page: p, pages: 1, limit: 20 });
      } catch {
        showToast("Failed to load customers", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, search, showToast]
  );

  useEffect(() => {
    fetchCustomers(page, search);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, value);
    }, 400);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Customers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your customer base</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <Cross1Icon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <h3 className="mb-1 text-base font-medium text-zinc-700">No customers found</h3>
          <p className="text-sm text-zinc-500">
            {search ? "Try adjusting your search terms." : "Customers will appear here once they sign up."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Loyalty Points</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                    onClick={() => setDetailId(customer._id)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{customer.fullName}</td>
                    <td className="px-4 py-3 text-zinc-600">{customer.email}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {customer.countryCode || "+91"} {customer.phone}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{customer.loyaltyPoints ?? 0}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(customer._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                          <EyeOpenIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
              <p className="text-sm text-zinc-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} customers
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((p) => {
                    const current = pagination.page;
                    return p === 1 || p === pagination.pages || Math.abs(p - current) <= 1;
                  })
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`dots-${idx}`} className="px-1.5 text-xs text-zinc-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          item === pagination.page
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      {detailId && (
        <CustomerDetailModal
          customerId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
