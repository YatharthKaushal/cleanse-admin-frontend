"use client";

import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import CmsImageUpload from "./cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsHeaderEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const navLinks = data.navLinks || [];
  const socialLinks = data.socialLinks || {};

  const updateNavLink = (index, field, value) => {
    const links = [...navLinks];
    links[index] = { ...links[index], [field]: value };
    update("navLinks", links);
  };

  const addNavLink = () => {
    update("navLinks", [...navLinks, { label: "", href: "" }]);
  };

  const removeNavLink = (index) => {
    update(
      "navLinks",
      navLinks.filter((_, i) => i !== index)
    );
  };

  const moveNavLink = (from, to) => {
    if (to < 0 || to >= navLinks.length) return;
    const links = [...navLinks];
    const [moved] = links.splice(from, 1);
    links.splice(to, 0, moved);
    update("navLinks", links);
  };

  const updateSocialLink = (key, value) => {
    update("socialLinks", { ...socialLinks, [key]: value });
  };

  return (
    <div className="space-y-5">
      <CmsImageUpload
        label="Logo Image (leave empty for default)"
        value={data.logoImage}
        onChange={(val) => update("logoImage", val)}
      />

      {/* Navigation Links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-500">
            Navigation Links
          </label>
          <button
            type="button"
            onClick={addNavLink}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <PlusIcon className="h-3 w-3" />
            Add Link
          </button>
        </div>
        <div className="space-y-2">
          {navLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveNavLink(i, i - 1)}
                  disabled={i === 0}
                  className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Move up"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveNavLink(i, i + 1)}
                  disabled={i === navLinks.length - 1}
                  className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Move down"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => updateNavLink(i, "label", e.target.value)}
                placeholder="Label (e.g. Home)"
                className={inputClass}
              />
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => updateNavLink(i, "href", e.target.value)}
                placeholder="URL (e.g. /)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeNavLink(i)}
                className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-2">
          Social Links (for menu overlay)
        </label>
        <div className="space-y-2">
          {["twitter", "instagram", "youtube"].map((platform) => (
            <div key={platform}>
              <label className="block text-xs font-medium text-zinc-400 mb-1 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={socialLinks[platform] || ""}
                onChange={(e) => updateSocialLink(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
