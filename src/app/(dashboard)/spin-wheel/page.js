"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { adminSpinWheelApi, adminSettingsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ConfirmDialog from "@/components/confirm-dialog";
import StatusBadge from "@/components/status-badge";
import PrizeForm from "./prize-form";

const TABS = [
  { label: "Prizes", value: "prizes" },
  { label: "Entries", value: "entries" },
];

function formatDiscount(prize) {
  if (!prize.discountType) return "None";
  if (prize.discountType === "percentage") return `${prize.discountValue}%`;
  if (prize.discountType === "fixed") return `\u20B9${prize.discountValue}`;
  if (prize.discountType === "free_shipping") return "Free Shipping";
  return "\u2014";
}

export default function SpinWheelPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("prizes");

  // Feature toggle
  const [spinWheelEnabled, setSpinWheelEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Prizes state
  const [prizes, setPrizes] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [prizesLoading, setPrizesLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editPrize, setEditPrize] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  // Entries state
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const debounceRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch settings for toggle state
  useEffect(() => {
    adminSettingsApi.get().then((data) => {
      if (data?.spinWheelEnabled !== undefined) {
        setSpinWheelEnabled(data.spinWheelEnabled);
      }
    }).catch(() => {});
  }, []);

  // Fetch prizes
  const fetchPrizes = useCallback(async () => {
    setPrizesLoading(true);
    try {
      const data = await adminSpinWheelApi.listPrizes();
      setPrizes(Array.isArray(data?.prizes) ? data.prizes : []);
      setTotalWeight(data?.totalWeight ?? 0);
    } catch {
      showToast("Failed to load prizes", "error");
    } finally {
      setPrizesLoading(false);
    }
  }, [showToast]);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const data = await adminSpinWheelApi.listEntries(params);
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
      if (data?.pagination) setPagination(data.pagination);
    } catch {
      showToast("Failed to load entries", "error");
    } finally {
      setEntriesLoading(false);
    }
  }, [showToast, page, debouncedSearch]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "prizes") fetchPrizes();
  }, [activeTab, fetchPrizes]);

  useEffect(() => {
    if (activeTab === "entries") fetchEntries();
  }, [activeTab, fetchEntries]);

  // Toggle spin wheel
  const handleToggle = async () => {
    setToggling(true);
    try {
      await adminSpinWheelApi.toggle(!spinWheelEnabled);
      setSpinWheelEnabled(!spinWheelEnabled);
      showToast(`Spin wheel ${!spinWheelEnabled ? "enabled" : "disabled"}`, "success");
    } catch {
      showToast("Failed to toggle spin wheel", "error");
    } finally {
      setToggling(false);
    }
  };

  // Prize actions
  const handleDeletePrize = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminSpinWheelApi.deletePrize(deleteTarget._id);
      showToast("Prize deleted", "success");
      setDeleteTarget(null);
      fetchPrizes();
    } catch {
      showToast("Failed to delete prize", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (prize) => {
    try {
      await adminSpinWheelApi.updatePrize(prize._id, { isActive: !prize.isActive });
      fetchPrizes();
    } catch {
      showToast("Failed to update prize", "error");
    }
  };

  const openCreate = () => {
    setEditPrize(null);
    setFormOpen(true);
  };

  const openEdit = (prize) => {
    setEditPrize(prize);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditPrize(null);
    fetchPrizes();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Spin Wheel</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage spin wheel prizes, view entries, and control the popup
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">Popup</span>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                spinWheelEnabled ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  spinWheelEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {activeTab === "prizes" && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add Prize
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 w-fit mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prizes Tab */}
      {activeTab === "prizes" && (
        <>
          {/* Weight warning */}
          {!prizesLoading && prizes.length > 0 && totalWeight !== 100 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Total weight is <strong>{totalWeight}</strong> (should be 100). Prizes will still work
              but probabilities may not match your intent.
            </div>
          )}

          {prizesLoading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
              Loading...
            </div>
          ) : prizes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
              <PlusIcon className="mb-4 h-12 w-12 text-zinc-300" />
              <h3 className="mb-1 text-base font-medium text-zinc-700">No prizes configured</h3>
              <p className="mb-6 text-sm text-zinc-500">Add prizes to enable the spin wheel.</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                <PlusIcon className="h-4 w-4" />
                Add Prize
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Label</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Value</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Weight</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Discount</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Colors</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map((prize) => (
                      <tr
                        key={prize._id}
                        className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                        onClick={() => openEdit(prize)}
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">{prize.label}</td>
                        <td className="px-4 py-3 text-zinc-600 font-mono text-xs">{prize.value}</td>
                        <td className="px-4 py-3 text-zinc-600">{prize.weight}%</td>
                        <td className="px-4 py-3 text-zinc-600">{formatDiscount(prize)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-5 w-5 rounded border border-zinc-200"
                              style={{ background: prize.color }}
                              title={`BG: ${prize.color}`}
                            />
                            <span
                              className="inline-block h-5 w-5 rounded border border-zinc-200"
                              style={{ background: prize.textColor }}
                              title={`Text: ${prize.textColor}`}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleToggleActive(prize)}>
                            <StatusBadge active={prize.isActive} />
                          </button>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(prize)}
                              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil1Icon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(prize)}
                              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total weight footer */}
              <div className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500">
                Total weight: <strong className={totalWeight === 100 ? "text-emerald-600" : "text-amber-600"}>{totalWeight}</strong> / 100
              </div>
            </div>
          )}
        </>
      )}

      {/* Entries Tab */}
      {activeTab === "entries" && (
        <>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email..."
              className="w-full max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
          </div>

          {entriesLoading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
              <h3 className="mb-1 text-base font-medium text-zinc-700">No entries found</h3>
              <p className="text-sm text-zinc-500">Spin entries will appear here once users start spinning.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Prize</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Coupon</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Redeemed</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">User</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Expires</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3 text-zinc-900">{entry.email}</td>
                        <td className="px-4 py-3 text-zinc-600 font-medium">{entry.prize}</td>
                        <td className="px-4 py-3 text-zinc-600 font-mono text-xs">
                          {entry.couponCode || "\u2014"}
                        </td>
                        <td className="px-4 py-3">
                          {entry.isRedeemed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircledIcon className="h-3.5 w-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-zinc-400">
                              <CrossCircledIcon className="h-3.5 w-3.5" /> No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {entry.user?.fullName || entry.user?.email || "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {entry.expiresAt
                            ? new Date(entry.expiresAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                    {pagination.total} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      let p;
                      if (pagination.pages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= pagination.pages - 2) {
                        p = pagination.pages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-zinc-900 text-white"
                              : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Prize"
        description={`Are you sure you want to delete "${deleteTarget?.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeletePrize}
        loading={deleteLoading}
      />

      {/* Create/Edit form dialog */}
      {formOpen && (
        <PrizeForm
          prize={editPrize}
          onClose={() => { setFormOpen(false); setEditPrize(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
