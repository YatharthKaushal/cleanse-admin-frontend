"use client";

import { useState } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { adminCouponApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

export default function CouponForm({ coupon, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!coupon;

  const [form, setForm] = useState({
    code: coupon?.code || "",
    description: coupon?.description || "",
    discountType: coupon?.discountType || "percentage",
    discountValue: coupon?.discountValue ?? 0,
    minOrderValue: coupon?.minOrderValue ?? "",
    maxDiscountAmount: coupon?.maxDiscountAmount ?? "",
    validFrom: formatDateForInput(coupon?.validFrom),
    validTill: formatDateForInput(coupon?.validTill),
    usageLimit: coupon?.usageLimit ?? 0,
    perUserLimit: coupon?.perUserLimit ?? 0,
    isFirstOrderOnly: coupon?.isFirstOrderOnly ?? false,
    isActive: coupon?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError("Coupon code is required");
      return;
    }
    if (!form.validTill) {
      setError("Valid Till date is required");
      return;
    }
    if (form.discountType !== "free_shipping" && (!form.discountValue || Number(form.discountValue) <= 0)) {
      setError("Discount value is required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: form.discountType === "free_shipping" ? 0 : Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      maxDiscountAmount: form.discountType === "percentage" && form.maxDiscountAmount ? Number(form.maxDiscountAmount) : 0,
      validFrom: form.validFrom || undefined,
      validTill: form.validTill,
      usageLimit: Number(form.usageLimit) || 0,
      perUserLimit: Number(form.perUserLimit) || 0,
      isFirstOrderOnly: form.isFirstOrderOnly,
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await adminCouponApi.update(coupon._id, payload);
        showToast("Coupon updated", "success");
      } else {
        await adminCouponApi.create(payload);
        showToast("Coupon created", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 rounded-t-xl">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Edit Coupon" : "New Coupon"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME20"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors uppercase"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the coupon"
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors resize-none"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Discount Type</label>
            <select
              value={form.discountType}
              onChange={(e) => handleChange("discountType", e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors bg-white"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          {/* Discount Value */}
          {form.discountType !== "free_shipping" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Discount Value {form.discountType === "percentage" ? "(%)" : "(\u20B9)"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  {form.discountType === "percentage" ? "%" : "\u20B9"}
                </span>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => handleChange("discountValue", e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Min Order Value & Max Discount Amount */}
          <div className={`grid gap-3 ${form.discountType === "percentage" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Min Order Value <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{"\u20B9"}</span>
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) => handleChange("minOrderValue", e.target.value)}
                  min="0"
                  placeholder="0"
                  className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
            {form.discountType === "percentage" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Max Discount <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{"\u20B9"}</span>
                  <input
                    type="number"
                    value={form.maxDiscountAmount}
                    onChange={(e) => handleChange("maxDiscountAmount", e.target.value)}
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Valid From & Valid Till */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Valid From</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => handleChange("validFrom", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Valid Till <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.validTill}
                onChange={(e) => handleChange("validTill", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Usage Limit & Per User Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Usage Limit <span className="font-normal text-zinc-400">(0 = unlimited)</span>
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => handleChange("usageLimit", e.target.value)}
                min="0"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Per User Limit <span className="font-normal text-zinc-400">(0 = unlimited)</span>
              </label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) => handleChange("perUserLimit", e.target.value)}
                min="0"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </div>
          </div>

          {/* First Order Only Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("isFirstOrderOnly", !form.isFirstOrderOnly)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.isFirstOrderOnly ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  form.isFirstOrderOnly ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-zinc-700">First Order Only</span>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("isActive", !form.isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.isActive ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-zinc-700">Active</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
