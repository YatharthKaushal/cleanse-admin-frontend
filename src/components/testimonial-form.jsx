"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import { ChevronDownIcon, CheckIcon, UploadIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useToast } from "@/context/toast-context";
import ResponsiveVariants, { BREAKPOINTS } from "@/components/responsive-variants";
import MediaPicker from "@/components/media/media-picker";
import Toggle from "@/components/toggle";

const capBp = (bp) => bp.charAt(0).toUpperCase() + bp.slice(1);

function sourcesFromData(s) {
  const out = {};
  if (!s) return out;
  for (const { key } of BREAKPOINTS) {
    if (s[key]) out[key] = { url: s[key], isNew: false };
  }
  return out;
}

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

const TYPE_OPTIONS = [
  { value: "review", label: "Review", hint: "Carousel only" },
  { value: "before-after", label: "Before / After", hint: "Results grid only" },
  { value: "both", label: "Both", hint: "Both sections" },
];

const INITIAL_FORM = {
  name: "",
  role: "Verified Buyer",
  headline: "",
  text: "",
  type: "review",
  rating: 5,
  productName: "",
  sortOrder: 0,
  isActive: true,
};

export default function TestimonialForm({ initialData, onSubmit, isSubmitting }) {
  const { showToast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [beforeImage, setBeforeImage] = useState(null); // { url, file?, isNew }
  const [afterImage, setAfterImage] = useState(null);
  const [beforeImageSources, setBeforeImageSources] = useState({});
  const [afterImageSources, setAfterImageSources] = useState({});
  const [optimize, setOptimize] = useState(true);

  // Populate form in edit mode
  useEffect(() => {
    if (!initialData) return;
    setForm({
      name: initialData.name || "",
      role: initialData.role || "Verified Buyer",
      headline: initialData.headline || "",
      text: initialData.text || "",
      type: initialData.type || "review",
      rating: initialData.rating ?? 5,
      productName: initialData.productName || "",
      sortOrder: initialData.sortOrder ?? 0,
      isActive: initialData.isActive ?? true,
    });
    if (initialData.beforeImage) {
      setBeforeImage({ url: initialData.beforeImage, isNew: false });
    }
    if (initialData.afterImage) {
      setAfterImage({ url: initialData.afterImage, isNew: false });
    }
    setBeforeImageSources(sourcesFromData(initialData.beforeImageSources));
    setAfterImageSources(sourcesFromData(initialData.afterImageSources));
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
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.headline.trim()) e.headline = "Headline is required";
    if (!form.text.trim()) e.text = "Testimonial text is required";
    return e;
  }

  function buildFormData() {
    const fd = new FormData();

    fd.append("name", form.name.trim());
    fd.append("role", form.role.trim());
    fd.append("headline", form.headline.trim());
    fd.append("text", form.text.trim());
    fd.append("type", form.type);
    fd.append("rating", String(form.rating));
    fd.append("sortOrder", String(form.sortOrder));
    fd.append("isActive", String(form.isActive));

    if (form.productName.trim()) {
      fd.append("productName", form.productName.trim());
    }

    // Before image
    if (beforeImage?.isNew && beforeImage.file) {
      fd.append("beforeImage", beforeImage.file);
    } else if (beforeImage && !beforeImage.isNew) {
      fd.append("beforeImage", beforeImage.url);
    } else if (!beforeImage && isEdit && initialData?.beforeImage) {
      // Image was removed
      fd.append("beforeImage", "");
    }

    // After image
    if (afterImage?.isNew && afterImage.file) {
      fd.append("afterImage", afterImage.file);
    } else if (afterImage && !afterImage.isNew) {
      fd.append("afterImage", afterImage.url);
    } else if (!afterImage && isEdit && initialData?.afterImage) {
      fd.append("afterImage", "");
    }

    appendSources(fd, "beforeImage", beforeImageSources);
    appendSources(fd, "afterImage", afterImageSources);
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
    const fd = buildFormData();
    await onSubmit(fd);
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
        : "border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Information */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Customer Info</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={inputClass("name")}
              placeholder="e.g. Priya S."
            />
            {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Role</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              className={inputClass("role")}
              placeholder="Verified Buyer"
            />
          </div>
        </div>
      </div>

      {/* Testimonial Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Testimonial</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setField("headline", e.target.value)}
              className={inputClass("headline")}
              placeholder='e.g. "Life-Changing!"'
            />
            {errors.headline && <span className="text-xs text-red-600">{errors.headline}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Text <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={form.text}
              onChange={(e) => setField("text", e.target.value)}
              className={inputClass("text")}
              placeholder="Full testimonial text..."
            />
            {errors.text && <span className="text-xs text-red-600">{errors.text}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Product Name</label>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setField("productName", e.target.value)}
              className={inputClass("productName")}
              placeholder="e.g. Kumkumadi Night Elixir"
            />
            <span className="text-xs text-zinc-400">Shown in the Real Results grid</span>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Display Settings</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Section</label>
            <Select.Root value={form.type} onValueChange={(val) => setField("type", val)}>
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
                    {TYPE_OPTIONS.map((opt) => (
                      <Select.Item
                        key={opt.value}
                        value={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                      >
                        <Select.ItemIndicator>
                          <CheckIcon className="h-4 w-4" />
                        </Select.ItemIndicator>
                        <Select.ItemText>
                          {opt.label}{" "}
                          <span className="text-zinc-400">({opt.hint})</span>
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            <span className="text-xs text-zinc-400">
              Controls which homepage section this appears in
            </span>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Rating</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={(e) => setField("rating", Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              className={inputClass("rating")}
            />
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Sort Order</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setField("sortOrder", Number(e.target.value) || 0)}
              className={inputClass("sortOrder")}
            />
            <span className="text-xs text-zinc-400">Lower number appears first</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <Switch.Root
              checked={form.isActive}
              onCheckedChange={(val) => setField("isActive", val)}
              className="h-5 w-9 rounded-full bg-zinc-200 transition-colors data-[state=checked]:bg-zinc-900"
            >
              <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
            Active
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Before & After Images</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload before and after photos. JPEG, PNG, or WebP, max 100MB each.
        </p>
        <Toggle
          checked={optimize}
          onCheckedChange={setOptimize}
          label="Optimize uploads → WebP (visually lossless)"
          labelClassName="text-xs text-zinc-500"
          size="sm"
          className="mt-2"
        />
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <SingleImageUpload
              label="Before Image"
              image={beforeImage}
              onChange={setBeforeImage}
            />
            <div className="border-t border-zinc-100 pt-3">
              <h3 className="text-xs font-medium text-zinc-700">
                Before — responsive variants
              </h3>
              <div className="mt-2">
                <ResponsiveVariants
                  value={beforeImageSources}
                  onChange={setBeforeImageSources}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <SingleImageUpload
              label="After Image"
              image={afterImage}
              onChange={setAfterImage}
            />
            <div className="border-t border-zinc-100 pt-3">
              <h3 className="text-xs font-medium text-zinc-700">
                After — responsive variants
              </h3>
              <div className="mt-2">
                <ResponsiveVariants
                  value={afterImageSources}
                  onChange={setAfterImageSources}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/testimonials"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Testimonial"}
        </button>
      </div>
    </form>
  );
}

// ── Single image upload with drop zone ──

function SingleImageUpload({ label, image, onChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    if (file.size > 100 * 1024 * 1024) return;
    onChange({ url: URL.createObjectURL(file), file, isNew: true });
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {image ? (
        <div className="relative overflow-hidden rounded-lg border border-zinc-200">
          <img src={image.url} alt={label} className="h-48 w-full object-cover" />
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
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          className={`flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
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

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      >
        Choose from library
      </button>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        imageOnly
        onSelect={(m) => onChange({ url: m.url, isNew: false })}
      />
    </div>
  );
}
