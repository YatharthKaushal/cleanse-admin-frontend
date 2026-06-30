"use client";

import { useState } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { adminSpinWheelApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

export default function PrizeForm({ prize, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!prize;

  const [form, setForm] = useState({
    label: prize?.label || "",
    value: prize?.value || "",
    weight: prize?.weight ?? 0,
    discountType: prize?.discountType || "",
    discountValue: prize?.discountValue ?? 0,
    color: prize?.color || "#4F2C22",
    textColor: prize?.textColor || "#F0EDE8",
    isActive: prize?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-generate value slug from label when creating
  const handleLabelChange = (val) => {
    handleChange("label", val);
    if (!isEdit) {
      handleChange("value", val.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/\s+/g, ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) {
      setError("Label is required");
      return;
    }
    if (!form.value.trim()) {
      setError("Value/slug is required");
      return;
    }
    if (form.weight < 0 || form.weight > 100) {
      setError("Weight must be between 0 and 100");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      label: form.label.trim(),
      value: form.value.trim().toLowerCase(),
      weight: Number(form.weight),
      discountType: form.discountType || null,
      discountValue: form.discountType && form.discountType !== "free_shipping" ? Number(form.discountValue) : 0,
      color: form.color,
      textColor: form.textColor,
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await adminSpinWheelApi.updatePrize(prize._id, payload);
        showToast("Prize updated", "success");
      } else {
        await adminSpinWheelApi.createPrize(payload);
        showToast("Prize created", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save prize");
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
            {isEdit ? "Edit Prize" : "New Prize"}
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

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Label</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. 10% OFF"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
          </div>

          {/* Value/Slug */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Value <span className="font-normal text-zinc-400">(slug, unique)</span>
            </label>
            <input
              type="text"
              value={form.value}
              onChange={(e) => handleChange("value", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="e.g. 10off"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors font-mono"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Weight <span className="font-normal text-zinc-400">(0–100, probability)</span>
            </label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              min="0"
              max="100"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
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
              <option value="">None (Try Again)</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          {/* Discount Value */}
          {form.discountType && form.discountType !== "free_shipping" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Discount Value {form.discountType === "percentage" ? "(%)" : "\u20B9"}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => handleChange("discountValue", e.target.value)}
                min="0"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </div>
          )}

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Segment Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  title="Click to choose a color"
                  className="color-swatch h-10 w-10 shrink-0 rounded-lg border border-zinc-300 shadow-sm cursor-pointer hover:border-zinc-400 transition-colors"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 font-mono focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  title="Click to choose a color"
                  className="color-swatch h-10 w-10 shrink-0 rounded-lg border border-zinc-300 shadow-sm cursor-pointer hover:border-zinc-400 transition-colors"
                />
                <input
                  type="text"
                  value={form.textColor}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 font-mono focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
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
              {saving ? "Saving..." : isEdit ? "Update Prize" : "Create Prize"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
