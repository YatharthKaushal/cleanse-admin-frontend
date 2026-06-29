"use client";

import CmsImageUpload from "./cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

const POSITION_OPTIONS = [
  { value: "left-top", label: "Left Top" },
  { value: "center", label: "Center" },
  { value: "right-bottom", label: "Right Bottom" },
];

// Marquee now uses only 2 lines (Line 3 removed per request). Set back to 3
// (or Infinity) to re-enable the third line in the admin editor. The storefront
// already guards each line (marqueeLines[2] && ...), so existing line-3 data in
// the DB stays intact and simply isn't shown — nothing breaks either way.
const MAX_MARQUEE_LINES = 2;

export default function CmsMarqueeEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const updateMarqueeLine = (index, value) => {
    const lines = [...(data.marqueeLines || [])];
    lines[index] = value;
    update("marqueeLines", lines);
  };

  const updateReel = (index, field, value) => {
    const reels = [...(data.reels || [])];
    reels[index] = { ...reels[index], [field]: value };
    update("reels", reels);
  };

  const marqueeLines = data.marqueeLines || [];
  const reels = data.reels || [];

  return (
    <div className="space-y-5">
      {/* Marquee Lines */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">
          Marquee Text Lines
        </h3>
        <div className="space-y-2">
          {/* Only render up to MAX_MARQUEE_LINES (Line 3 hidden per request).
              Use slice so any extra line still stored in the DB is preserved,
              just not editable here. Remove the slice to show all lines again. */}
          {marqueeLines.slice(0, MAX_MARQUEE_LINES).map((line, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Line {i + 1}
              </label>
              <input
                type="text"
                value={line}
                onChange={(e) => updateMarqueeLine(i, e.target.value)}
                placeholder={`Marquee line ${i + 1}`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section Header & Instagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Section Header
          </label>
          <input
            type="text"
            value={data.sectionHeader || ""}
            onChange={(e) => update("sectionHeader", e.target.value)}
            placeholder="VIEW TRENDING"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Instagram Handle
          </label>
          <input
            type="text"
            value={data.instagramHandle || ""}
            onChange={(e) => update("instagramHandle", e.target.value)}
            placeholder="@CleanseAyurveda"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Instagram Profile URL
        </label>
        <input
          type="url"
          value={data.instagramUrl || ""}
          onChange={(e) => update("instagramUrl", e.target.value)}
          placeholder="https://www.instagram.com/cleanseayurveda/"
          className={inputClass}
        />
      </div>

      {/* Reels */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">
          Reel Cards
        </h3>
        <div className="space-y-4">
          {reels.map((reel, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4"
            >
              <p className="text-xs font-semibold text-zinc-600 mb-3">
                Reel {i + 1}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={reel.title || ""}
                    onChange={(e) => updateReel(i, "title", e.target.value)}
                    placeholder="Morning Ritual"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={reel.subtitle || ""}
                    onChange={(e) => updateReel(i, "subtitle", e.target.value)}
                    placeholder="Golden Hour Glow"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Position
                  </label>
                  <select
                    value={reel.position || ""}
                    onChange={(e) => updateReel(i, "position", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select position...</option>
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Reel URL
                </label>
                <input
                  type="url"
                  value={reel.reelUrl || ""}
                  onChange={(e) => updateReel(i, "reelUrl", e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className={inputClass}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Clicking the reel card on the storefront opens this link in a
                  new tab.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <CmsImageUpload
                  label="Poster Image"
                  value={reel.posterImage}
                  onChange={(val) => updateReel(i, "posterImage", val)}
                  aspectRatio={9 / 13}
                />
                <CmsImageUpload
                  label="Video"
                  type="video"
                  value={reel.video}
                  onChange={(val) => updateReel(i, "video", val)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
