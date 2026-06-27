"use client";

import { ImageIcon, VideoIcon } from "@radix-ui/react-icons";
import { formatBytes, formatDate, isVideo } from "./media-utils";

// Presentational media renderer used by the Media page and the picker.
// view: "grid" | "list". onSelect(item) fires on click.
export default function MediaGrid({ items, view = "grid", onSelect, selectedId }) {
  if (view === "list") {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Preview</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Folder</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Type</th>
              <th className="hidden px-3 py-2 font-medium md:table-cell">Provider</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr
                key={m._id}
                onClick={() => onSelect?.(m)}
                className={`cursor-pointer border-t border-zinc-100 transition-colors hover:bg-zinc-50 ${
                  selectedId === m._id ? "bg-zinc-100" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <Thumb m={m} className="h-10 w-10" />
                </td>
                <td className="px-3 py-2">
                  <span className="line-clamp-1 font-medium text-zinc-800">
                    {m.originalName || m.publicId}
                  </span>
                </td>
                <td className="hidden px-3 py-2 text-zinc-500 sm:table-cell">{m.folder || "—"}</td>
                <td className="hidden px-3 py-2 text-zinc-500 sm:table-cell">{m.resourceType}</td>
                <td className="hidden px-3 py-2 text-zinc-500 md:table-cell">{m.provider}</td>
                <td className="px-3 py-2 text-zinc-500">{formatBytes(m.bytes)}</td>
                <td className="hidden px-3 py-2 text-zinc-500 lg:table-cell">
                  {formatDate(m.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((m) => (
        <button
          key={m._id}
          type="button"
          onClick={() => onSelect?.(m)}
          className={`group relative aspect-square overflow-hidden rounded-lg border bg-zinc-50 transition-colors ${
            selectedId === m._id
              ? "border-zinc-900 ring-2 ring-zinc-900"
              : "border-zinc-200 hover:border-zinc-400"
          }`}
          title={m.originalName || m.publicId}
        >
          <Thumb m={m} className="h-full w-full" />
          {m.optimized && (
            <span className="absolute top-1 left-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              WebP
            </span>
          )}
          <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
            {m.provider === "s3" ? "S3" : "CLD"}
          </span>
        </button>
      ))}
    </div>
  );
}

function Thumb({ m, className = "" }) {
  if (isVideo(m)) {
    return (
      <div className={`relative ${className}`}>
        <video
          src={m.url}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <VideoIcon className="h-5 w-5 text-white drop-shadow" />
        </span>
      </div>
    );
  }
  if (!m.url) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ImageIcon className="h-5 w-5 text-zinc-400" />
      </div>
    );
  }
  return (
    <img
      src={m.url}
      alt={m.originalName || "media"}
      loading="lazy"
      className={`object-cover ${className}`}
    />
  );
}
