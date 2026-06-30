"use client";

import Toggle from "@/components/toggle";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

// The storefront promo bar renders exactly three positional slots
// (left / center / right), keyed by array index — see frontend page.js.
const SLOTS = [
  { label: "Left Message", placeholder: "100% NATURAL INGREDIENTS" },
  { label: "Center Message", placeholder: "FREE SHIPPING ON ORDERS ABOVE Rs.1200" },
  { label: "Right Message", placeholder: "AYURVEDIC & DOCTOR APPROVED" },
];

export default function CmsPromoBarEditor({ data, onChange }) {
  // enabled defaults to true (matches storefront default).
  const enabled = data.enabled !== false;
  const messages = data.messages || [];

  const updateMessage = (index, value) => {
    const next = [...messages];
    // Pad so index positions stay stable even if earlier slots are empty.
    while (next.length <= index) next.push("");
    next[index] = value;
    onChange({ ...data, messages: next });
  };

  const toggleEnabled = (value) => onChange({ ...data, enabled: value });

  return (
    <div className="space-y-5">
      <Toggle
        checked={enabled}
        onCheckedChange={toggleEnabled}
        label="Show promo bar on storefront"
      />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">Bar Messages</h3>
        {SLOTS.map((slot, i) => (
          <div key={i}>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              {slot.label}
            </label>
            <input
              type="text"
              value={messages[i] || ""}
              onChange={(e) => updateMessage(i, e.target.value)}
              placeholder={slot.placeholder}
              className={inputClass}
            />
          </div>
        ))}
        <p className="text-xs text-zinc-400">
          Leave a field empty to hide that slot&apos;s text.
        </p>
      </div>
    </div>
  );
}
