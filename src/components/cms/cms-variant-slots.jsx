"use client";

import { useRef, useState } from "react";
import { Cross1Icon, UploadIcon } from "@radix-ui/react-icons";
import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import { BREAKPOINTS } from "@/components/responsive-variants";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Optional per-screen-size media for a single CMS image. Unlike the product
// ResponsiveVariants (which defers upload for multipart submit), CMS uploads each
// variant immediately via the CMS upload endpoint and stores { url, publicId }.
// `sources` shape: { desktop?: {url,publicId}, tablet?: {...}, mobile?: {...} }
export default function CmsVariantSlots({ sources = {}, onChange }) {
  const { showToast } = useToast();
  const [uploadingKey, setUploadingKey] = useState(null);
  const inputRefs = useRef({});

  function validate(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Only JPEG, PNG, WebP images allowed", "error");
      return false;
    }
    if (file.size > MAX_SIZE) {
      showToast("File too large. Max 5MB", "error");
      return false;
    }
    return true;
  }

  async function handlePick(key, fileList) {
    const file = fileList?.[0];
    if (!file || !validate(file)) return;
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

  function clearVariant(key) {
    const next = { ...sources };
    delete next[key];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">
        Optional. Each screen size falls back to the main image when empty.
        Uploaded as-is (no crop).
      </p>
      <div className="grid grid-cols-3 gap-3">
        {BREAKPOINTS.map(({ key, label }) => {
          const v = sources?.[key];
          const isUploading = uploadingKey === key;
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600">{label}</span>
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
                    className="absolute top-1 right-1 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Remove variant"
                  >
                    <Cross1Icon className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[key]?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-zinc-400 disabled:opacity-50"
                >
                  <UploadIcon className="h-5 w-5" />
                  <span className="mt-1 text-[10px]">
                    {isUploading ? "Uploading..." : "Upload"}
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
          );
        })}
      </div>
    </div>
  );
}
