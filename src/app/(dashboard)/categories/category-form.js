"use client";

import { useState, useRef } from "react";
import { Cross1Icon, Cross2Icon, UploadIcon } from "@radix-ui/react-icons";
import { adminCategoryApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ImageCropper from "@/components/image-cropper";
import MediaPicker from "@/components/media/media-picker";
import Toggle from "@/components/toggle";

function toImageState(url) {
  return url ? { url, isNew: false } : null;
}

export default function CategoryForm({ category, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!category;

  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });
  const [bannerTop, setBannerTop] = useState(toImageState(category?.bannerTop));
  const [bannerBottom, setBannerBottom] = useState(toImageState(category?.bannerBottom));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [optimize, setOptimize] = useState(true);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function appendBanner(fd, field, value, hadValue) {
    if (value?.isNew && value.file) {
      fd.append(field, value.file);
    } else if (value && !value.isNew) {
      fd.append(field, value.url);
    } else if (!value && hadValue) {
      fd.append(field, "");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    setError("");

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("sortOrder", String(Number(form.sortOrder) || 0));
    if (isEdit) fd.append("isActive", String(form.isActive));
    appendBanner(fd, "bannerTop", bannerTop, isEdit && !!category?.bannerTop);
    appendBanner(fd, "bannerBottom", bannerBottom, isEdit && !!category?.bannerBottom);
    fd.append("optimize", String(optimize));

    try {
      if (isEdit) {
        await adminCategoryApi.update(category._id, fd);
        showToast("Category updated", "success");
      } else {
        await adminCategoryApi.create(fd);
        showToast("Category created", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 rounded-t-xl">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Face Care"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-zinc-400">
              The URL slug is generated automatically from the name.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the category"
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors resize-none"
            />
          </div>

          {/* Banners */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Top Banner <span className="font-normal text-zinc-400">(spotlight, wide)</span>
            </label>
            <BannerUpload
              value={bannerTop}
              onChange={setBannerTop}
              aspect={16 / 9}
              title="Crop top banner (16:9)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Bottom Banner <span className="font-normal text-zinc-400">(side, tall)</span>
            </label>
            <BannerUpload
              value={bannerBottom}
              onChange={setBannerBottom}
              aspect={2 / 3}
              title="Crop bottom banner (2:3)"
            />
          </div>

          <Toggle
            checked={optimize}
            onCheckedChange={setOptimize}
            label="Optimize banner uploads → WebP (visually lossless)"
            labelClassName="text-xs text-zinc-500"
            size="sm"
          />

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Sort Order <span className="font-normal text-zinc-400">(lower shows first)</span>
            </label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => handleChange("sortOrder", e.target.value)}
              min="0"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("isActive", !form.isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.isActive ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-zinc-700">Active</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BannerUpload({ value, onChange, aspect, title }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    if (file.size > 100 * 1024 * 1024) return;
    setPendingFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <>
      {value ? (
        <div className="relative inline-block overflow-hidden rounded-lg border border-zinc-200">
          <img src={value.url} alt="" className="h-40 w-full max-w-md object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-zinc-600 shadow hover:bg-white hover:text-red-600"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`flex h-32 max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-zinc-400 bg-zinc-50"
              : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          <UploadIcon className="h-6 w-6 text-zinc-400" />
          <span className="text-sm text-zinc-500">Drop or click to upload</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Choose from library
        </button>
      </div>

      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          aspect={aspect}
          title={title}
          onCropped={(croppedFile) => {
            onChange({ url: URL.createObjectURL(croppedFile), file: croppedFile, isNew: true });
            setPendingFile(null);
          }}
          onCancel={() => setPendingFile(null)}
        />
      )}

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        imageOnly
        onSelect={(m) => onChange({ url: m.url, isNew: false })}
      />
    </>
  );
}
