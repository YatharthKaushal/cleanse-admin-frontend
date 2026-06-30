"use client";

import { useRef, useState } from "react";
import { Cross1Icon, UploadIcon } from "@radix-ui/react-icons";
import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ImageCropper from "@/components/image-cropper";
import {
  BREAKPOINTS,
  DEVICE_META,
  DeviceGlyph,
} from "@/components/responsive-variants";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// Optional per-screen-size media for a single CMS image. Unlike the product
// ResponsiveVariants (which defers upload for multipart submit), CMS uploads each
// variant immediately via the CMS upload endpoint and stores { url, publicId }.
// `sources` shape: { desktop?: {url,publicId}, tablet?: {...}, mobile?: {...} }
export default function CmsVariantSlots({ sources = {}, onChange }) {
  const { showToast } = useToast();
  const [uploadingKey, setUploadingKey] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // { key, file }
  const inputRefs = useRef({});

  function validate(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Only JPEG, PNG, WebP images allowed", "error");
      return false;
    }
    if (file.size > MAX_SIZE) {
      showToast("File too large. Max 100MB", "error");
      return false;
    }
    return true;
  }

  function handlePick(key, fileList) {
    const file = fileList?.[0];
    if (!file || !validate(file)) return;
    setCropTarget({ key, file });
  }

  async function uploadVariant(key, file) {
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("image", file, file.name);
      const result = await adminCmsApi.uploadImage(formData);
      onChange({ ...sources, [key]: result });
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploadingKey(null);
    }
  }

  // Capture the whole `cropTarget` (not `.key`) so the React Compiler's memo dep
  // is the object itself — reading `.key` at render throws when it's null.
  function handleCropped(croppedFile) {
    const target = cropTarget;
    if (!target) return;
    setCropTarget(null);
    uploadVariant(target.key, croppedFile);
  }

  function handleSkip() {
    const target = cropTarget;
    if (!target) return;
    setCropTarget(null);
    uploadVariant(target.key, target.file);
  }

  function clearVariant(key) {
    const next = { ...sources };
    delete next[key];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">
        Optional. Each screen size falls back to the main image when empty.
        Crop &amp; rotate before upload, or skip to use as-is.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BREAKPOINTS.map(({ key, label }) => {
          const v = sources?.[key];
          const isUploading = uploadingKey === key;
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
                  <div className="text-[10px] text-zinc-400">{DEVICE_META[key].hint}</div>
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
                      disabled={isUploading}
                      onClick={() => inputRefs.current[key]?.click()}
                      className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                    >
                      {isUploading ? "Uploading..." : "Replace"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => inputRefs.current[key]?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-500 disabled:opacity-50"
                  >
                    <UploadIcon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">
                      {isUploading ? "Uploading..." : "Add image"}
                    </span>
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
