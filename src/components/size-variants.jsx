"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";

const EMPTY_SIZE = { label: "", price: "", compareAtPrice: "", sku: "", stock: "" };

export default function SizeVariants({ sizes = [], onChange }) {
  function addSize() {
    onChange([...sizes, { ...EMPTY_SIZE }]);
  }

  function removeSize(index) {
    onChange(sizes.filter((_, i) => i !== index));
  }

  function updateSize(index, field, value) {
    const updated = sizes.map((size, i) =>
      i === index ? { ...size, [field]: value } : size
    );
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      {sizes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Label
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Price (Rs.)
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Compare at (Rs.)
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  SKU
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Stock
                </th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sizes.map((size, index) => (
                <tr key={index} className="border-b border-zinc-100">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={size.label}
                      onChange={(e) =>
                        updateSize(index, "label", e.target.value)
                      }
                      placeholder="e.g. 100ml"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={size.price}
                      onChange={(e) =>
                        updateSize(index, "price", e.target.value)
                      }
                      placeholder="0"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={size.compareAtPrice}
                      onChange={(e) =>
                        updateSize(index, "compareAtPrice", e.target.value)
                      }
                      placeholder="0"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={size.sku}
                      onChange={(e) =>
                        updateSize(index, "sku", e.target.value)
                      }
                      placeholder="SKU-001"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={size.stock}
                      onChange={(e) =>
                        updateSize(index, "stock", e.target.value)
                      }
                      placeholder="0"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addSize}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        <PlusIcon className="h-4 w-4" />
        Add Size
      </button>
    </div>
  );
}
