"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon, UploadIcon } from "@radix-ui/react-icons";
import { adminMediaApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

const ALLOWED = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX = 50 * 1024 * 1024;

// Upload-new-media modal. Calls onUploaded(mediaDoc) on success.
export default function MediaUploader({ open, onOpenChange, onUploaded }) {
  const [file, setFile] = useState(null);
  const [optimize, setOptimize] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  const isVideo = file?.type?.startsWith("video/");

  function reset() {
    setFile(null);
    setOptimize(true);
    setUploading(false);
  }

  function pick(f) {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      showToast("Unsupported file type", "error");
      return;
    }
    if (f.size > MAX) {
      showToast("File too large. Max 50MB", "error");
      return;
    }
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Optimize only applies to images.
      fd.append("optimize", String(!isVideo && optimize));
      const media = await adminMediaApi.upload(fd);
      showToast("Media uploaded", "success");
      onUploaded?.(media);
      reset();
      onOpenChange(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
      setUploading(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!uploading) {
          if (!o) reset();
          onOpenChange(o);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[55] w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Upload media
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-zinc-400 hover:text-zinc-700">
              <Cross1Icon className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 px-4 py-8 hover:border-zinc-400"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files?.[0]);
            }}
          >
            {file ? (
              <p className="text-sm font-medium text-zinc-700">{file.name}</p>
            ) : (
              <>
                <UploadIcon className="mb-2 h-6 w-6 text-zinc-400" />
                <p className="text-sm text-zinc-500">Drop file or click to browse</p>
                <p className="mt-1 text-xs text-zinc-400">
                  JPEG, PNG, WebP, MP4, WebM, MOV. Max 50MB
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <label
            className={`mt-4 flex items-center gap-2 text-sm ${
              isVideo ? "cursor-not-allowed text-zinc-400" : "cursor-pointer text-zinc-700"
            }`}
          >
            <input
              type="checkbox"
              checked={!isVideo && optimize}
              disabled={isVideo}
              onChange={(e) => setOptimize(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Optimize — convert to WebP (visually lossless)
            {isVideo && <span className="text-xs">(images only)</span>}
          </label>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={uploading}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
