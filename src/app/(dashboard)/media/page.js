"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, GridIcon, RowsIcon } from "@radix-ui/react-icons";

import { adminMediaApi } from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { useToast } from "@/context/toast-context";

import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import MediaGrid from "@/components/media/media-grid";
import MediaDetailSheet from "@/components/media/media-detail-sheet";
import MediaUploader from "@/components/media/media-uploader";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

const PROVIDER_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "s3", label: "AWS S3" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
  { value: "name", label: "Name (A–Z)" },
];

const LIMIT = 40;

export default function MediaPage() {
  const { showToast } = useToast();

  const [media, setMedia] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const [uploaderOpen, setUploaderOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchMedia = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = { page, limit: LIMIT, sort };
        if (debouncedSearch) params.search = debouncedSearch;
        if (typeFilter !== "all") params.type = typeFilter;
        if (providerFilter !== "all") params.provider = providerFilter;

        const data = await adminMediaApi.list(params);
        setMedia(data.media);
        setPagination(data.pagination);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load media", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, typeFilter, providerFilter, sort, showToast]
  );

  useEffect(() => {
    fetchMedia(1);
  }, [fetchMedia]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Media</h1>
        <button
          onClick={() => setUploaderOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          Upload media
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search media..." />
        </div>
        <SelectFilter
          value={typeFilter}
          onValueChange={setTypeFilter}
          placeholder="All Types"
          options={TYPE_OPTIONS}
        />
        <SelectFilter
          value={providerFilter}
          onValueChange={setProviderFilter}
          placeholder="All Sources"
          options={PROVIDER_OPTIONS}
        />
        <SelectFilter
          value={sort}
          onValueChange={setSort}
          placeholder="Sort"
          options={SORT_OPTIONS}
        />
        <div className="ml-auto flex items-center rounded-lg border border-zinc-200 p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md p-1.5 ${view === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
            title="Grid view"
          >
            <GridIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 ${view === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
            title="List view"
          >
            <RowsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-zinc-400">Loading...</div>
      ) : media.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <MediaGrid items={media} view={view} onSelect={setSelected} />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchMedia(p)}
          />
        </>
      )}

      {/* Detail sheet */}
      <MediaDetailSheet
        media={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />

      {/* Uploader */}
      <MediaUploader
        open={uploaderOpen}
        onOpenChange={setUploaderOpen}
        onUploaded={() => fetchMedia(1)}
      />
    </div>
  );
}
