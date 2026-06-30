"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, ChevronDownIcon } from "@radix-ui/react-icons";

// All available icons — same set used in store frontend product detail page
const ICON_CATALOG = [
  { id: "plant", label: "Plant / Leaf", category: "ingredients" },
  { id: "dropper", label: "Dropper", category: "ingredients" },
  { id: "leaf", label: "Leaf", category: "ingredients" },
  { id: "saffron", label: "Saffron", category: "ingredients" },
  { id: "lotus", label: "Lotus", category: "ingredients" },
  { id: "noparaben", label: "No Paraben", category: "ingredients" },
  { id: "chemical", label: "Chemical / No Chemical", category: "ingredients" },
  { id: "paw", label: "Cruelty Free", category: "values" },
  { id: "check", label: "Check / Quality", category: "values" },
  { id: "shield", label: "Shield / Protection", category: "values" },
  { id: "certificate", label: "Certificate", category: "values" },
  { id: "wash", label: "Wash / Cleanse", category: "howToUse" },
  { id: "drops", label: "Drops", category: "howToUse" },
  { id: "hands", label: "Hands / Warm", category: "howToUse" },
  { id: "massage", label: "Massage", category: "howToUse" },
  { id: "moon", label: "Moon / Night", category: "howToUse" },
  { id: "repeat", label: "Repeat / Cycle", category: "howToUse" },
  { id: "sun", label: "Sun / Store", category: "policies" },
  { id: "calendar", label: "Calendar / Shelf Life", category: "policies" },
  { id: "test", label: "Test / Patch Test", category: "policies" },
  { id: "external", label: "External Use", category: "policies" },
  { id: "truck", label: "Truck / Shipping", category: "shipping" },
  { id: "clock", label: "Clock / Time", category: "shipping" },
  { id: "express", label: "Express / Fast", category: "shipping" },
  { id: "globe", label: "Globe / Worldwide", category: "shipping" },
  { id: "returnbox", label: "Return Box", category: "shipping" },
];

// SVG icon renderer — mirrors store frontend ValueIcon
const s = { viewBox: "0 0 40 40", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" };

const ICON_SVGS = {
  plant: <svg {...s}><path d="M20 32V20" /><path d="M20 20c0-6 4-10 10-12-2 6-6 10-10 12z" /><path d="M20 24c0-5-3.5-8.5-9-10 1.5 5 5 8.5 9 10z" /></svg>,
  dropper: <svg {...s}><path d="M28 8l4 4-3 3" /><path d="M24 12l-12 12c-1 1-1 3 0 4s3 1 4 0l12-12" /><path d="M20 16l4 4" /></svg>,
  leaf: <svg {...s}><path d="M12 32c0-12 6-18 18-20-2 12-8 18-18 20z" /><path d="M12 32C16 24 22 18 30 12" /></svg>,
  paw: <svg {...s}><ellipse cx="20" cy="24" rx="5" ry="4" /><circle cx="14" cy="18" r="2.5" /><circle cx="26" cy="18" r="2.5" /><circle cx="10" cy="23" r="2" /><circle cx="30" cy="23" r="2" /></svg>,
  chemical: <svg {...s}><path d="M20 8v8" /><path d="M20 8c0-1 3-1 3 0" /><path d="M20 8c0-1-3-1-3 0" /><path d="M15 16l-5 12c-1 2 1 4 3 4h14c2 0 4-2 3-4l-5-12" /><path d="M15 16h10" /><line x1="14" y1="26" x2="26" y2="26" strokeDasharray="2 2" /></svg>,
  lotus: <svg {...s}><path d="M20 10c-2 6-2 12 0 18" /><path d="M20 10c2 6 2 12 0 18" /><path d="M20 12c-5 2-9 6-10 12 4-1 8-4 10-8" /><path d="M20 12c5 2 9 6 10 12-4-1-8-4-10-8" /><path d="M20 16c-8 1-13 5-14 10 5 0 10-3 14-8" /><path d="M20 16c8 1 13 5 14 10-5 0-10-3-14-8" /></svg>,
  saffron: <svg {...s}><path d="M20 8v24" /><path d="M20 14c-3-2-6-1-8 1 3 0 6 1 8 4" /><path d="M20 14c3-2 6-1 8 1-3 0-6 1-8 4" /><path d="M20 22c-3-1-6 0-7 2 2 0 5 0 7 3" /><path d="M20 22c3-1 6 0 7 2-2 0-5 0-7 3" /></svg>,
  noparaben: <svg {...s}><circle cx="20" cy="20" r="10" /><line x1="13" y1="13" x2="27" y2="27" /><text x="17" y="23" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">P</text></svg>,
  wash: <svg {...s}><path d="M12 18c0-5 3.5-8 8-8s8 3 8 8" /><path d="M10 22c2-2 4-3 6-3" /><path d="M24 19c2 0 4 1 6 3" /><path d="M14 28c2-4 4-6 6-6s4 2 6 6" /><circle cx="20" cy="14" r="1" fill="currentColor" /></svg>,
  drops: <svg {...s}><path d="M14 14c0 0-4 5-4 8a4 4 0 008 0c0-3-4-8-4-8z" /><path d="M22 10c0 0-3 4-3 6a3 3 0 006 0c0-2-3-6-3-6z" /><path d="M28 16c0 0-2 3-2 5a2 2 0 004 0c0-2-2-5-2-5z" /></svg>,
  hands: <svg {...s}><path d="M10 24c2-6 5-10 10-10s8 4 10 10" /><path d="M14 26c1-2 3-4 6-4s5 2 6 4" /><path d="M10 24c-1 2 0 4 2 5h16c2-1 3-3 2-5" /></svg>,
  massage: <svg {...s}><circle cx="20" cy="16" r="6" /><path d="M16 22c-2 2-3 4-3 6" /><path d="M24 22c2 2 3 4 3 6" /><path d="M14 12l-4-2" /><path d="M26 12l4-2" /><path d="M20 10V7" /></svg>,
  moon: <svg {...s}><path d="M26 20a8 8 0 11-10-10 6 6 0 0010 10z" /><circle cx="28" cy="10" r="1" fill="currentColor" /><circle cx="32" cy="14" r="0.5" fill="currentColor" /><circle cx="30" cy="8" r="0.5" fill="currentColor" /></svg>,
  repeat: <svg {...s}><path d="M28 14a8 8 0 01-1 11.5A8 8 0 0113 26" /><path d="M12 26a8 8 0 011-11.5A8 8 0 0127 14" /><polyline points="28 10 28 14 24 14" /><polyline points="12 30 12 26 16 26" /></svg>,
  truck: <svg {...s}><rect x="6" y="14" width="18" height="12" rx="1" /><path d="M24 18h5l3 4v4h-8" /><circle cx="14" cy="28" r="2" /><circle cx="28" cy="28" r="2" /><line x1="16" y1="26" x2="26" y2="26" /></svg>,
  clock: <svg {...s}><circle cx="20" cy="20" r="10" /><path d="M20 14v6l4 3" /></svg>,
  express: <svg {...s}><path d="M8 20h8" /><path d="M10 16h6" /><path d="M12 24h4" /><path d="M22 12l6 8-6 8" /></svg>,
  globe: <svg {...s}><circle cx="20" cy="20" r="10" /><ellipse cx="20" cy="20" rx="4" ry="10" /><line x1="10" y1="20" x2="30" y2="20" /><path d="M12 14h16" /><path d="M12 26h16" /></svg>,
  returnbox: <svg {...s}><path d="M12 16v12h16V16" /><path d="M10 16l10-6 10 6" /><path d="M22 22l-4 4 4 4" /><line x1="18" y1="26" x2="28" y2="26" /></svg>,
  shield: <svg {...s}><path d="M20 8l-10 4v6c0 6 4 10 10 14 6-4 10-8 10-14v-6l-10-4z" /><polyline points="16 20 19 23 25 17" /></svg>,
  certificate: <svg {...s}><rect x="10" y="8" width="20" height="16" rx="2" /><line x1="14" y1="13" x2="26" y2="13" /><line x1="14" y1="17" x2="22" y2="17" /><circle cx="20" cy="28" r="4" /><polyline points="18 31 20 34 22 31" /></svg>,
  calendar: <svg {...s}><rect x="10" y="12" width="20" height="18" rx="2" /><line x1="10" y1="18" x2="30" y2="18" /><line x1="16" y1="8" x2="16" y2="14" /><line x1="24" y1="8" x2="24" y2="14" /><text x="17" y="27" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">24</text></svg>,
  sun: <svg {...s}><circle cx="20" cy="20" r="5" /><line x1="20" y1="10" x2="20" y2="13" /><line x1="20" y1="27" x2="20" y2="30" /><line x1="10" y1="20" x2="13" y2="20" /><line x1="27" y1="20" x2="30" y2="20" /><line x1="13" y1="13" x2="15" y2="15" /><line x1="25" y1="25" x2="27" y2="27" /><line x1="13" y1="27" x2="15" y2="25" /><line x1="25" y1="15" x2="27" y2="13" /></svg>,
  test: <svg {...s}><path d="M16 8v14l-4 8c-1 2 1 4 3 4h10c2 0 4-2 3-4l-4-8V8" /><line x1="14" y1="8" x2="26" y2="8" /><circle cx="18" cy="26" r="1.5" fill="currentColor" /><circle cx="22" cy="23" r="1" fill="currentColor" /></svg>,
  external: <svg {...s}><circle cx="20" cy="18" r="6" /><path d="M14 24c-2 2-4 4-4 6h20c0-2-2-4-4-6" /><line x1="20" y1="24" x2="20" y2="32" /><line x1="16" y1="32" x2="24" y2="32" /></svg>,
  check: <svg {...s}><circle cx="20" cy="20" r="10" /><polyline points="15 20 18.5 23.5 26 16" /></svg>,
};

function IconPreview({ iconId, size = 28 }) {
  const svg = ICON_SVGS[iconId];
  if (!svg) return <span className="text-xs text-zinc-400">?</span>;
  return <span style={{ width: size, height: size, display: "inline-flex" }}>{svg}</span>;
}

// Icon picker popover
function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm hover:bg-zinc-50"
      >
        {value ? (
          <IconPreview iconId={value} size={20} />
        ) : (
          <span className="h-5 w-5 rounded border border-dashed border-zinc-300" />
        )}
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-[min(320px,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {ICON_CATALOG.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  title={icon.label}
                  onClick={() => {
                    onChange(icon.id);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-0.5 rounded-md p-1.5 transition-colors ${
                    value === icon.id
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <IconPreview iconId={icon.id} size={24} />
                  <span className="text-[9px] leading-tight truncate w-full text-center">
                    {icon.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TAB_KEYS = [
  { key: "ingredients", label: "Ingredients" },
  { key: "values", label: "Our Values" },
  { key: "howToUse", label: "How to Use" },
  { key: "shippingInfo", label: "Shipping & Returns" },
  { key: "policies", label: "Policies" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400";

export default function TabHighlightsEditor({ value, onChange }) {
  const highlights = value || {};
  const [activeTab, setActiveTab] = useState("ingredients");

  function updateTab(tabKey, items) {
    onChange({ ...highlights, [tabKey]: items });
  }

  function addItem(tabKey) {
    const current = highlights[tabKey] || [];
    updateTab(tabKey, [...current, { icon: "check", label: "" }]);
  }

  function removeItem(tabKey, index) {
    const current = highlights[tabKey] || [];
    updateTab(tabKey, current.filter((_, i) => i !== index));
  }

  function updateItem(tabKey, index, field, val) {
    const current = [...(highlights[tabKey] || [])];
    current[index] = { ...current[index], [field]: val };
    updateTab(tabKey, current);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-semibold text-zinc-900">Tab Highlights</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Add icon + label pairs for each product detail tab (up to 6 per tab).
      </p>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
        {TAB_KEYS.map(({ key, label }) => {
          const count = (highlights[key] || []).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === key
                  ? "border-b-2 border-zinc-900 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-600">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {TAB_KEYS.map(({ key }) => {
          if (activeTab !== key) return null;
          const items = highlights[key] || [];
          return (
            <div key={key} className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <IconPicker
                    value={item.icon}
                    onChange={(iconId) => updateItem(key, i, "icon", iconId)}
                  />
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(key, i, "label", e.target.value)}
                    placeholder="Label text"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(key, i)}
                    className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {items.length < 6 && (
                <button
                  type="button"
                  onClick={() => addItem(key)}
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Highlight
                </button>
              )}

              {items.length === 0 && (
                <p className="text-xs text-zinc-400 italic">
                  No highlights yet. Add up to 6 icon + label pairs.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ICON_SVGS, ICON_CATALOG, IconPreview };
