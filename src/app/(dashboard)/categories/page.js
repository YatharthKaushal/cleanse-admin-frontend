"use client";

import { useState, useEffect, useCallback } from "react";
import { TrashIcon, Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import { adminCategoryApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ConfirmDialog from "@/components/confirm-dialog";
import StatusBadge from "@/components/status-badge";
import CategoryForm from "./category-form";

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCategoryApi.list();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminCategoryApi.delete(deleteTarget._id);
      showToast("Category deleted", "success");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete category", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await adminCategoryApi.update(category._id, { isActive: !category.isActive });
      fetchCategories();
    } catch {
      showToast("Failed to update category", "error");
    }
  };

  const openCreate = () => {
    setEditCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditCategory(category);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditCategory(null);
    fetchCategories();
  };

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.name?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : categories;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Categories</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Organize products into categories
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <PlusIcon className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-base font-medium text-zinc-700">
            {search.trim() ? "No matching categories" : "No categories found"}
          </h3>
          <p className="mb-6 text-sm text-zinc-500">
            {search.trim()
              ? "Try a different search term."
              : "Create your first category to organize products."}
          </p>
          {!search.trim() && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Products</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Sort</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((category) => (
                  <tr
                    key={category._id}
                    className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                    onClick={() => openEdit(category)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{category.name}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono">{category.slug}</td>
                    <td className="px-4 py-3 text-zinc-600 max-w-60 truncate">
                      {category.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{category.productCount ?? 0}</td>
                    <td className="px-4 py-3 text-zinc-600">{category.sortOrder ?? 0}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleToggleActive(category)}>
                        <StatusBadge active={category.isActive} />
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(category)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil1Icon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Create/Edit form dialog */}
      {formOpen && (
        <CategoryForm
          category={editCategory}
          onClose={() => {
            setFormOpen(false);
            setEditCategory(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
