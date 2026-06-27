"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import {
  ChevronDownIcon,
  CheckIcon,
  Cross1Icon,
} from "@radix-ui/react-icons";

import { adminCategoryApi } from "@/lib/endpoints";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/context/toast-context";
import ImageUpload from "@/components/image-upload";
import SizeVariants from "@/components/size-variants";
import TabHighlightsEditor from "@/components/tab-highlights-editor";

const TAG_OPTIONS = ["Face Care", "Hair Care", "Body Care"];

const INITIAL_FORM = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  benefits: "",
  skinType: [],
  concerns: [],
  price: "",
  compareAtPrice: "",
  color: "",
  tag: "",
  category: "",
  ingredients: "",
  howToUse: "",
  values: "",
  shippingInfo: "",
  policies: "",
  isActive: true,
  isFeatured: false,
  isBundleable: false,
};

const INITIAL_SEO = { metaTitle: "", metaDescription: "", keywords: [] };

// Map fields to their tab for auto-switching on validation error
const FIELD_TAB = {
  name: "general",
  slug: "general",
  description: "general",
  price: "general",
  tag: "general",
  images: "media",
  sizes: "media",
  ingredients: "content",
  seo: "content",
};

function initForm(d) {
  if (!d) return INITIAL_FORM;
  return {
    name: d.name || "",
    slug: d.slug || "",
    description: d.description || "",
    shortDescription: d.shortDescription || "",
    benefits: (d.benefits || []).join("\n"),
    skinType: d.skinType || [],
    concerns: d.concerns || [],
    price: d.price ?? "",
    compareAtPrice: d.compareAtPrice ?? "",
    color: d.color || "",
    tag: d.tag || "",
    category: d.category?._id || "",
    ingredients: d.ingredients || "",
    howToUse: d.howToUse || "",
    values: d.values || "",
    shippingInfo: d.shippingInfo || "",
    policies: d.policies || "",
    isActive: d.isActive ?? true,
    isFeatured: d.isFeatured ?? false,
    isBundleable: d.isBundleable ?? false,
  };
}

function initSeo(d) {
  if (!d?.seo) return INITIAL_SEO;
  return {
    metaTitle: d.seo.metaTitle || "",
    metaDescription: d.seo.metaDescription || "",
    keywords: d.seo.keywords || [],
  };
}

function initSizes(d) {
  if (!d?.sizes?.length) return [];
  return d.sizes.map((s) => ({
    label: s.label || "",
    price: s.price ?? "",
    sku: s.sku || "",
    stock: s.stock ?? "",
  }));
}

const BREAKPOINT_KEYS = ["desktop", "tablet", "mobile"];

function initSources(s) {
  const out = {};
  if (!s) return out;
  for (const bp of BREAKPOINT_KEYS) {
    if (s[bp]) out[bp] = { url: s[bp], isNew: false };
  }
  return out;
}

function initImages(d) {
  if (!d?.images?.length) return [];
  return d.images.map((img) => ({
    url: img.url,
    alt: img.alt || "",
    isPrimary: img.isPrimary || false,
    isNew: false,
    sources: initSources(img.sources),
  }));
}

export default function ProductForm({ initialData, onSubmit, isSubmitting }) {
  const { showToast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState(() => initForm(initialData));
  const [seo, setSeo] = useState(() => initSeo(initialData));
  const [sizes, setSizes] = useState(() => initSizes(initialData));
  const [images, setImages] = useState(() => initImages(initialData));
  const [optimize, setOptimize] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tabHighlights, setTabHighlights] = useState(() => initialData?.tabHighlights || {});
  const [errors, setErrors] = useState({});
  const [slugManual, setSlugManual] = useState(!!initialData);
  const [activeTab, setActiveTab] = useState("general");
  const [keywordInput, setKeywordInput] = useState("");
  const [skinTypeInput, setSkinTypeInput] = useState("");
  const [concernInput, setConcernInput] = useState("");

  // Add/remove a value from an array-typed form field (skinType, concerns)
  const addTag = useCallback((field, text, reset) => {
    const t = text.trim();
    if (!t) return reset("");
    setForm((prev) =>
      prev[field].includes(t)
        ? prev
        : { ...prev, [field]: [...prev[field], t] }
    );
    reset("");
  }, []);

  const removeTag = useCallback((field, val) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((v) => v !== val),
    }));
  }, []);

  // Fetch categories
  useEffect(() => {
    adminCategoryApi.list().then(setCategories).catch(() => {});
  }, []);


  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, slugManual]);

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

  // Validation
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";

    if (!form.slug.trim()) e.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
      e.slug = "Only lowercase letters, numbers, and hyphens";

    if (!form.description.trim()) e.description = "Description is required";
    else if (form.description.length > 5000)
      e.description = "Max 5000 characters";

    if (form.price === "" || form.price === null)
      e.price = "Price is required";
    else if (Number(form.price) < 0) e.price = "Price must be 0 or more";

    if (!form.tag) e.tag = "Tag is required";

    return e;
  }

  // Build FormData
  function buildFormData() {
    const fd = new FormData();

    // Scalar fields
    const scalars = [
      "name", "slug", "description", "shortDescription", "price",
      "compareAtPrice", "color", "tag", "category", "ingredients",
      "howToUse", "values", "shippingInfo", "policies",
      "isActive", "isFeatured", "isBundleable",
    ];
    for (const key of scalars) {
      const val = form[key];
      if (val !== "" && val !== null && val !== undefined) {
        fd.append(key, val);
      }
    }

    // Sizes as JSON
    if (sizes.length > 0) {
      const cleaned = sizes
        .filter((s) => s.label.trim())
        .map((s) => ({
          label: s.label.trim(),
          price: Number(s.price) || 0,
          sku: s.sku.trim(),
          stock: Number(s.stock) || 0,
        }));
      if (cleaned.length > 0) {
        fd.append("sizes", JSON.stringify(cleaned));
      }
    }

    // SEO as JSON
    const seoData = {};
    if (seo.metaTitle.trim()) seoData.metaTitle = seo.metaTitle.trim();
    if (seo.metaDescription.trim())
      seoData.metaDescription = seo.metaDescription.trim();
    if (seo.keywords.length > 0) seoData.keywords = seo.keywords;
    if (Object.keys(seoData).length > 0) {
      fd.append("seo", JSON.stringify(seoData));
    }

    // Benefits (one per line) + skinType / concerns chips, as JSON arrays
    const benefitsArr = form.benefits
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (benefitsArr.length > 0) fd.append("benefits", JSON.stringify(benefitsArr));
    if (form.skinType.length > 0)
      fd.append("skinType", JSON.stringify(form.skinType));
    if (form.concerns.length > 0)
      fd.append("concerns", JSON.stringify(form.concerns));

    // Tab highlights as JSON
    const hasHighlights = Object.values(tabHighlights).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    if (hasHighlights) {
      fd.append("tabHighlights", JSON.stringify(tabHighlights));
    }

    // Images: a metadata array describing every image (kept + new) plus the new
    // base/variant files appended under unique keys the metadata references.
    const meta = images.map((img, i) => {
      const entry = { alt: img.alt || "", isPrimary: !!img.isPrimary };

      if (img.isNew && img.file) {
        const key = `img_${i}_base`;
        fd.append(key, img.file);
        entry.fileKey = key;
        entry.url = null;
      } else {
        entry.url = img.url;
      }

      const sources = {};
      const s = img.sources || {};
      for (const bp of BREAKPOINT_KEYS) {
        const v = s[bp];
        if (!v || !v.url) continue;
        if (v.isNew && v.file) {
          const vkey = `img_${i}_${bp}`;
          fd.append(vkey, v.file);
          sources[bp] = { fileKey: vkey };
        } else {
          sources[bp] = { url: v.url };
        }
      }
      if (Object.keys(sources).length) entry.sources = sources;

      return entry;
    });
    fd.append("images", JSON.stringify(meta));
    fd.append("optimize", String(optimize));

    return fd;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Switch to tab with first error
      const firstField = Object.keys(validationErrors)[0];
      const tab = FIELD_TAB[firstField] || "general";
      setActiveTab(tab);
      showToast("Please fix the highlighted errors", "error");
      return;
    }
    setErrors({});
    const fd = buildFormData();
    await onSubmit(fd);
  }

  // Keyword management
  function addKeyword(text) {
    const kw = text.trim().toLowerCase();
    if (kw && !seo.keywords.includes(kw)) {
      setSeo((prev) => ({ ...prev, keywords: [...prev.keywords, kw] }));
    }
    setKeywordInput("");
  }

  function removeKeyword(kw) {
    setSeo((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kw),
    }));
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
        : "border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-zinc-200">
          {[
            { value: "general", label: "General" },
            { value: "media", label: "Media & Variants" },
            { value: "content", label: "Content & SEO" },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* === GENERAL TAB === */}
        <Tabs.Content value="general" className="mt-6 flex flex-col gap-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              Basic Information
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={inputClass("name")}
                  placeholder="e.g. Kumkumadi Serum"
                />
                {errors.name && (
                  <span className="text-xs text-red-600">{errors.name}</span>
                )}
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  Slug <span className="text-red-500">*</span>
                  {!slugManual && form.name && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                      Auto
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setField("slug", e.target.value);
                  }}
                  className={inputClass("slug")}
                  placeholder="kumkumadi-serum"
                />
                {errors.slug && (
                  <span className="text-xs text-red-600">{errors.slug}</span>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
                  <span>
                    Description <span className="text-red-500">*</span>
                  </span>
                  <span className="text-xs font-normal text-zinc-400">
                    {form.description.length}/5000
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  maxLength={5000}
                  className={inputClass("description")}
                  placeholder="Full product description..."
                />
                {errors.description && (
                  <span className="text-xs text-red-600">
                    {errors.description}
                  </span>
                )}
              </div>

              {/* Short Description */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
                  <span>Short Description</span>
                </label>
                <textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) =>
                    setField("shortDescription", e.target.value)
                  }
                  className={inputClass("shortDescription")}
                  placeholder="Brief teaser text..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">Pricing</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Price (Rs.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  className={inputClass("price")}
                  placeholder="899"
                />
                {errors.price && (
                  <span className="text-xs text-red-600">{errors.price}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Compare at Price (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={(e) =>
                    setField("compareAtPrice", e.target.value)
                  }
                  className={inputClass("compareAtPrice")}
                  placeholder="1200"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              Classification
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Tag */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Tag <span className="text-red-500">*</span>
                </label>
                <Select.Root
                  value={form.tag}
                  onValueChange={(val) => setField("tag", val)}
                >
                  <Select.Trigger
                    className={`inline-flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm outline-none ${
                      errors.tag
                        ? "border-red-300"
                        : "border-zinc-200 focus:border-zinc-400"
                    }`}
                  >
                    <Select.Value placeholder="Select tag" />
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
                        {TAG_OPTIONS.map((t) => (
                          <Select.Item
                            key={t}
                            value={t}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                          >
                            <Select.ItemIndicator>
                              <CheckIcon className="h-4 w-4" />
                            </Select.ItemIndicator>
                            <Select.ItemText>{t}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                {errors.tag && (
                  <span className="text-xs text-red-600">{errors.tag}</span>
                )}
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Category
                </label>
                <Select.Root
                  value={form.category}
                  onValueChange={(val) =>
                    setField("category", val === "none" ? "" : val)
                  }
                >
                  <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400">
                    <Select.Value placeholder="No category" />
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
                        <Select.Item
                          value="none"
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                        >
                          <Select.ItemIndicator>
                            <CheckIcon className="h-4 w-4" />
                          </Select.ItemIndicator>
                          <Select.ItemText>No category</Select.ItemText>
                        </Select.Item>
                        {categories.map((cat) => (
                          <Select.Item
                            key={cat._id}
                            value={cat._id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                          >
                            <Select.ItemIndicator>
                              <CheckIcon className="h-4 w-4" />
                            </Select.ItemIndicator>
                            <Select.ItemText>{cat.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Color */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Color
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                  className={inputClass("color")}
                  placeholder="e.g. Golden"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">Status</h2>
            <div className="mt-4 flex flex-wrap gap-6">
              {[
                { key: "isActive", label: "Active" },
                { key: "isFeatured", label: "Featured" },
                { key: "isBundleable", label: "Bundleable" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-zinc-700"
                >
                  <Switch.Root
                    checked={form[key]}
                    onCheckedChange={(val) => setField(key, val)}
                    className="h-5 w-9 rounded-full bg-zinc-200 transition-colors data-[state=checked]:bg-zinc-900"
                  >
                    <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
                  </Switch.Root>
                  {label}
                </label>
              ))}
            </div>
          </div>
        </Tabs.Content>

        {/* === MEDIA & VARIANTS TAB === */}
        <Tabs.Content value="media" className="mt-6 flex flex-col gap-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">Images</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Upload up to 5 images. Each image will be cropped to 3:4 portrait. Click the star to set as primary.
            </p>
            <div className="mt-4">
              <ImageUpload
                images={images}
                onChange={setImages}
                optimize={optimize}
                onOptimizeChange={setOptimize}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              Size Variants
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Add size options with individual pricing and stock.
            </p>
            <div className="mt-4">
              <SizeVariants sizes={sizes} onChange={setSizes} />
            </div>
          </div>
        </Tabs.Content>

        {/* === CONTENT & SEO TAB === */}
        <Tabs.Content value="content" className="mt-6 flex flex-col gap-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              Product Content
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {[
                {
                  key: "ingredients",
                  label: "Ingredients",
                  placeholder: "List of ingredients...",
                },
                {
                  key: "howToUse",
                  label: "How to Use",
                  placeholder: "Usage instructions...",
                },
                {
                  key: "values",
                  label: "Values / Benefits",
                  placeholder: "Product benefits...",
                },
                {
                  key: "shippingInfo",
                  label: "Shipping Info",
                  placeholder: "Shipping details...",
                },
                {
                  key: "policies",
                  label: "Policies",
                  placeholder: "Return/exchange policies...",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">
                    {label}
                  </label>
                  <textarea
                    rows={3}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    className={inputClass(key)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Benefits / Skin Type / Concerns */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              Benefits &amp; Suitability
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {/* Benefits */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Benefits
                </label>
                <textarea
                  rows={5}
                  value={form.benefits}
                  onChange={(e) => setField("benefits", e.target.value)}
                  className={inputClass("benefits")}
                  placeholder="One benefit per line"
                />
                <span className="text-xs text-zinc-400">
                  One benefit per line.
                </span>
              </div>

              {/* Skin / Scalp Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Skin / Scalp Type
                </label>
                <input
                  type="text"
                  value={skinTypeInput}
                  onChange={(e) => setSkinTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag("skinType", skinTypeInput, setSkinTypeInput);
                    }
                  }}
                  onBlur={() => {
                    if (skinTypeInput.trim())
                      addTag("skinType", skinTypeInput, setSkinTypeInput);
                  }}
                  className={inputClass("skinType")}
                  placeholder="e.g. oily, dry, all — Enter to add"
                />
                {form.skinType.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.skinType.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                      >
                        {v}
                        <button
                          type="button"
                          onClick={() => removeTag("skinType", v)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <Cross1Icon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Concerns */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Concerns
                </label>
                <input
                  type="text"
                  value={concernInput}
                  onChange={(e) => setConcernInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag("concerns", concernInput, setConcernInput);
                    }
                  }}
                  onBlur={() => {
                    if (concernInput.trim())
                      addTag("concerns", concernInput, setConcernInput);
                  }}
                  className={inputClass("concerns")}
                  placeholder="e.g. Acne, Dandruff, Dryness — Enter to add"
                />
                {form.concerns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.concerns.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                      >
                        {v}
                        <button
                          type="button"
                          onClick={() => removeTag("concerns", v)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <Cross1Icon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <TabHighlightsEditor value={tabHighlights} onChange={setTabHighlights} />

          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-900">SEO</h2>
            <div className="mt-4 flex flex-col gap-4">
              {/* Meta Title */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
                  <span>Meta Title</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {seo.metaTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={seo.metaTitle}
                  onChange={(e) =>
                    setSeo((prev) => ({
                      ...prev,
                      metaTitle: e.target.value,
                    }))
                  }
                  maxLength={60}
                  className={inputClass("seoTitle")}
                  placeholder="SEO page title"
                />
              </div>

              {/* Meta Description */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
                  <span>Meta Description</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {seo.metaDescription.length}/160
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={seo.metaDescription}
                  onChange={(e) =>
                    setSeo((prev) => ({
                      ...prev,
                      metaDescription: e.target.value,
                    }))
                  }
                  maxLength={160}
                  className={inputClass("seoDesc")}
                  placeholder="Brief description for search engines"
                />
              </div>

              {/* Keywords */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    }
                  }}
                  onBlur={() => {
                    if (keywordInput.trim()) addKeyword(keywordInput);
                  }}
                  className={inputClass("keywords")}
                  placeholder="Type and press Enter to add"
                />
                {seo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {seo.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <Cross1Icon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/products"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Save Changes"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}
