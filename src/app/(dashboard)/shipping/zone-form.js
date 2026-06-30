"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Cross1Icon, CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import * as Checkbox from "@radix-ui/react-checkbox";
import { adminShippingApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

function StateMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return indianStates;
    const q = search.toLowerCase();
    return indianStates.filter((s) => s.toLowerCase().includes(q));
  }, [search]);

  const toggle = (state) => {
    onChange(
      selected.includes(state)
        ? selected.filter((s) => s !== state)
        : [...selected, state]
    );
  };

  const selectAll = () => onChange([...indianStates]);
  const clearAll = () => onChange([]);

  // Auto-focus search when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  const summary =
    selected.length === 0
      ? "Select states..."
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">States</label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-left transition-colors hover:border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none"
          >
            <span className={selected.length === 0 ? "text-zinc-400" : "text-zinc-900 truncate"}>
              {summary}
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-400 ml-2" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className="z-[100] w-[var(--radix-popover-trigger-width)] rounded-lg border border-zinc-200 bg-white shadow-lg"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search states..."
                className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="shrink-0 text-zinc-400 hover:text-zinc-600"
                >
                  <Cross1Icon className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Select All / Clear */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Select all
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-zinc-500 hover:text-red-600 transition-colors"
                >
                  Clear ({selected.length})
                </button>
              )}
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-zinc-400">No states found</p>
              ) : (
                filtered.map((state) => {
                  const checked = selected.includes(state);
                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => toggle(state)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                        checked
                          ? "bg-zinc-50 text-zinc-900"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <Checkbox.Root
                        checked={checked}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? "border-zinc-900 bg-zinc-900"
                            : "border-zinc-300 bg-white"
                        }`}
                        tabIndex={-1}
                      >
                        <Checkbox.Indicator>
                          <CheckIcon className="h-3 w-3 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="truncate">{state}</span>
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((state) => (
            <span
              key={state}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700"
            >
              {state}
              <button
                type="button"
                onClick={() => toggle(state)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <Cross1Icon className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ZoneForm({ zone, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!zone;

  const [form, setForm] = useState({
    name: zone?.name || "",
    pincodes: zone?.pincodes?.join(", ") || "",
    states: zone?.states || [],
    standardRate: zone?.rates?.standard ?? 99,
    expressRate: zone?.rates?.express ?? 149,
    freeAbove: zone?.rates?.freeAbove ?? 1200,
    standardDays: zone?.estimatedDays?.standard || "3-5",
    expressDays: zone?.estimatedDays?.express || "1-2",
    isActive: zone?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Zone name is required");
      return;
    }

    setSaving(true);
    setError("");

    const pincodeList = form.pincodes
      .split(/[,\s\n]+/)
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    const payload = {
      name: form.name.trim(),
      pincodes: pincodeList,
      states: form.states,
      rates: {
        standard: Number(form.standardRate) || 99,
        express: Number(form.expressRate) || 149,
        freeAbove: Number(form.freeAbove) || 1200,
      },
      estimatedDays: {
        standard: form.standardDays || "3-5",
        express: form.expressDays || "1-2",
      },
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await adminShippingApi.update(zone._id, payload);
        showToast("Shipping zone updated", "success");
      } else {
        await adminShippingApi.create(payload);
        showToast("Shipping zone created", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save zone");
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
            {isEdit ? "Edit Shipping Zone" : "New Shipping Zone"}
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

          {/* Zone Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Zone Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Metro Cities"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
          </div>

          {/* Pincodes */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Pincodes <span className="font-normal text-zinc-400">(comma-separated, 6 digits each)</span>
            </label>
            <textarea
              value={form.pincodes}
              onChange={(e) => handleChange("pincodes", e.target.value)}
              placeholder="110001, 110002, 400001..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors resize-none"
            />
          </div>

          {/* States */}
          <StateMultiSelect
            selected={form.states}
            onChange={(states) => handleChange("states", states)}
          />

          {/* Rates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Standard Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">&#8377;</span>
                <input
                  type="number"
                  value={form.standardRate}
                  onChange={(e) => handleChange("standardRate", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Express Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">&#8377;</span>
                <input
                  type="number"
                  value={form.expressRate}
                  onChange={(e) => handleChange("expressRate", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Free Above</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">&#8377;</span>
                <input
                  type="number"
                  value={form.freeAbove}
                  onChange={(e) => handleChange("freeAbove", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Estimated Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Standard Days</label>
              <input
                type="text"
                value={form.standardDays}
                onChange={(e) => handleChange("standardDays", e.target.value)}
                placeholder="3-5"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Express Days</label>
              <input
                type="text"
                value={form.expressDays}
                onChange={(e) => handleChange("expressDays", e.target.value)}
                placeholder="1-2"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
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
              {saving ? "Saving..." : isEdit ? "Update Zone" : "Create Zone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
