"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  DotsVerticalIcon,
  CrossCircledIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { adminTestimonialApi } from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { useToast } from "@/context/toast-context";

import DataTable from "@/components/data-table";
import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import StatusBadge from "@/components/status-badge";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "review", label: "Review" },
  { value: "before-after", label: "Before / After" },
  { value: "both", label: "Both" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { key: "checkbox", label: "", width: "40px" },
  { key: "name", label: "Name", sortable: true, sortKey: "name" },
  { key: "headline", label: "Headline" },
  { key: "type", label: "Type", width: "120px", className: "hidden sm:table-cell" },
  { key: "rating", label: "Rating", width: "80px", className: "hidden sm:table-cell" },
  { key: "order", label: "Order", width: "70px", sortable: true, sortKey: "sortOrder" },
  { key: "status", label: "Status", width: "90px" },
  { key: "actions", label: "", width: "50px" },
];

const TYPE_COLORS = {
  review: "bg-blue-50 text-blue-700",
  "before-after": "bg-amber-50 text-amber-700",
  both: "bg-purple-50 text-purple-700",
};

const TYPE_LABELS = {
  review: "Review",
  "before-after": "Before/After",
  both: "Both",
};

function StarRating({ rating }) {
  return (
    <span className="text-sm text-amber-500">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default function TestimonialsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [testimonials, setTestimonials] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("sortOrder");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchTestimonials = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        sort: `${sortDir === "desc" ? "-" : ""}${sortField}`,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await adminTestimonialApi.list(params);

      if (page > 1 && data.testimonials.length === 0 && data.pagination.pages > 0) {
        return fetchTestimonials(data.pagination.pages);
      }

      setTestimonials(data.testimonials);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load testimonials", "error");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, statusFilter, sortField, sortDir, showToast]);

  useEffect(() => {
    setSelected(new Set());
    fetchTestimonials(1);
  }, [fetchTestimonials]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (selected.size === testimonials.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(testimonials.map((t) => t._id)));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminTestimonialApi.delete(deleteTarget._id);
      showToast(`"${deleteTarget.name}" deleted`, "success");
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      fetchTestimonials(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete testimonial", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleActive(item) {
    try {
      const formData = new FormData();
      formData.append("isActive", !item.isActive);
      await adminTestimonialApi.update(item._id, formData);
      setTestimonials((prev) =>
        prev.map((t) => (t._id === item._id ? { ...t, isActive: !t.isActive } : t))
      );
      showToast(`"${item.name}" ${!item.isActive ? "activated" : "deactivated"}`, "success");
    } catch {
      showToast("Failed to update testimonial", "error");
    }
  }

  async function bulkAction(action) {
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) => {
          if (action === "delete") return adminTestimonialApi.delete(id);
          const formData = new FormData();
          if (action === "activate") formData.append("isActive", true);
          if (action === "deactivate") formData.append("isActive", false);
          return adminTestimonialApi.update(id, formData);
        })
      );
      showToast(`${ids.length} testimonial(s) ${action}d`, "success");
      setSelected(new Set());
      fetchTestimonials(pagination.page);
    } catch {
      showToast(`Failed to ${action} testimonials`, "error");
    }
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true);
    try {
      await bulkAction("delete");
      setBulkDeleteOpen(false);
    } finally {
      setBulkDeleteLoading(false);
    }
  }

  function renderRow(item) {
    return (
      <tr
        key={item._id}
        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
        onClick={() => router.push(`/testimonials/${item._id}`)}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(item._id)}
            onChange={() => toggleSelect(item._id)}
            className="h-4 w-4 rounded border-zinc-300"
          />
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-zinc-900">{item.name}</div>
          <div className="text-xs text-zinc-400">{item.role}</div>
        </td>
        <td className="px-4 py-3">
          <div className="max-w-[250px] truncate text-sm text-zinc-700">{item.headline}</div>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] || "bg-zinc-100 text-zinc-600"}`}>
            {TYPE_LABELS[item.type] || item.type}
          </span>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <StarRating rating={item.rating || 5} />
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-zinc-600">{item.sortOrder}</span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge active={item.isActive} />
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
                <DotsVerticalIcon className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[160px] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                  onClick={() => router.push(`/testimonials/${item._id}`)}
                >
                  <Pencil1Icon className="h-4 w-4" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                  onClick={() => toggleActive(item)}
                >
                  {item.isActive ? (
                    <EyeNoneIcon className="h-4 w-4" />
                  ) : (
                    <EyeOpenIcon className="h-4 w-4" />
                  )}
                  {item.isActive ? "Deactivate" : "Activate"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-zinc-200" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                  onClick={() => setDeleteTarget(item)}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </td>
      </tr>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Testimonials</h1>
        <Link
          href="/testimonials/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add Testimonial
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search testimonials..." />
        </div>
        <SelectFilter
          value={typeFilter}
          onValueChange={setTypeFilter}
          placeholder="All Types"
          options={TYPE_OPTIONS}
        />
        <SelectFilter
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Table */}
      {!isLoading && testimonials.length === 0 ? (
        <EmptyState
          icon={ChatBubbleIcon}
          title="No testimonials found"
          subtitle="Try adjusting your search or filters"
          actionLabel="Add Testimonial"
          actionHref="/testimonials/new"
        />
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={testimonials}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={isLoading}
            renderRow={renderRow}
            selectedIds={selected}
            allSelected={testimonials.length > 0 && selected.size === testimonials.length}
            onSelectAll={handleSelectAll}
          />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => {
              setPagination((prev) => ({ ...prev, page: p }));
              fetchTestimonials(p);
            }}
          />
        </>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-zinc-700">{selected.size} selected</span>
          <button
            onClick={() => bulkAction("activate")}
            className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            Activate
          </button>
          <button
            onClick={() => bulkAction("deactivate")}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            Deactivate
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-2 rounded p-1 text-zinc-400 hover:text-zinc-600"
          >
            <CrossCircledIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Single delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Testimonial"
        description={`Are you sure you want to delete "${deleteTarget?.name}"'s testimonial? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Testimonials"
        description={`Are you sure you want to delete ${selected.size} testimonial(s)? This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
      />
    </div>
  );
}
