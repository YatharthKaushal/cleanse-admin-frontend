"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  UploadIcon,
  Cross1Icon,
  StarIcon,
  StarFilledIcon,
  ImageIcon,
} from "@radix-ui/react-icons";
import { useToast } from "@/context/toast-context";
import ImageCropper from "@/components/image-cropper";
import ResponsiveVariants, { BREAKPOINTS } from "@/components/responsive-variants";

const countVariants = (sources) =>
  sources ? BREAKPOINTS.filter(({ key }) => sources[key]?.url).length : 0;

const revokeVariantBlobs = (sources) => {
  if (!sources) return;
  for (const { key } of BREAKPOINTS) {
    const v = sources[key];
    if (v?.isNew && v.url) URL.revokeObjectURL(v.url);
  }
};

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUpload({ images = [], onChange, maxImages = 5 }) {
  const [dragOver, setDragOver] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [variantsFor, setVariantsFor] = useState(null); // index of image whose dialog is open
  const pendingQueue = useRef([]);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  function validateFiles(files) {
    const valid = [];
    const remaining = maxImages - images.length;

    for (const file of files) {
      if (valid.length >= remaining) {
        showToast(`Maximum ${maxImages} images allowed`, "error");
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`${file.name}: Only JPEG, PNG, WebP allowed`, "error");
        continue;
      }
      if (file.size > MAX_SIZE) {
        showToast(`${file.name}: Max 5MB per image`, "error");
        continue;
      }
      valid.push(file);
    }
    return valid;
  }

  function startCropping(fileList) {
    const files = validateFiles(Array.from(fileList));
    if (files.length === 0) return;
    pendingQueue.current = files.slice(1);
    setCropFile(files[0]);
  }

  function addImageFile(file) {
    const newImg = {
      url: URL.createObjectURL(file),
      alt: file.name,
      isPrimary: false,
      file,
      isNew: true,
    };
    const updated = [...images, newImg];
    if (!updated.some((img) => img.isPrimary)) {
      updated[0] = { ...updated[0], isPrimary: true };
    }
    onChange(updated);
  }

  function processNext(resultFile) {
    // Add the cropped/skipped file
    addImageFile(resultFile);

    // Move to next in queue or close
    if (pendingQueue.current.length > 0) {
      const next = pendingQueue.current[0];
      pendingQueue.current = pendingQueue.current.slice(1);
      setCropFile(next);
    } else {
      setCropFile(null);
    }
  }

  function handleCropped(croppedFile) {
    processNext(croppedFile);
  }

  function handleSkipCrop() {
    processNext(cropFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      startCropping(e.dataTransfer.files);
    }
  }

  function handleRemove(index) {
    const img = images[index];
    if (img.isNew && img.url) {
      URL.revokeObjectURL(img.url);
    }
    revokeVariantBlobs(img.sources);
    const updated = images.filter((_, i) => i !== index);
    if (img.isPrimary && updated.length > 0) {
      updated[0] = { ...updated[0], isPrimary: true };
    }
    onChange(updated);
  }

  function handleSetPrimary(index) {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  }

  function handleVariantsChange(index, sources) {
    const updated = images.map((img, i) =>
      i === index ? { ...img, sources } : img
    );
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
            dragOver
              ? "border-zinc-500 bg-zinc-50"
              : "border-zinc-300 hover:border-zinc-400"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <UploadIcon className="mb-2 h-6 w-6 text-zinc-400" />
          <p className="text-sm text-zinc-500">
            Drag images here or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            JPEG, PNG, WebP. Max 5MB. Up to {maxImages} images. Cropped to 3:4 portrait.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) startCropping(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img, index) => (
            <div
              key={img.url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200"
            >
              <img
                src={img.url}
                alt={img.alt || "Product image"}
                className="h-full w-full object-cover"
              />

              {/* Primary indicator / button */}
              <button
                type="button"
                onClick={() => handleSetPrimary(index)}
                className={`absolute bottom-1 left-1 rounded-full p-1 ${
                  img.isPrimary
                    ? "bg-amber-500 text-white"
                    : "bg-black/40 text-white opacity-0 group-hover:opacity-100"
                }`}
                title={img.isPrimary ? "Primary image" : "Set as primary"}
              >
                {img.isPrimary ? (
                  <StarFilledIcon className="h-3 w-3" />
                ) : (
                  <StarIcon className="h-3 w-3" />
                )}
              </button>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Cross1Icon className="h-3 w-3" />
              </button>

              {/* Responsive variants button */}
              <button
                type="button"
                onClick={() => setVariantsFor(index)}
                className={`absolute bottom-1 right-1 flex items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-medium ${
                  countVariants(img.sources) > 0
                    ? "bg-zinc-900 text-white"
                    : "bg-black/60 text-white"
                }`}
                title="Responsive variants"
              >
                <ImageIcon className="h-3 w-3" />
                {countVariants(img.sources) > 0 && countVariants(img.sources)}
              </button>

              {/* New badge */}
              {img.isNew && (
                <span className="absolute top-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Crop dialog */}
      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCropped={handleCropped}
          onCancel={handleSkipCrop}
        />
      )}

      {/* Responsive variants dialog */}
      <Dialog.Root
        open={variantsFor !== null}
        onOpenChange={(open) => !open && setVariantsFor(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-zinc-900">
                Responsive variants
              </Dialog.Title>
              <Dialog.Close className="rounded p-1 text-zinc-400 hover:text-zinc-700">
                <Cross1Icon className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-1 text-sm text-zinc-500">
              Upload alternate media for specific screen sizes for this image.
            </Dialog.Description>
            <div className="mt-4">
              {variantsFor !== null && (
                <ResponsiveVariants
                  value={images[variantsFor]?.sources || {}}
                  onChange={(sources) => handleVariantsChange(variantsFor, sources)}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
