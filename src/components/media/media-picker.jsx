"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons";

import { adminMediaApi } from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { useToast } from "@/context/toast-context";
import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import Pagination from "@/components/pagination";
import MediaGrid from "./media-grid";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

const LIMIT = 24;

// Reusable "choose from library" picker. Calls onSelect(mediaDoc) then closes.
// imageOnly restricts the list to images (used by image-only upload controls).
export default function MediaPicker({ open, onOpenChange, onSelect, imageOnly = false }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0, limit: LIMIT });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(imageOnly ? "image" : "all");
  const [picked, setPicked] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchMedia = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = { page, limit: LIMIT, sort: "newest" };
        if (debouncedSearch) params.search = debouncedSearch;
        const t = imageOnly ? "image" : typeFilter;
        if (t !== "all") params.type = t;
        const data = await adminMediaApi.list(params);
        setItems(data.media);
        setPagination(data.pagination);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load media", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, typeFilter, imageOnly, showToast]
  );

  useEffect(() => {
    if (open) fetchMedia(1);
  }, [open, fetchMedia]);

  function confirm() {
    if (picked) {
      onSelect?.(picked);
      onOpenChange(false);
      setPicked(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[55] flex h-[min(85vh,640px)] w-[min(94vw,860px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Choose from library
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-zinc-400 hover:text-zinc-700">
              <Cross1Icon className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-5 py-3">
            <div className="w-full sm:w-56">
              <SearchInput value={search} onChange={setSearch} placeholder="Search media..." />
            </div>
            {!imageOnly && (
              <SelectFilter
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="All Types"
                options={TYPE_OPTIONS}
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-zinc-400">Loading...</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-400">No media found</div>
            ) : (
              <MediaGrid
                items={items}
                view="grid"
                onSelect={setPicked}
                selectedId={picked?._id}
              />
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => fetchMedia(p)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!picked}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Select
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
