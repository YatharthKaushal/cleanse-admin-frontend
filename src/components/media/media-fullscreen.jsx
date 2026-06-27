"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons";
import { isVideo } from "./media-utils";

// Full-bleed preview of a single media item.
export default function MediaFullscreen({ media, open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/90" />
        <Dialog.Content className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <Dialog.Title className="sr-only">Media preview</Dialog.Title>
          <Dialog.Close className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <Cross1Icon className="h-5 w-5" />
          </Dialog.Close>
          {media &&
            (isVideo(media) ? (
              <video
                src={media.url}
                className="max-h-full max-w-full"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={media.url}
                alt={media.originalName || "media"}
                className="max-h-full max-w-full object-contain"
              />
            ))}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
