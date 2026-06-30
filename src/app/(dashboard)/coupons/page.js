"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { adminCouponApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ConfirmDialog from "@/components/confirm-dialog";
import StatusBadge from "@/components/status-badge";
import CouponForm from "./coupon-form";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
];

function formatDiscount(coupon) {
  if (coupon.discountType === "percentage") return `${coupon.discountValue}%`;
  if (coupon.discountType === "fixed") return `\u20B9${coupon.discountValue}`;
  if (coupon.discountType === "free_shipping") return "Free Shipping";
  return "—";
}

function isExpired(coupon) {
  return !!coupon.validTill && new Date(coupon.validTill).getTime() < Date.now();
}

export default function CouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.status = statusFilter;
      const data = await adminCouponApi.list(params);
      setCoupons(Array.isArray(data?.coupons) ? data.coupons : Array.isArray(data) ? data : []);
      if (data?.pagination) setPagination(data.pagination);
    } catch {
      showToast("Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminCouponApi.delete(deleteTarget._id);
      showToast("Coupon deleted", "success");
      setDeleteTarget(null);
      fetchCoupons();
    } catch {
      showToast("Failed to delete coupon", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await adminCouponApi.update(coupon._id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch {
      showToast("Failed to update coupon", "error");
    }
  };

  const openCreate = () => {
    setEditCoupon(null);
    setFormOpen(true);
  };

  const openEdit = (coupon) => {
    setEditCoupon(coupon);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditCoupon(null);
    fetchCoupons();
  };

  // Active (non-expired) first, expired last; stable within each group.
  const sortedCoupons = [...coupons].sort(
    (a, b) => Number(isExpired(a)) - Number(isExpired(b))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Coupons</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage discount coupons and promotional codes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/special-coupons/new"
            className="flex items-center gap-2 rounded-lg border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add Special Coupon
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add Coupon
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by coupon code..."
          className="w-full sm:max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
        />
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <PlusIcon className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-base font-medium text-zinc-700">No coupons found</h3>
          <p className="mb-6 text-sm text-zinc-500">Create your first coupon to offer discounts to customers.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add Coupon
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Min Order</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Usage</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Valid Till</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCoupons.map((coupon) => (
                  <tr
                    key={coupon._id}
                    className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                    onClick={() => openEdit(coupon)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 font-mono">{coupon.code}</td>
                    <td className="px-4 py-3 text-zinc-600 max-w-[200px] truncate">
                      {coupon.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 capitalize">
                      {coupon.discountType === "free_shipping"
                        ? "Free Shipping"
                        : coupon.discountType === "percentage"
                          ? "Percentage"
                          : "Fixed"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDiscount(coupon)}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {coupon.minOrderValue ? `\u20B9${coupon.minOrderValue}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {coupon.usageLimit
                        ? `${coupon.usageCount || 0}/${coupon.usageLimit}`
                        : "Unlimited"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {coupon.validTill
                        ? new Date(coupon.validTill).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isExpired(coupon) ? (
                        <StatusBadge expired />
                      ) : (
                        <button onClick={() => handleToggleActive(coupon)}>
                          <StatusBadge active={coupon.isActive} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil1Icon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(coupon)}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
              <p className="text-sm text-zinc-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} coupons
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
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
                ))}
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Coupon"
        description={`Are you sure you want to delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Create/Edit form dialog */}
      {formOpen && (
        <CouponForm
          coupon={editCoupon}
          onClose={() => { setFormOpen(false); setEditCoupon(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
