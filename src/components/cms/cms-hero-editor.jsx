"use client";

import { useState } from "react";
import { Cross1Icon, PlusIcon, DragHandleDots2Icon, ImageIcon } from "@radix-ui/react-icons";
import CmsImageUpload from "./cms-image-upload";
import CmsVariantSlots from "./cms-variant-slots";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsHeroEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const carouselImages = data.carouselImages || [];
  const [expanded, setExpanded] = useState(null);

  const handleImageUploaded = (result) => {
    if (!result?.url) return;
    update("carouselImages", [...carouselImages, result]);
  };

  const handleVariantsChange = (index, sources) => {
    update(
      "carouselImages",
      carouselImages.map((it, i) => (i === index ? { ...it, sources } : it))
    );
  };

  const handleRemoveImage = (index) => {
    update(
      "carouselImages",
      carouselImages.filter((_, i) => i !== index)
    );
  };

  const handleMoveImage = (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= carouselImages.length) return;
    const updated = [...carouselImages];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    update("carouselImages", updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Cleanse Ayurveda"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Subtitle
        </label>
        <input
          type="text"
          value={data.subtitle || ""}
          onChange={(e) => update("subtitle", e.target.value)}
          placeholder="Natural Skin Care for Mindful Living"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            CTA Button Text
          </label>
          <input
            type="text"
            value={data.ctaText || ""}
            onChange={(e) => update("ctaText", e.target.value)}
            placeholder="Shop Now"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            CTA Button Link
          </label>
          <input
            type="text"
            value={data.ctaLink || ""}
            onChange={(e) => update("ctaLink", e.target.value)}
            placeholder="/wardrobe"
            className={inputClass}
          />
        </div>
      </div>

      {/* Carousel Images */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Carousel Images
          <span className="ml-1.5 text-zinc-400 font-normal">
            ({carouselImages.length} image{carouselImages.length !== 1 ? "s" : ""} — auto-rotates every 5s)
          </span>
        </label>

        {carouselImages.length > 0 && (
          <div className="space-y-2 mb-3">
            {carouselImages.map((img, index) => (
              <div
                key={img.publicId || img.url || index}
                className="rounded-lg border border-zinc-200 bg-white p-2 group"
              >
                <div className="flex items-center gap-3">
                {/* Reorder controls */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveImage(index, -1)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 8L6 4L10 8" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(index, 1)}
                    disabled={index === carouselImages.length - 1}
                    className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 4L6 8L10 4" />
                    </svg>
                  </button>
                </div>

                {/* Thumbnail */}
                <img
                  src={img.url}
                  alt={`Slide ${index + 1}`}
                  className="h-16 w-28 rounded border border-zinc-100 object-cover shrink-0"
                />

                {/* Slide label */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-700">Slide {index + 1}</p>
                  <p className="text-xs text-zinc-400 truncate">{img.url}</p>
                </div>

                {/* Responsive variants toggle */}
                <button
                  type="button"
                  onClick={() => setExpanded((cur) => (cur === index ? null : index))}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  title="Responsive variants"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {Object.values(img.sources || {}).filter((s) => s?.url).length ||
                    ""}
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove image"
                >
                  <Cross1Icon className="h-3.5 w-3.5" />
                </button>
                </div>

                {expanded === index && (
                  <div className="mt-2 border-t border-zinc-100 pt-2">
                    <CmsVariantSlots
                      sources={img.sources || {}}
                      onChange={(sources) => handleVariantsChange(index, sources)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new image — uses the existing CmsImageUpload but in "append" mode */}
        <CmsImageUpload
          label="Add Slide Image"
          value={null}
          onChange={handleImageUploaded}
          aspectRatio={16 / 9}
        />

        {carouselImages.length === 0 && (
          <p className="text-xs text-amber-600 mt-1.5">
            No carousel images set. The hero section will use default fallback images.
          </p>
        )}
      </div>
    </div>
  );
}
