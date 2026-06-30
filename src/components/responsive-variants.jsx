"use client";

import { useRef, useState } from "react";
import { Cross1Icon, UploadIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useToast } from "@/context/toast-context";
import ImageCropper from "@/components/image-cropper";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export const BREAKPOINTS = [
  { key: "desktop", label: "Desktop" },
  { key: "tablet", label: "Tablet" },
  { key: "mobile", label: "Mobile" },
];

// Per-device presentation: glyph dimensions (a simple rounded-rect drawn with a span so we
// don't depend on icons that may not exist) + a faint size hint.
export const DEVICE_META = {
  desktop: { hint: "≥ 1024px", glyph: "w-5 h-3.5" },
  tablet: { hint: "~ 768px", glyph: "w-3.5 h-4" },
  mobile: { hint: "≤ 480px", glyph: "w-2.5 h-4" },
};

export function DeviceGlyph({ deviceKey }) {
  if (deviceKey === "desktop") return <DesktopIcon className="h-4 w-4" />;
  const { glyph } = DEVICE_META[deviceKey];
  return <span className={`rounded-[3px] border-[1.5px] border-current ${glyph}`} />;
}

// Optional per-screen-size media for a single base image.
// `value` shape: { desktop: {url,file?,isNew?}|null, tablet: ..., mobile: ... }
export default function ResponsiveVariants({ value = {}, onChange }) {
  const { showToast } = useToast();
  const [cropTarget, setCropTarget] = useState(null); // { key, file }
  const inputRefs = useRef({});

  // Defensive: never let a malformed value blow up the render.
  const sources = value && typeof value === "object" ? value : {};

  function validate(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast(`${file.name}: Only JPEG, PNG, WebP allowed`, "error");
      return false;
    }
    if (file.size > MAX_SIZE) {
      showToast(`${file.name}: Max 100MB per image`, "error");
      return false;
    }
    return true;
  }

  function handlePick(key, fileList) {
    const file = fileList?.[0];
    if (!file || !validate(file)) return;
    setCropTarget({ key, file });
  }

  function setVariant(key, file) {
    const prev = sources[key];
    if (prev?.isNew && prev.url) URL.revokeObjectURL(prev.url);
    onChange({
      ...sources,
      [key]: { url: URL.createObjectURL(file), file, isNew: true },
    });
  }

  function clearVariant(key) {
    const prev = sources[key];
    if (prev?.isNew && prev.url) URL.revokeObjectURL(prev.url);
    onChange({ ...sources, [key]: null });
  }

  // Capture the whole `cropTarget` object (not `cropTarget.key`) so the React Compiler's
  // memo dependency is the object itself — otherwise it reads `cropTarget.key` at render
  // time, which throws when cropTarget is null (the common case).
  function handleCropped(croppedFile) {
    const target = cropTarget;
    if (!target) return;
    setVariant(target.key, croppedFile);
    setCropTarget(null);
  }

  function handleSkip() {
    const target = cropTarget;
    if (!target) return;
    setVariant(target.key, target.file);
    setCropTarget(null);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-zinc-500">
        Optional. Each screen size falls back to the main image when left empty.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BREAKPOINTS.map(({ key, label }) => {
          const v = sources[key];
          const hint = DEVICE_META[key].hint;
          return (
            <div
              key={key}
              className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              {/* Card header */}
              <div className="flex items-center gap-2 border-b border-zinc-100 px-2.5 py-2 text-zinc-600">
                <DeviceGlyph deviceKey={key} />
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-zinc-700">{label}</div>
                  <div className="text-[10px] text-zinc-400">{hint}</div>
                </div>
              </div>

              {/* Slot */}
              <div className="p-2">
                {v?.url ? (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200">
                    <img
                      src={v.url}
                      alt={`${label} variant`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => clearVariant(key)}
                      className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="Remove variant"
                    >
                      <Cross1Icon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => inputRefs.current[key]?.click()}
                      className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Replace
                    </button>
                    {v.isNew && (
                      <span className="absolute top-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        New
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRefs.current[key]?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-500"
                  >
                    <UploadIcon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Add image</span>
                  </button>
                )}
                <input
                  ref={(el) => (inputRefs.current[key] = el)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handlePick(key, e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {cropTarget && (
        <ImageCropper
          file={cropTarget.file}
          aspect={null}
          title={`Crop ${cropTarget.key} variant (free)`}
          onCropped={handleCropped}
          onCancel={handleSkip}
        />
      )}
    </div>
  );
}
