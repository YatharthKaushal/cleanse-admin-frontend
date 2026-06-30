"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const [jumpValue, setJumpValue] = useState("");

  const goToJump = () => {
    const target = parseInt(jumpValue, 10);
    if (!Number.isNaN(target) && target >= 1 && target <= pages) {
      onPageChange(target);
    }
    setJumpValue("");
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-zinc-500">
        Showing {start}-{end} of {total} products
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Prev
        </button>
        <span className="text-sm text-zinc-600">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        {pages > 1 && (
          <div className="flex items-center gap-1.5 sm:ml-2 sm:border-l sm:border-zinc-200 sm:pl-3">
            <span className="text-sm text-zinc-500">Go to</span>
            <input
              type="number"
              min={1}
              max={pages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToJump();
              }}
              placeholder={String(page)}
              aria-label="Jump to page number"
              className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={goToJump}
              disabled={!jumpValue}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
