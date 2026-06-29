"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsFooterEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const navLinks = data.navigationLinks || [];
  const socialLinks = data.socialLinks || {};
  const contact = data.contact || {};
  const addressLines = contact.addressLines || [];

  const updateContact = (field, value) =>
    update("contact", { ...contact, [field]: value });

  const updateAddressLine = (index, value) => {
    const lines = [...addressLines];
    lines[index] = value;
    updateContact("addressLines", lines);
  };

  const addAddressLine = () =>
    updateContact("addressLines", [...addressLines, ""]);

  const removeAddressLine = (index) =>
    updateContact(
      "addressLines",
      addressLines.filter((_, i) => i !== index)
    );

  const updateNavLink = (index, field, value) => {
    const links = [...navLinks];
    links[index] = { ...links[index], [field]: value };
    update("navigationLinks", links);
  };

  const addNavLink = () => {
    update("navigationLinks", [...navLinks, { label: "", href: "" }]);
  };

  const removeNavLink = (index) => {
    update(
      "navigationLinks",
      navLinks.filter((_, i) => i !== index)
    );
  };

  const updateSocialLink = (key, value) => {
    update("socialLinks", { ...socialLinks, [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Navigation Links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-500">
            Footer Navigation Links
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
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => updateNavLink(i, "label", e.target.value)}
                placeholder="Label (e.g. HAIR CARE)"
                className={inputClass}
              />
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => updateNavLink(i, "href", e.target.value)}
                placeholder="URL (e.g. /wardrobe?category=Hair Care)"
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
          Social Links
        </label>
        <div className="space-y-2">
          {["instagram", "twitter", "facebook", "youtube"].map((platform) => (
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

      {/* Contact / Address */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-500">
            Address Lines
          </label>
          <button
            type="button"
            onClick={addAddressLine}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <PlusIcon className="h-3 w-3" />
            Add Line
          </button>
        </div>
        <div className="space-y-2">
          {addressLines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={line || ""}
                onChange={(e) => updateAddressLine(i, e.target.value)}
                placeholder="e.g. 42 Wellness Avenue, Bandra West, Mumbai 400050"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeAddressLine(i)}
                className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={contact.email || ""}
              onChange={(e) => updateContact("email", e.target.value)}
              placeholder="care@cleanseayurveda.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={contact.phone || ""}
              onChange={(e) => updateContact("phone", e.target.value)}
              placeholder="+91 80000 00000"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Copyright Text
        </label>
        <input
          type="text"
          value={data.copyrightText || ""}
          onChange={(e) => update("copyrightText", e.target.value)}
          placeholder="2026 CLEANSE AYURVEDA . ALL RIGHTS RESERVED"
          className={inputClass}
        />
      </div>
    </div>
  );
}
