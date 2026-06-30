"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DragHandleDots2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  CubeIcon,
} from "@radix-ui/react-icons";

import { adminProductApi } from "@/lib/endpoints";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/context/toast-context";

import EmptyState from "@/components/empty-state";

function primaryImage(product) {
  const img = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  return img?.url || null;
}

// Self-managed CMS tab: loads featured products and saves their order via its
// own endpoints (adminProductApi.listFeatured / reorderFeatured), independent of
// the shared CMS getSection/updateSection flow. Renders its own Save button.
export default function CmsFeaturedProductsEditor() {
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Index of the row currently being dragged.
  const dragIndex = useRef(null);
  const [overIndex, setOverIndex] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminProductApi.listFeatured();
      setItems(data.products || []);
      setDirty(false);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load featured products",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  };

  // --- Native HTML5 drag-and-drop ---
  const onDragStart = (i) => {
    dragIndex.current = i;
  };
  const onDragOver = (e, i) => {
    e.preventDefault();
    if (overIndex !== i) setOverIndex(i);
  };
  const onDrop = (i) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === i) return;
    move(from, i);
  };
  const onDragEnd = () => {
    dragIndex.current = null;
    setOverIndex(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminProductApi.reorderFeatured(items.map((p) => p._id));
      showToast("Featured order saved", "success");
      setDirty(false);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save order",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Featured Products
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Drag to reorder the products shown in the storefront{" "}
            <span className="font-medium text-zinc-700">Best Sellers</span>{" "}
            section. Top to bottom = left to right on the site.
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save order"}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-400">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CubeIcon}
          title="No featured products"
          subtitle="Mark products as featured from the Products page to show them in the Best Sellers section."
          actionLabel="Go to Products"
          actionHref="/products"
        />
      ) : (
        <ul className="space-y-2">
          {items.map((p, i) => {
            const img = primaryImage(p);
            return (
              <li
                key={p._id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-3 rounded-lg border bg-white p-3 transition-colors ${
                  overIndex === i
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200"
                } ${!p.isActive ? "opacity-60" : ""}`}
              >
                <span className="cursor-grab text-zinc-300 hover:text-zinc-500 active:cursor-grabbing">
                  <DragHandleDots2Icon className="h-5 w-5" />
                </span>

                <span className="w-6 text-center text-sm font-medium text-zinc-400">
                  {i + 1}
                </span>

                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  {img ? (
                    <img
                      src={img}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-300">
                      <CubeIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {p.name}
                    {!p.isActive && (
                      <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-normal text-zinc-500">
                        Draft
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">{formatPrice(p.price)}</p>
                </div>

                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Move up"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, i + 1)}
                    disabled={i === items.length - 1}
                    className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Move down"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
