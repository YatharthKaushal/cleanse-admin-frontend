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
} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { adminBundleApi } from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/context/toast-context";

import DataTable from "@/components/data-table";
import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import StatusBadge from "@/components/status-badge";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const COLUMNS = [
  { key: "checkbox", label: "", width: "40px" },
  { key: "name", label: "Name", sortable: true, sortKey: "name" },
  { key: "products", label: "Products", width: "90px" },
  { key: "discount", label: "Discount", width: "120px" },
  { key: "minProducts", label: "Min Qty", width: "80px", className: "hidden sm:table-cell" },
  { key: "status", label: "Status", width: "90px" },
  { key: "actions", label: "", width: "50px" },
];

export default function BundlesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bundles, setBundles] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchBundles = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await adminBundleApi.list(params);

      if (page > 1 && data.bundles.length === 0 && data.pagination.pages > 0) {
        return fetchBundles(data.pagination.pages);
      }

      setBundles(data.bundles);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load bundles", "error");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, showToast]);

  useEffect(() => {
    setSelected(new Set());
    fetchBundles(1);
  }, [fetchBundles]);

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
    if (selected.size === bundles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bundles.map((b) => b._id)));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminBundleApi.delete(deleteTarget._id);
      showToast(`"${deleteTarget.name}" deleted`, "success");
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      fetchBundles(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete bundle", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleActive(bundle) {
    try {
      await adminBundleApi.update(bundle._id, { isActive: !bundle.isActive });
      setBundles((prev) =>
        prev.map((b) =>
          b._id === bundle._id ? { ...b, isActive: !b.isActive } : b
        )
      );
      showToast(
        `"${bundle.name}" ${!bundle.isActive ? "activated" : "deactivated"}`,
        "success"
      );
    } catch (err) {
      showToast("Failed to update bundle", "error");
    }
  }

  async function bulkAction(action) {
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) => {
          if (action === "delete") return adminBundleApi.delete(id);
          if (action === "activate") return adminBundleApi.update(id, { isActive: true });
          if (action === "deactivate") return adminBundleApi.update(id, { isActive: false });
        })
      );
      showToast(`${ids.length} bundle(s) ${action}d`, "success");
      setSelected(new Set());
      fetchBundles(pagination.page);
    } catch (err) {
      showToast(`Failed to ${action} bundles`, "error");
    }
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true);
    try {
      await bulkAction("delete");
      setBulkDeleteOpen(false);
    } catch {
      // handled in bulkAction
    } finally {
      setBulkDeleteLoading(false);
    }
  }

  function renderRow(bundle) {
    const discountLabel =
      bundle.discountType === "percentage"
        ? `${bundle.discountValue}%`
        : formatPrice(bundle.discountValue);

    return (
      <tr
        key={bundle._id}
        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
        onClick={() => router.push(`/bundles/${bundle._id}`)}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(bundle._id)}
            onChange={() => toggleSelect(bundle._id)}
            className="h-4 w-4 rounded border-zinc-300"
          />
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-zinc-900">{bundle.name}</div>
          <div className="text-xs text-zinc-400">{bundle.slug}</div>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
            {bundle.products?.length || 0}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            {discountLabel} off
          </span>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className="text-sm text-zinc-700">{bundle.minProducts}</span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge active={bundle.isActive} />
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
                  onClick={() => router.push(`/bundles/${bundle._id}`)}
                >
                  <Pencil1Icon className="h-4 w-4" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                  onClick={() => toggleActive(bundle)}
                >
                  {bundle.isActive ? "Deactivate" : "Activate"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-zinc-200" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                  onClick={() => setDeleteTarget(bundle)}
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
        <h1 className="text-2xl font-semibold text-zinc-900">Bundles</h1>
        <Link
          href="/bundles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          Create Bundle
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search bundles..."
          />
        </div>
        <SelectFilter
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Table */}
      {!isLoading && bundles.length === 0 ? (
        <EmptyState
          title="No bundles found"
          subtitle="Create a bundle to offer discounted product combinations."
          actionHref="/bundles/new"
          actionLabel="Create Bundle"
        />
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={bundles}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={isLoading}
            renderRow={renderRow}
            selectedIds={selected}
            allSelected={bundles.length > 0 && selected.size === bundles.length}
            onSelectAll={handleSelectAll}
          />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => {
              setPagination((prev) => ({ ...prev, page: p }));
              fetchBundles(p);
            }}
          />
        </>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-zinc-700">
            {selected.size} selected
          </span>
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
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Bundle"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Bundles"
        description={`Are you sure you want to delete ${selected.size} bundle(s)? This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
      />
    </div>
  );
}
