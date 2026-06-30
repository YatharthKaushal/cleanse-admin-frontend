"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import CmsImageUpload from "./cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsPeelRevealEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const headerTexts = data.headerTexts || [];
  const introTexts = data.introTexts || [];

  const updateHeaderText = (index, value) => {
    const texts = [...headerTexts];
    texts[index] = value;
    update("headerTexts", texts);
  };

  const addHeaderText = () => {
    update("headerTexts", [...headerTexts, ""]);
  };

  const removeHeaderText = (index) => {
    update(
      "headerTexts",
      headerTexts.filter((_, i) => i !== index)
    );
  };

  const updateIntroText = (index, value) => {
    const texts = [...introTexts];
    texts[index] = value;
    update("introTexts", texts);
  };

  return (
    <div className="space-y-5">
      {/* Header Texts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-500">
            Header Texts
          </label>
          <button
            type="button"
            onClick={addHeaderText}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <PlusIcon className="h-3 w-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {headerTexts.map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => updateHeaderText(i, e.target.value)}
                placeholder={`Header text ${i + 1}`}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeHeaderText(i)}
                className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Footer Text
        </label>
        <input
          type="text"
          value={data.footerText || ""}
          onChange={(e) => update("footerText", e.target.value)}
          placeholder="Source: Himalayan"
          className={inputClass}
        />
      </div>

      <CmsImageUpload
        label="Section Image"
        value={data.image}
        onChange={(val) => update("image", val)}
        aspectRatio={1 / 1}
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Heading
        </label>
        <input
          type="text"
          value={data.heading || ""}
          onChange={(e) => update("heading", e.target.value)}
          placeholder="Ancient Secrets, Modern Radiance"
          className={inputClass}
        />
      </div>

      {/* Intro Texts (the two big words that slide apart) */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-2">
          Intro Texts (slide apart on scroll)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <input
              key={i}
              type="text"
              value={introTexts[i] || ""}
              onChange={(e) => updateIntroText(i, e.target.value)}
              placeholder={i === 0 ? "Shop" : "Now"}
              className={inputClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
