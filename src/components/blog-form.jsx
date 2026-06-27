"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import {
  ChevronDownIcon,
  CheckIcon,
  UploadIcon,
  Cross2Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useToast } from "@/context/toast-context";
import { adminBlogApi } from "@/lib/endpoints";
import ResponsiveVariants, { BREAKPOINTS } from "@/components/responsive-variants";
import MediaPicker from "@/components/media/media-picker";

const capBp = (bp) => bp.charAt(0).toUpperCase() + bp.slice(1);

function sourcesFromData(s) {
  const out = {};
  if (!s) return out;
  for (const { key } of BREAKPOINTS) {
    if (s[key]) out[key] = { url: s[key], isNew: false };
  }
  return out;
}

// Append per-breakpoint variant files (fieldPrefix + Desktop/Tablet/Mobile) and a
// JSON map of kept/cleared variant URLs (fieldPrefix + "Sources") to FormData.
function appendSources(fd, fieldPrefix, sources) {
  const meta = {};
  for (const { key } of BREAKPOINTS) {
    const v = sources?.[key];
    if (v?.isNew && v.file) {
      fd.append(`${fieldPrefix}${capBp(key)}`, v.file);
    } else if (v?.url) {
      meta[key] = v.url;
    } else {
      meta[key] = null;
    }
  }
  fd.append(`${fieldPrefix}Sources`, JSON.stringify(meta));
}

const CATEGORY_OPTIONS = [
  { value: "Hair Care", label: "Hair Care" },
  { value: "Skin Care", label: "Skin Care" },
  { value: "Wellness", label: "Wellness" },
  { value: "Ingredients", label: "Ingredients" },
  { value: "Rituals", label: "Rituals" },
];

const INITIAL_FORM = {
  title: "",
  category: "Hair Care",
  excerpt: "",
  content: [""],
  readTime: "",
  authorId: "",
  isFeatured: false,
  isPublished: false,
  tags: [],
  seo: { metaTitle: "", metaDescription: "" },
};

export default function BlogForm({ initialData, onSubmit, isSubmitting }) {
  const { showToast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [imageSources, setImageSources] = useState({});
  const [optimize, setOptimize] = useState(true);
  const [authors, setAuthors] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    adminBlogApi.authors().then(setAuthors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialData) return;
    setForm({
      title: initialData.title || "",
      category: initialData.category || "Hair Care",
      excerpt: initialData.excerpt || "",
      content:
        initialData.content?.length > 0 ? initialData.content : [""],
      readTime: initialData.readTime || "",
      authorId: initialData.author?._id || initialData.author || "",
      isFeatured: initialData.isFeatured ?? false,
      isPublished: initialData.isPublished ?? false,
      tags: initialData.tags || [],
      seo: {
        metaTitle: initialData.seo?.metaTitle || "",
        metaDescription: initialData.seo?.metaDescription || "",
      },
    });
    if (initialData.image) {
      setImage({ url: initialData.image, isNew: false });
    }
    setImageSources(sourcesFromData(initialData.imageSources));
  }, [initialData]);

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });
  }, []);

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.excerpt.trim()) e.excerpt = "Excerpt is required";
    if (form.content.every((p) => !p.trim())) e.content = "Content is required";
    return e;
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("category", form.category);
    fd.append("excerpt", form.excerpt.trim());
    fd.append("content", JSON.stringify(form.content.filter((p) => p.trim())));
    if (form.readTime) fd.append("readTime", form.readTime);
    if (form.authorId) fd.append("authorId", form.authorId);
    fd.append("isFeatured", String(form.isFeatured));
    fd.append("isPublished", String(form.isPublished));
    fd.append("tags", JSON.stringify(form.tags));
    fd.append(
      "seo",
      JSON.stringify({
        metaTitle: form.seo.metaTitle.trim(),
        metaDescription: form.seo.metaDescription.trim(),
      })
    );

    if (image?.isNew && image.file) {
      fd.append("image", image.file);
    } else if (image && !image.isNew) {
      fd.append("image", image.url);
    } else if (!image && isEdit && initialData?.image) {
      fd.append("image", "");
    }

    appendSources(fd, "image", imageSources);
    fd.append("optimize", String(optimize));

    return fd;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Please fix the highlighted errors", "error");
      return;
    }
    setErrors({});
    await onSubmit(buildFormData());
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag) {
    setField(
      "tags",
      form.tags.filter((t) => t !== tag)
    );
  }

  function updateParagraph(index, value) {
    const next = [...form.content];
    next[index] = value;
    setField("content", next);
  }

  function addParagraph() {
    setField("content", [...form.content, ""]);
  }

  function removeParagraph(index) {
    if (form.content.length <= 1) return;
    setField(
      "content",
      form.content.filter((_, i) => i !== index)
    );
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
        : "border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Basic Information</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className={inputClass("title")}
              placeholder="Blog post title"
            />
            {errors.title && <span className="text-xs text-red-600">{errors.title}</span>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Category</label>
              <Select.Root value={form.category} onValueChange={(val) => setField("category", val)}>
                <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <Select.Item
                          key={opt.value}
                          value={opt.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                        >
                          <Select.ItemIndicator>
                            <CheckIcon className="h-4 w-4" />
                          </Select.ItemIndicator>
                          <Select.ItemText>{opt.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Author</label>
              <Select.Root value={form.authorId} onValueChange={(val) => setField("authorId", val)}>
                <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400">
                  <Select.Value placeholder="Select author" />
                  <Select.Icon>
                    <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      {authors.map((a) => (
                        <Select.Item
                          key={a._id}
                          value={a._id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                        >
                          <Select.ItemIndicator>
                            <CheckIcon className="h-4 w-4" />
                          </Select.ItemIndicator>
                          <Select.ItemText>{a.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Read Time</label>
              <input
                type="text"
                value={form.readTime}
                onChange={(e) => setField("readTime", e.target.value)}
                className={inputClass("readTime")}
                placeholder="e.g. 5 min read"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
              className={inputClass("excerpt")}
              placeholder="Short summary of the blog post"
            />
            {errors.excerpt && <span className="text-xs text-red-600">{errors.excerpt}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Content</h2>
          <button
            type="button"
            onClick={addParagraph}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Paragraph
          </button>
        </div>
        {errors.content && <span className="mt-1 text-xs text-red-600">{errors.content}</span>}
        <div className="mt-4 flex flex-col gap-3">
          {form.content.map((para, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                rows={3}
                value={para}
                onChange={(e) => updateParagraph(i, e.target.value)}
                className={inputClass("content")}
                placeholder={`Paragraph ${i + 1}`}
              />
              {form.content.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParagraph(i)}
                  className="mt-1 shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Image */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Featured Image</h2>
        <p className="mt-1 text-sm text-zinc-500">JPEG, PNG, or WebP, max 5MB.</p>
        <div className="mt-4">
          <SingleImageUpload
            image={image}
            onChange={setImage}
            optimize={optimize}
            onOptimizeChange={setOptimize}
          />
        </div>
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-medium text-zinc-700">
            Responsive variants
          </h3>
          <div className="mt-2">
            <ResponsiveVariants value={imageSources} onChange={setImageSources} />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Tags</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 hover:bg-zinc-200"
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="w-32 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs outline-none focus:border-zinc-400"
              placeholder="Add tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-lg border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Settings</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <Switch.Root
              checked={form.isPublished}
              onCheckedChange={(val) => setField("isPublished", val)}
              className="h-5 w-9 rounded-full bg-zinc-200 transition-colors data-[state=checked]:bg-zinc-900"
            >
              <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
            Published
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <Switch.Root
              checked={form.isFeatured}
              onCheckedChange={(val) => setField("isFeatured", val)}
              className="h-5 w-9 rounded-full bg-zinc-200 transition-colors data-[state=checked]:bg-zinc-900"
            >
              <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
            Featured
          </label>
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">SEO</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Meta Title</label>
            <input
              type="text"
              value={form.seo.metaTitle}
              onChange={(e) =>
                setField("seo", { ...form.seo, metaTitle: e.target.value })
              }
              className={inputClass("seoTitle")}
              placeholder="SEO title (defaults to post title)"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Meta Description</label>
            <textarea
              rows={2}
              value={form.seo.metaDescription}
              onChange={(e) =>
                setField("seo", { ...form.seo, metaDescription: e.target.value })
              }
              className={inputClass("seoDesc")}
              placeholder="SEO description (defaults to excerpt)"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/blogs"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Post"}
        </button>
      </div>
    </form>
  );
}

function SingleImageUpload({ image, onChange, optimize, onOptimizeChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    onChange({ url: URL.createObjectURL(file), file, isNew: true });
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="flex flex-col gap-3">
      {image ? (
        <div className="relative inline-block overflow-hidden rounded-lg border border-zinc-200">
          <img src={image.url} alt="" className="h-48 w-full max-w-md object-cover" />
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
          className={`flex h-48 max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Choose from library
        </button>
        {onOptimizeChange && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={!!optimize}
              onChange={(e) => onOptimizeChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300"
            />
            Optimize → WebP
          </label>
        )}
      </div>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        imageOnly
        onSelect={(m) => onChange({ url: m.url, isNew: false })}
      />
    </div>
  );
}
