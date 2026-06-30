"use client";

import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { UploadIcon, Cross1Icon, ImageIcon, ListBulletIcon } from "@radix-ui/react-icons";
import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import CmsVariantSlots from "./cms-variant-slots";
import MediaPicker from "@/components/media/media-picker";
import Toggle from "@/components/toggle";
import { getCroppedBlob } from "@/lib/crop-image";

function RotateLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 7v5h5M3.5 11a8 8 0 1 1 1.2 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RotateRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 7v5h-5M20.5 11a8 8 0 1 0-1.2 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Human-readable ratio label from a decimal aspect ratio
function ratioLabel(ar) {
  const KNOWN = [
    [16, 9],
    [3, 1],
    [5, 4],
    [12, 5],
    [1, 1],
    [9, 13],
    [4, 3],
    [3, 2],
  ];
  for (const [w, h] of KNOWN) {
    if (Math.abs(ar - w / h) < 0.02) return `${w}:${h}`;
  }
  return `${Math.round(ar * 100) / 100}:1`;
}

export default function CmsImageUpload({
  value,
  onChange,
  label,
  type = "image",
  aspectRatio,
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [optimize, setOptimize] = useState(true);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  // Crop state
  const [cropSrc, setCropSrc] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const isVideo = type === "video";
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const acceptStr = isVideo
    ? "video/mp4,video/webm,video/quicktime"
    : "image/jpeg,image/png,image/webp";

  function validateFile(file) {
    if (!allowedTypes.includes(file.type)) {
      showToast(
        isVideo
          ? "Only MP4, WebM, MOV videos allowed"
          : "Only JPEG, PNG, WebP images allowed",
        "error"
      );
      return false;
    }
    if (file.size > maxSize) {
      showToast("File too large. Max 100MB", "error");
      return false;
    }
    return true;
  }

  function handleFileSelect(file) {
    if (!validateFile(file)) return;

    // If it's an image with an aspect ratio, open crop modal
    if (!isVideo && aspectRatio) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result);
        setCropFile(file);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise upload directly
    uploadFile(file);
  }

  async function uploadFile(fileOrBlob, originalFile) {
    setUploading(true);
    try {
      const formData = new FormData();
      if (isVideo) {
        formData.append("video", fileOrBlob);
      } else {
        const name = originalFile?.name || fileOrBlob.name || "image.jpg";
        formData.append("image", fileOrBlob, name);
      }
      if (!isVideo) formData.append("optimize", String(optimize));
      const result = isVideo
        ? await adminCmsApi.uploadVideo(formData)
        : await adminCmsApi.uploadImage(formData);
      onChange(result);
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels) return;
    const mimeType = cropFile?.type || "image/jpeg";
    const blob = await getCroppedBlob(
      cropSrc,
      croppedAreaPixels,
      rotation,
      mimeType
    );
    setCropSrc(null);
    uploadFile(blob, cropFile);
    setCropFile(null);
  }

  function handleCropCancel() {
    setCropSrc(null);
    setCropFile(null);
    setRotation(0);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleRemove() {
    onChange(null);
  }

  const hasValue = value?.url;
  const variantCount = value?.sources
    ? Object.values(value.sources).filter((s) => s?.url).length
    : 0;

  return (
    <>
      <div className="flex flex-col items-start gap-1.5">
        {label && (
          <label className="text-xs font-medium text-zinc-500">
            {label}
            {aspectRatio && (
              <span className="ml-1.5 text-zinc-400 font-normal">
                ({ratioLabel(aspectRatio)})
              </span>
            )}
          </label>
        )}

        {hasValue ? (
          <div className="group relative">
            {isVideo ? (
              <video
                src={value.url}
                className="h-32 w-48 rounded-lg border border-zinc-200 object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={value.url}
                alt={label || "CMS image"}
                className="h-32 w-auto rounded-lg border border-zinc-200 object-cover"
              />
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Cross1Icon className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
              dragOver
                ? "border-zinc-500 bg-zinc-50"
                : "border-zinc-300 hover:border-zinc-400"
            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <UploadIcon className="mb-1.5 h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-500">
              {uploading
                ? "Uploading..."
                : isVideo
                  ? "Drop video or click to browse"
                  : "Drop image or click to browse"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {isVideo
                ? "MP4, WebM, MOV. Max 100MB"
                : "JPEG, PNG, WebP. Max 100MB"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={acceptStr}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* Library picker + optimize toggle */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <ListBulletIcon className="h-3.5 w-3.5" />
            Choose from library
          </button>
          {!isVideo && (
            <Toggle
              checked={optimize}
              onCheckedChange={setOptimize}
              label="Optimize → WebP"
              labelClassName="text-xs text-zinc-500"
              size="sm"
            />
          )}
        </div>

        {/* Responsive variants (optional) — image slots only */}
        {!isVideo && hasValue && (
          <div className="mt-3 w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowVariants((s) => !s)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Responsive variants
              {variantCount > 0 ? ` (${variantCount})` : ""}
              <span className="text-zinc-400">{showVariants ? "▲" : "▼"}</span>
            </button>
            {showVariants && (
              <div className="mt-2">
                <CmsVariantSlots
                  sources={value.sources || {}}
                  onChange={(sources) => onChange({ ...value, sources })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative flex w-full max-w-xl flex-col rounded-xl bg-white shadow-xl">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Crop Image
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Adjust the crop area to fit the required{" "}
                {ratioLabel(aspectRatio)} ratio
              </p>
            </div>
            <div className="relative h-80 bg-zinc-100">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex flex-col gap-2 px-5 py-2">
              <label className="flex items-center gap-3 text-xs text-zinc-500">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-zinc-900"
                />
              </label>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                Rotate
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  title="Rotate left 90°"
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <RotateLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  title="Rotate right 90°"
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <RotateRightIcon className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-zinc-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3">
              <button
                type="button"
                onClick={handleCropCancel}
                className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        imageOnly={!isVideo}
        onSelect={(m) => onChange({ url: m.url })}
      />
    </>
  );
}
