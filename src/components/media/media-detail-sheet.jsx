"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon, CopyIcon, CheckIcon, EnterFullScreenIcon } from "@radix-ui/react-icons";
import { formatBytes, formatDate, isVideo } from "./media-utils";
import MediaFullscreen from "./media-fullscreen";

// Right-side sheet showing all details of a media item. Read-only (no destructive actions).
export default function MediaDetailSheet({ media, open, onOpenChange }) {
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(media.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
            <Dialog.Title className="text-sm font-semibold text-zinc-900">
              Media details
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-zinc-400 hover:text-zinc-700">
              <Cross1Icon className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {media && (
            <div className="flex-1 overflow-y-auto p-5">
              {/* Preview */}
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {isVideo(media) ? (
                  <video
                    src={media.url}
                    className="max-h-72 w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={media.originalName || "media"}
                    className="max-h-72 w-full object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-black/80"
                >
                  <EnterFullScreenIcon className="h-3.5 w-3.5" />
                  Preview fullscreen
                </button>
              </div>

              {/* URL + copy */}
              <div className="mt-4">
                <label className="text-xs font-medium text-zinc-500">URL</label>
                <div className="mt-1 flex items-stretch gap-2">
                  <input
                    readOnly
                    value={media.url}
                    className="flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    {copied ? <CheckIcon className="h-4 w-4 text-emerald-600" /> : <CopyIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <dl className="mt-4 divide-y divide-zinc-100 text-sm">
                <Row label="Name" value={media.originalName || "—"} />
                <Row label="Type" value={media.resourceType} />
                <Row label="Format" value={media.format || media.mimetype || "—"} />
                <Row label="Provider" value={media.provider === "s3" ? "AWS S3" : "Cloudinary"} />
                <Row label="Folder" value={media.folder || "—"} />
                <Row
                  label="Dimensions"
                  value={media.width && media.height ? `${media.width} × ${media.height}` : "—"}
                />
                <Row label="Size" value={formatBytes(media.bytes)} />
                <Row label="Optimized" value={media.optimized ? "Yes (WebP)" : "No"} />
                <Row
                  label="Uploaded by"
                  value={media.uploadedBy?.name || media.uploadedBy?.email || "—"}
                />
                <Row label="Uploaded at" value={formatDate(media.createdAt)} />
              </dl>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <MediaFullscreen media={media} open={fullscreen} onOpenChange={setFullscreen} />
    </Dialog.Root>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium break-all text-zinc-800">{value}</dd>
    </div>
  );
}
