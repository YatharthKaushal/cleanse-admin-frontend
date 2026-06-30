"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Cross1Icon } from "@radix-ui/react-icons";
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

export default function ImageCropper({
  file,
  onCropped,
  onCancel,
  aspect = 3 / 4,
  title = "Crop to portrait (3:4)",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const croppedPixelsRef = useRef(null);
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [naturalAspect, setNaturalAspect] = useState(null);

  // aspect === null => free crop: use the image's own ratio so the whole image is
  // selected by default (no forced reshape), while zoom/pan still work.
  const freeCrop = aspect === null;
  useEffect(() => {
    if (!freeCrop) return;
    const im = new Image();
    im.onload = () => setNaturalAspect(im.naturalWidth / im.naturalHeight);
    im.src = imageSrc;
  }, [freeCrop, imageSrc]);

  const effectiveAspect = freeCrop ? naturalAspect || 1 : aspect;

  const onCropComplete = useCallback((_, croppedPixels) => {
    croppedPixelsRef.current = croppedPixels;
  }, []);

  async function handleConfirm() {
    const pixels = croppedPixelsRef.current;
    if (!pixels) return;
    setIsCropping(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixels, rotation);
      const name = file.name.replace(/\.[^.]+$/, ".jpg");
      const croppedFile = new File([blob], name, { type: "image/jpeg" });
      URL.revokeObjectURL(imageSrc);
      onCropped(croppedFile);
    } catch (err) {
      console.error("Crop failed:", err);
      setIsCropping(false);
    }
  }

  function handleCancel() {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && handleCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col"
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Crop Image</Dialog.Title>
          </VisuallyHidden.Root>

          {/* Header */}
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">
                {title}
              </h3>
              <span className="rounded bg-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded p-1 text-zinc-400 hover:text-white"
            >
              <Cross1Icon className="h-4 w-4" />
            </button>
          </div>

          {/* Cropper area */}
          <div className="relative flex-1 bg-zinc-950">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={effectiveAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              showGrid={false}
              style={{
                cropAreaStyle: {
                  border: "2px solid #fff",
                  borderRadius: "4px",
                },
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-zinc-400">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 w-32 max-w-[40vw] cursor-pointer accent-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">Rotate</label>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  title="Rotate left 90°"
                  className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <RotateLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  title="Rotate right 90°"
                  className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
                  className="h-1 w-32 max-w-[40vw] cursor-pointer accent-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-zinc-600 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isCropping}
                className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
              >
                {isCropping ? "Cropping..." : "Crop & Add"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
