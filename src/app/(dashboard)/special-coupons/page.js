"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  CopyIcon,
  DotsVerticalIcon,
} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { adminSpecialCouponApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ConfirmDialog from "@/components/confirm-dialog";
import StatusBadge from "@/components/status-badge";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
];

const TYPE_TABS = [
  { label: "All Types", value: "" },
  { label: "Buy X Get Y", value: "bxgy" },
  { label: "Volume", value: "volume_discount" },
  { label: "Spend Threshold", value: "spend_threshold" },
  { label: "Bundle Price", value: "fixed_price_bundle" },
  { label: "Free Gift", value: "free_gift" },
  { label: "Shipping", value: "tiered_shipping" },
];

const METHOD_TABS = [
  { label: "All", value: "" },
  { label: "Automatic", value: "automatic" },
  { label: "Code", value: "code" },
];

const TYPE_LABELS = {
  bxgy: "Buy X Get Y",
  volume_discount: "Volume Discount",
  spend_threshold: "Spend Threshold",
  fixed_price_bundle: "Fixed Price Bundle",
  free_gift: "Free Gift",
  tiered_shipping: "Tiered Shipping",
};

const TYPE_COLORS = {
  bxgy: "bg-purple-50 text-purple-700",
  volume_discount: "bg-blue-50 text-blue-700",
  spend_threshold: "bg-amber-50 text-amber-700",
  fixed_price_bundle: "bg-emerald-50 text-emerald-700",
  free_gift: "bg-pink-50 text-pink-700",
  tiered_shipping: "bg-cyan-50 text-cyan-700",
};

function formatValueSummary(promo) {
  switch (promo.promotionType) {
    case "bxgy": {
      const buy = promo.buyCondition?.minQuantity || "?";
      const get = promo.getReward?.quantity || "?";
      const reward = promo.getReward?.type === "free"
        ? "Free"
        : promo.getReward?.type === "percentage_off"
          ? `${promo.getReward.discountValue}% off`
          : promo.getReward?.type === "fixed_off"
            ? `\u20B9${promo.getReward.discountValue} off`
            : "";
      return `Buy ${buy} Get ${get} ${reward}`;
    }
    case "volume_discount": {
      const tiers = promo.volumeTiers || [];
      if (tiers.length === 0) return "--";
      const first = tiers[0];
      const last = tiers[tiers.length - 1];
      return `${first.minQuantity}+ @ ${first.discountValue}${first.discountType === "percentage" ? "%" : "\u20B9"} - ${last.minQuantity}+ @ ${last.discountValue}${last.discountType === "percentage" ? "%" : "\u20B9"}`;
    }
    case "spend_threshold":
      return `Spend \u20B9${promo.buyCondition?.minAmount || 0}`;
    case "fixed_price_bundle":
      return `\u20B9${promo.fixedPriceBundle?.fixedPrice || 0} bundle`;
    case "free_gift":
      return "Free gift";
    case "tiered_shipping":
      return promo.shippingTier?.discountType === "percentage"
        ? `${promo.shippingTier.discountValue}% off shipping`
        : `\u20B9${promo.shippingTier?.discountValue || 0} shipping`;
    default:
      return "--";
  }
}

export default function SpecialCouponsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.promotionType = typeFilter;
      if (methodFilter) params.applicationMethod = methodFilter;
      const data = await adminSpecialCouponApi.list(params);
      setPromotions(Array.isArray(data?.promotions) ? data.promotions : []);
      if (data?.pagination) setPagination(data.pagination);
    } catch {
      showToast("Failed to load promotions", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, page, debouncedSearch, statusFilter, typeFilter, methodFilter]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminSpecialCouponApi.delete(deleteTarget._id);
      showToast("Promotion deleted", "success");
      setDeleteTarget(null);
      fetchPromotions();
    } catch {
      showToast("Failed to delete promotion", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleClone = async (promo) => {
    try {
      await adminSpecialCouponApi.clone(promo._id);
      showToast("Promotion cloned", "success");
      fetchPromotions();
    } catch {
      showToast("Failed to clone promotion", "error");
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await adminSpecialCouponApi.update(promo._id, { isActive: !promo.isActive });
      fetchPromotions();
    } catch {
      showToast("Failed to update promotion", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Special Coupons</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage advanced promotions: BOGO, volume discounts, free gifts, and more
          </p>
        </div>
        <Link
          href="/special-coupons/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add Special Coupon
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or code..."
          className="w-full sm:max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
        />
        {/* Status filter */}
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
        {/* Method filter */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {METHOD_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setMethodFilter(tab.value); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                methodFilter === tab.value
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors bg-white"
        >
          {TYPE_TABS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <PlusIcon className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-base font-medium text-zinc-700">No special promotions found</h3>
          <p className="mb-6 text-sm text-zinc-500">Create your first special promotion to offer advanced deals.</p>
          <Link
            href="/special-coupons/new"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add Special Coupon
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Method</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Valid Till</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Usage</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr
                    key={promo._id}
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/special-coupons/${promo._id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{promo.title}</div>
                      <div className="text-xs text-zinc-400 truncate max-w-[200px]">{promo.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[promo.promotionType] || "bg-zinc-100 text-zinc-600"}`}>
                        {TYPE_LABELS[promo.promotionType] || promo.promotionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 capitalize">
                      {promo.applicationMethod}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600">
                      {promo.code || "--"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs max-w-[200px] truncate">
                      {formatValueSummary(promo)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {promo.validTill
                        ? new Date(promo.validTill).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {promo.usageLimit
                        ? `${promo.usageCount || 0}/${promo.usageLimit}`
                        : "Unlimited"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{promo.priority}</td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleActive(promo); }}>
                        <StatusBadge active={promo.isActive} />
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
                            <DotsVerticalIcon className="h-4 w-4" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 min-w-[160px] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
                            sideOffset={4}
                            align="end"
                          >
                            <DropdownMenu.Item
                              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                              onClick={() => router.push(`/special-coupons/${promo._id}`)}
                            >
                              <Pencil1Icon className="h-4 w-4" />
                              Edit
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                              onClick={() => handleClone(promo)}
                            >
                              <CopyIcon className="h-4 w-4" />
                              Clone
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                              onClick={() => handleToggleActive(promo)}
                            >
                              {promo.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-zinc-200" />
                            <DropdownMenu.Item
                              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                              onClick={() => setDeleteTarget(promo)}
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
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
                Showing {(pagination.page - 1) * pagination.limit + 1}--
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} promotions
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
        title="Delete Promotion"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
