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
  FileTextIcon,
} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { adminBlogApi } from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { useToast } from "@/context/toast-context";

import DataTable from "@/components/data-table";
import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import StatusBadge from "@/components/status-badge";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Hair Care", label: "Hair Care" },
  { value: "Skin Care", label: "Skin Care" },
  { value: "Wellness", label: "Wellness" },
  { value: "Ingredients", label: "Ingredients" },
  { value: "Rituals", label: "Rituals" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const COLUMNS = [
  { key: "checkbox", label: "", width: "40px" },
  { key: "title", label: "Title", sortable: true, sortKey: "title" },
  { key: "category", label: "Category", width: "120px", className: "hidden sm:table-cell" },
  { key: "author", label: "Author", width: "140px", className: "hidden md:table-cell" },
  { key: "views", label: "Views", width: "70px", className: "hidden sm:table-cell" },
  { key: "status", label: "Status", width: "100px" },
  { key: "actions", label: "", width: "50px" },
];

const CAT_COLORS = {
  "Hair Care": "bg-emerald-50 text-emerald-700",
  "Skin Care": "bg-pink-50 text-pink-700",
  Wellness: "bg-blue-50 text-blue-700",
  Ingredients: "bg-amber-50 text-amber-700",
  Rituals: "bg-purple-50 text-purple-700",
};

export default function BlogsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchBlogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await adminBlogApi.list(params);

      if (page > 1 && data.blogs.length === 0 && data.pagination.pages > 0) {
        return fetchBlogs(data.pagination.pages);
      }

      setBlogs(data.blogs);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load blogs", "error");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, categoryFilter, statusFilter, showToast]);

  useEffect(() => {
    setSelected(new Set());
    fetchBlogs(1);
  }, [fetchBlogs]);

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
    if (selected.size === blogs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(blogs.map((b) => b._id)));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminBlogApi.delete(deleteTarget._id);
      showToast(`"${deleteTarget.title}" deleted`, "success");
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      fetchBlogs(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete blog", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true);
    try {
      await Promise.all(Array.from(selected).map((id) => adminBlogApi.delete(id)));
      showToast(`${selected.size} blog(s) deleted`, "success");
      setSelected(new Set());
      setBulkDeleteOpen(false);
      fetchBlogs(pagination.page);
    } catch {
      showToast("Failed to delete blogs", "error");
    } finally {
      setBulkDeleteLoading(false);
    }
  }

  function renderRow(item) {
    const date = item.publishedAt
      ? new Date(item.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "";

    return (
      <tr
        key={item._id}
        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
        onClick={() => router.push(`/blogs/${item._id}`)}
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
          <div className="flex items-center gap-3">
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="hidden h-10 w-14 rounded object-cover sm:block"
              />
            )}
            <div>
              <div className="font-medium text-zinc-900 line-clamp-1">{item.title}</div>
              <div className="text-xs text-zinc-400">{date}</div>
            </div>
          </div>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CAT_COLORS[item.category] || "bg-zinc-100 text-zinc-600"}`}>
            {item.category}
          </span>
        </td>
        <td className="hidden px-4 py-3 md:table-cell">
          <span className="text-sm text-zinc-600">{item.author?.name || "—"}</span>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className="text-sm text-zinc-600">{item.viewCount || 0}</span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge active={item.isPublished} activeLabel="Published" inactiveLabel="Draft" />
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
                  onClick={() => router.push(`/blogs/${item._id}`)}
                >
                  <Pencil1Icon className="h-4 w-4" />
                  Edit
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Blog Posts</h1>
        <Link
          href="/blogs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          New Post
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search posts..." />
        </div>
        <SelectFilter
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="All Categories"
          options={CATEGORY_OPTIONS}
        />
        <SelectFilter
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_OPTIONS}
        />
      </div>

      {!isLoading && blogs.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="No blog posts found"
          subtitle="Try adjusting your search or filters"
          actionLabel="New Post"
          actionHref="/blogs/new"
        />
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={blogs}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={isLoading}
            renderRow={renderRow}
            selectedIds={selected}
            allSelected={blogs.length > 0 && selected.size === blogs.length}
            onSelectAll={handleSelectAll}
          />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => {
              setPagination((prev) => ({ ...prev, page: p }));
              fetchBlogs(p);
            }}
          />
        </>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-zinc-700">{selected.size} selected</span>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Blog Post"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Blog Posts"
        description={`Are you sure you want to delete ${selected.size} post(s)? This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
      />
    </div>
  );
}
