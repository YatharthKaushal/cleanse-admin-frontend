"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  StarIcon,
  StarFilledIcon,
  DotsVerticalIcon,
  CrossCircledIcon,
  ResetIcon,
} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { adminProductApi } from "@/lib/endpoints";
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

const TAG_OPTIONS = [
  { value: "all", label: "All Tags" },
  { value: "Face Care", label: "Face Care" },
  { value: "Hair Care", label: "Hair Care" },
  { value: "Body Care", label: "Body Care" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
];

const COLUMNS = [
  { key: "checkbox", label: "", width: "40px" },
  { key: "image", label: "Image", width: "60px" },
  { key: "name", label: "Name", sortable: true, sortKey: "name" },
  { key: "tag", label: "Tag", width: "110px", className: "hidden sm:table-cell" },
  { key: "price", label: "Price", width: "100px", sortable: true, sortKey: "price" },
  { key: "stock", label: "Stock", width: "80px", sortable: true, sortKey: "totalStock", className: "hidden sm:table-cell" },
  { key: "status", label: "Status", width: "90px" },
  { key: "actions", label: "", width: "50px" },
];

const TAG_COLORS = {
  "Face Care": "bg-purple-50 text-purple-700",
  "Hair Care": "bg-amber-50 text-amber-700",
  "Body Care": "bg-teal-50 text-teal-700",
};

export default function ProductsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // State
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("active");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch products
  const fetchProducts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        sort: `${sortDir === "desc" ? "-" : ""}${sortField}`,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (tagFilter !== "all") params.tag = tagFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (view === "deleted") params.deleted = true;

      const data = await adminProductApi.list(params);

      // If requested page is beyond last page (e.g. after deleting), fetch last page
      if (page > 1 && data.products.length === 0 && data.pagination.pages > 0) {
        return fetchProducts(data.pagination.pages);
      }

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load products",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, tagFilter, statusFilter, view, sortField, sortDir, showToast]);

  // Clear selections when filters/search change
  useEffect(() => {
    setSelected(new Set());
    fetchProducts(1);
  }, [fetchProducts]);

  // Sort handler
  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  // Selection handlers
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p._id)));
    }
  }

  // Delete handler
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminProductApi.delete(deleteTarget._id);
      showToast(`"${deleteTarget.name}" deleted`, "success");
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      fetchProducts(pagination.page);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete product",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  // Restore handler
  async function handleRestore(product) {
    try {
      await adminProductApi.restore(product._id);
      showToast(`"${product.name}" restored`, "success");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(product._id);
        return next;
      });
      fetchProducts(pagination.page);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to restore product",
        "error"
      );
    }
  }

  // Toggle featured
  async function toggleFeatured(product) {
    try {
      const formData = new FormData();
      formData.append("isFeatured", !product.isFeatured);
      await adminProductApi.update(product._id, formData);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, isFeatured: !p.isFeatured } : p
        )
      );
      showToast(
        `"${product.name}" ${!product.isFeatured ? "featured" : "unfeatured"}`,
        "success"
      );
    } catch (err) {
      showToast("Failed to update product", "error");
    }
  }

  // Bulk actions
  async function bulkAction(action) {
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) => {
          if (action === "delete") return adminProductApi.delete(id);
          if (action === "restore") return adminProductApi.restore(id);
          const formData = new FormData();
          if (action === "activate") formData.append("isActive", true);
          if (action === "deactivate") formData.append("isActive", false);
          return adminProductApi.update(id, formData);
        })
      );
      showToast(`${ids.length} product(s) ${action}d`, "success");
      setSelected(new Set());
      fetchProducts(pagination.page);
    } catch (err) {
      showToast(`Failed to ${action} products`, "error");
    }
  }

  // Bulk delete with confirmation
  async function handleBulkDelete() {
    setBulkDeleteLoading(true);
    try {
      await bulkAction("delete");
      setBulkDeleteOpen(false);
    } catch {
      // error already handled in bulkAction
    } finally {
      setBulkDeleteLoading(false);
    }
  }

  // Render row
  function renderRow(product) {
    const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

    return (
      <tr
        key={product._id}
        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
        onClick={() => router.push(`/products/${product._id}`)}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(product._id)}
            onChange={() => toggleSelect(product._id)}
            className="h-4 w-4 rounded border-zinc-300"
          />
        </td>
        <td className="px-4 py-3">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
              N/A
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-zinc-900">{product.name}</div>
          <div className="text-xs text-zinc-400">{product.slug}</div>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TAG_COLORS[product.tag] || "bg-zinc-100 text-zinc-600"}`}
          >
            {product.tag}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-zinc-900">
            {formatPrice(product.price)}
          </div>
          {product.compareAtPrice != null && product.compareAtPrice !== product.price && (
            <div className="text-xs text-zinc-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </div>
          )}
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span
            className={`text-sm font-medium ${product.totalStock === 0 ? "text-red-600" : "text-zinc-700"}`}
          >
            {product.totalStock}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge active={product.isActive} />
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {view === "deleted" ? (
            <button
              onClick={() => handleRestore(product)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
            >
              <ResetIcon className="h-4 w-4" />
              Restore
            </button>
          ) : (
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
                  onClick={() => router.push(`/products/${product._id}`)}
                >
                  <Pencil1Icon className="h-4 w-4" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100"
                  onClick={() => toggleFeatured(product)}
                >
                  {product.isFeatured ? (
                    <StarFilledIcon className="h-4 w-4 text-amber-500" />
                  ) : (
                    <StarIcon className="h-4 w-4" />
                  )}
                  {product.isFeatured ? "Unfeature" : "Feature"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-zinc-200" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                  onClick={() => setDeleteTarget(product)}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        <button
          onClick={() => setView("active")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            view === "active"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setView("deleted")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            view === "deleted"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Deleted
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
          />
        </div>
        <SelectFilter
          value={tagFilter}
          onValueChange={setTagFilter}
          placeholder="All Tags"
          options={TAG_OPTIONS}
        />
        <SelectFilter
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Table */}
      {!isLoading && products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={products}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={isLoading}
            renderRow={renderRow}
            selectedIds={selected}
            allSelected={products.length > 0 && selected.size === products.length}
            onSelectAll={handleSelectAll}
          />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => {
              setPagination((prev) => ({ ...prev, page: p }));
              fetchProducts(p);
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
          {view === "deleted" ? (
            <button
              onClick={() => bulkAction("restore")}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
            >
              Restore
            </button>
          ) : (
            <>
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
            </>
          )}
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
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This moves it to Deleted — you can restore it later.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Products"
        description={`Are you sure you want to delete ${selected.size} product(s)? This moves them to Deleted — you can restore them later.`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
      />
    </div>
  );
}
