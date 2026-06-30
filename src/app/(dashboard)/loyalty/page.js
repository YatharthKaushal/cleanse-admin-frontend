"use client";

import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, Cross1Icon } from "@radix-ui/react-icons";
import { adminLoyaltyApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

function txTypeBadge(type) {
  const map = {
    earned: "bg-green-50 text-green-700",
    redeemed: "bg-blue-50 text-blue-700",
    expired: "bg-zinc-100 text-zinc-600",
    referral_bonus: "bg-purple-50 text-purple-700",
    reversed: "bg-red-50 text-red-700",
    manual_adjustment: "bg-yellow-50 text-yellow-700",
  };
  return map[type] || "bg-zinc-100 text-zinc-600";
}

function UserDetailModal({ userId, onClose, refetchUsers }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminLoyaltyApi.getUserTransactions(userId, { page, limit: 20 });
      setData(d);
    } catch {
      showToast("Failed to load user transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, page, showToast]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  const handleAdjust = async () => {
    const points = parseInt(adjustPoints, 10);
    if (!Number.isFinite(points) || points === 0) {
      showToast("Enter a non-zero number", "error");
      return;
    }
    if (!adjustReason.trim()) {
      showToast("Reason is required", "error");
      return;
    }
    setAdjusting(true);
    try {
      await adminLoyaltyApi.adjust(userId, points, adjustReason.trim());
      showToast("Points adjusted", "success");
      setAdjustPoints("");
      setAdjustReason("");
      await fetchData();
      refetchUsers?.();
    } catch (err) {
      showToast(err?.response?.data?.message || "Adjust failed", "error");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg mx-4">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 rounded-t-xl">
          <h2 className="text-base font-semibold text-zinc-900">
            Loyalty Details
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        {loading && !data ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
        ) : (
          <div className="p-5 space-y-5">
            {data?.user && (
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {data.user.fullName}
                </p>
                <p className="text-xs text-zinc-500">{data.user.email}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-2">
                  {data.user.loyaltyPoints} points
                </p>
              </div>
            )}

            {/* Manual adjustment */}
            <div className="rounded-lg border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Manual Adjustment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Points (+/-)"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Reason (required)"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`${inputClass} sm:col-span-2`}
                />
              </div>
              <button
                type="button"
                onClick={handleAdjust}
                disabled={adjusting}
                className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {adjusting ? "Saving..." : "Adjust Balance"}
              </button>
            </div>

            {/* Transactions */}
            <div className="rounded-lg border border-zinc-200">
              <div className="border-b border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900">
                Transactions
              </div>
              {data?.transactions?.length === 0 ? (
                <div className="p-4 text-sm text-zinc-400">No transactions</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data?.transactions?.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between p-3">
                      <div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${txTypeBadge(tx.type)}`}>
                          {tx.type}
                        </span>
                        <p className="text-xs text-zinc-600 mt-1">
                          {tx.description}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(tx.createdAt).toLocaleString()}
                          {tx.order?.orderId ? ` · ${tx.order.orderId}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          tx.points >= 0 ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data?.pagination?.pages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="text-xs text-zinc-600 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-zinc-500">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= data.pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-xs text-zinc-600 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLoyaltyPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminLoyaltyApi.listUsers({ page, limit: 20, search });
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminLoyaltyApi.stats();
      setStats(data);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Loyalty Program</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          View customer balances and adjust points
        </p>
      </div>

      {stats?.totals && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total Customers</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">
              {stats.totals.totalUsers}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">With Points</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">
              {stats.totals.usersWithPoints}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total Outstanding</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">
              {stats.totals.totalPointsOutstanding}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Highest Balance</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">
              {stats.totals.maxBalance}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-4">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">Points</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="cursor-pointer hover:bg-zinc-50"
                    onClick={() => setSelectedUserId(u._id)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{u.fullName}</td>
                    <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                      {u.loyaltyPoints}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u._id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View / Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs text-zinc-600 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs text-zinc-600 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          refetchUsers={() => {
            fetchUsers();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
