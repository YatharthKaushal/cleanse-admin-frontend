"use client";

import { useId } from "react";
import * as Switch from "@radix-ui/react-switch";

const SIZES = {
  sm: {
    root: "h-4 w-7",
    thumb: "h-3 w-3 data-[state=checked]:translate-x-[14px]",
  },
  md: {
    root: "h-5 w-9",
    thumb: "h-4 w-4 data-[state=checked]:translate-x-[18px]",
  },
};

/**
 * Reusable on/off toggle switch (replaces enable/disable checkboxes).
 *
 * Props:
 *  - checked, onCheckedChange — controlled state
 *  - label, description — optional text shown to the right
 *  - size — "sm" | "md" (default "md")
 *  - disabled, className
 */
export default function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
  size = "md",
  disabled = false,
  className = "",
  labelClassName = "text-sm font-medium text-zinc-700",
}) {
  const id = useId();
  const s = SIZES[size] || SIZES.md;

  const control = (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full bg-zinc-200 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400/70 focus-visible:ring-offset-1 data-[state=checked]:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${s.root}`}
    >
      <Switch.Thumb
        className={`pointer-events-none block translate-x-0.5 rounded-full bg-white shadow-sm transition-transform ${s.thumb}`}
      />
    </Switch.Root>
  );

  if (!label && !description) {
    return className ? <span className={className}>{control}</span> : control;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {control}
      <label
        htmlFor={id}
        className={`flex flex-col leading-tight ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {label && <span className={labelClassName}>{label}</span>}
        {description && (
          <span className="text-xs text-zinc-400">{description}</span>
        )}
      </label>
    </div>
  );
}
