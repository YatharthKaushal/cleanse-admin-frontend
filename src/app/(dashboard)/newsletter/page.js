"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrashIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { adminNewsletterApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ConfirmDialog from "@/components/confirm-dialog";

const TABS = [
  { label: "Subscribers", value: "subscribers" },
  { label: "Campaigns", value: "campaigns" },
  { label: "Popup Config", value: "config" },
];

const SOURCE_OPTIONS = [
  { label: "All Sources", value: "" },
  { label: "Popup", value: "popup" },
  { label: "Footer", value: "footer" },
  { label: "Spin Wheel", value: "spin_wheel" },
  { label: "Checkout", value: "checkout" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function NewsletterPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("subscribers");

  // Feature toggle
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);

  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const debounceRef = useRef(null);

  // Config state
  const [config, setConfig] = useState({
    tag: "JOIN OUR COMMUNITY",
    heading: "Get 10% Off",
    description: "Subscribe to our newsletter and receive exclusive offers, Ayurvedic tips, and new product updates.",
    note: "No spam, unsubscribe anytime.",
    image: null,
    delaySeconds: 8,
    discountPercent: 10,
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    subject: "",
    htmlContent: "",
  });
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignSendingId, setCampaignSendingId] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const data = await adminNewsletterApi.listCampaigns({ page: 1, limit: 50 });
      setCampaigns(data.campaigns || []);
    } catch {
      showToast("Failed to load campaigns", "error");
    } finally {
      setCampaignsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === "campaigns") fetchCampaigns();
  }, [activeTab, fetchCampaigns]);

  const handleSaveCampaign = async () => {
    if (!campaignForm.subject.trim() || !campaignForm.htmlContent.trim()) {
      showToast("Subject and content are required", "error");
      return;
    }
    setCampaignSaving(true);
    try {
      if (editingCampaign) {
        await adminNewsletterApi.updateCampaign(editingCampaign._id, campaignForm);
        showToast("Campaign updated", "success");
      } else {
        await adminNewsletterApi.createCampaign(campaignForm);
        showToast("Campaign created", "success");
      }
      setShowCampaignForm(false);
      setEditingCampaign(null);
      setCampaignForm({ subject: "", htmlContent: "" });
      fetchCampaigns();
    } catch (err) {
      showToast(err?.response?.data?.message || "Save failed", "error");
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleSendCampaign = async (id) => {
    if (!confirm("Send this campaign to all active subscribers?")) return;
    setCampaignSendingId(id);
    try {
      await adminNewsletterApi.sendCampaign(id);
      showToast("Campaign send started. Refresh to see status.", "success");
      fetchCampaigns();
    } catch (err) {
      showToast(err?.response?.data?.message || "Send failed", "error");
    } finally {
      setCampaignSendingId(null);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await adminNewsletterApi.deleteCampaign(id);
      showToast("Campaign deleted", "success");
      fetchCampaigns();
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleEditCampaign = (c) => {
    setEditingCampaign(c);
    setCampaignForm({ subject: c.subject, htmlContent: c.htmlContent });
    setShowCampaignForm(true);
  };

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch toggle state + stats
  useEffect(() => {
    adminNewsletterApi.getConfig().then((data) => {
      if (data?.enabled !== undefined) setPopupEnabled(data.enabled);
      if (data?.config && Object.keys(data.config).length > 0) {
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    }).catch(() => {});

    adminNewsletterApi.getStats().then((data) => {
      if (data) setStats(data);
    }).catch(() => {});
  }, []);

  // Fetch subscribers
  const fetchSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (sourceFilter) params.source = sourceFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await adminNewsletterApi.listSubscribers(params);
      setSubscribers(Array.isArray(data?.subscribers) ? data.subscribers : []);
      if (data?.pagination) setPagination(data.pagination);
    } catch {
      showToast("Failed to load subscribers", "error");
    } finally {
      setSubscribersLoading(false);
    }
  }, [showToast, page, debouncedSearch, sourceFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === "subscribers") fetchSubscribers();
  }, [activeTab, fetchSubscribers]);

  // Toggle popup
  const handleToggle = async () => {
    setToggling(true);
    try {
      await adminNewsletterApi.toggle(!popupEnabled);
      setPopupEnabled(!popupEnabled);
      showToast(`Newsletter popup ${!popupEnabled ? "enabled" : "disabled"}`, "success");
    } catch {
      showToast("Failed to toggle newsletter popup", "error");
    } finally {
      setToggling(false);
    }
  };

  // Delete subscriber
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminNewsletterApi.deleteSubscriber(deleteTarget._id);
      showToast("Subscriber removed", "success");
      setDeleteTarget(null);
      fetchSubscribers();
      // Refresh stats
      adminNewsletterApi.getStats().then((data) => { if (data) setStats(data); }).catch(() => {});
    } catch {
      showToast("Failed to remove subscriber", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle subscriber active status
  const handleToggleSubscriber = async (sub) => {
    try {
      await adminNewsletterApi.toggleSubscriber(sub._id);
      fetchSubscribers();
      adminNewsletterApi.getStats().then((data) => { if (data) setStats(data); }).catch(() => {});
    } catch {
      showToast("Failed to update subscriber", "error");
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      const blob = await adminNewsletterApi.exportSubscribers(statusFilter || undefined);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "newsletter-subscribers.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Export downloaded", "success");
    } catch {
      showToast("Failed to export", "error");
    }
  };

  // Save popup config
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      await adminNewsletterApi.updateConfig(config);
      showToast("Popup config saved", "success");
    } catch {
      showToast("Failed to save config", "error");
    } finally {
      setConfigSaving(false);
    }
  };

  const sourceLabel = (source) => {
    const map = { popup: "Popup", footer: "Footer", spin_wheel: "Spin Wheel", checkout: "Checkout" };
    return map[source] || source;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Newsletter</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage subscribers and configure the newsletter popup
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">Popup</span>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                popupEnabled ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  popupEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {activeTab === "subscribers" && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Total</p>
            <p className="text-2xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Active</p>
            <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Inactive</p>
            <p className="text-2xl font-semibold text-zinc-400 mt-1">{stats.inactive}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Top Source</p>
            <p className="text-2xl font-semibold text-zinc-900 mt-1">
              {stats.sources && Object.keys(stats.sources).length > 0
                ? sourceLabel(Object.entries(stats.sources).sort((a, b) => b[1] - a[1])[0][0])
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 w-fit mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscribers Tab */}
      {activeTab === "subscribers" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email..."
              className="w-full max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {subscribersLoading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
              Loading...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
              <h3 className="mb-1 text-base font-medium text-zinc-700">No subscribers found</h3>
              <p className="text-sm text-zinc-500">Newsletter subscribers will appear here.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Source</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Subscribed</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3 text-zinc-900">{sub.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                            {sourceLabel(sub.source)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleSubscriber(sub)}>
                            {sub.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                Inactive
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setDeleteTarget(sub)}
                              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remove"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                  <p className="text-sm text-zinc-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} subscribers
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      let p;
                      if (pagination.pages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= pagination.pages - 2) {
                        p = pagination.pages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-zinc-900 text-white"
                              : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Email Campaigns</h2>
            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null);
                setCampaignForm({ subject: "", htmlContent: "" });
                setShowCampaignForm(true);
              }}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + New Campaign
            </button>
          </div>

          {showCampaignForm && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">
                {editingCampaign ? "Edit Campaign" : "New Campaign"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, subject: e.target.value })
                    }
                    placeholder="e.g. New arrivals — handcrafted for you"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Content (HTML)
                  </label>
                  <textarea
                    rows={12}
                    value={campaignForm.htmlContent}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, htmlContent: e.target.value })
                    }
                    placeholder="<h1>Hello there!</h1><p>...</p>"
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Email will be wrapped in a styled container with an
                    unsubscribe link automatically appended.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCampaignForm(false);
                      setEditingCampaign(null);
                    }}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCampaign}
                    disabled={campaignSaving}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {campaignSaving ? "Saving..." : "Save Campaign"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white">
            {campaignsLoading ? (
              <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">
                No campaigns yet
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {campaigns.map((c) => (
                  <div key={c._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-zinc-900">
                            {c.subject}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              c.status === "sent"
                                ? "bg-green-50 text-green-700"
                                : c.status === "sending"
                                  ? "bg-blue-50 text-blue-700"
                                  : c.status === "failed"
                                    ? "bg-red-50 text-red-700"
                                    : c.status === "scheduled"
                                      ? "bg-purple-50 text-purple-700"
                                      : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Created {new Date(c.createdAt).toLocaleString()}
                          {c.sentAt && ` · Sent ${new Date(c.sentAt).toLocaleString()}`}
                        </p>
                        {c.recipientCount > 0 && (
                          <p className="text-xs text-zinc-500 mt-1">
                            {c.successCount} / {c.recipientCount} delivered
                            {c.failureCount > 0 && ` (${c.failureCount} failed)`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {(c.status === "draft" || c.status === "scheduled") && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendCampaign(c._id)}
                              disabled={campaignSendingId === c._id}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {campaignSendingId === c._id ? "Sending..." : "Send Now"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditCampaign(c)}
                              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {(c.status === "draft" || c.status === "failed") && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(c._id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup Config Tab */}
      {activeTab === "config" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900 mb-4">Popup Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tag Line</label>
                <input
                  type="text"
                  value={config.tag}
                  onChange={(e) => setConfig((prev) => ({ ...prev, tag: e.target.value }))}
                  placeholder="e.g. JOIN OUR COMMUNITY"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Heading</label>
                <input
                  type="text"
                  value={config.heading}
                  onChange={(e) => setConfig((prev) => ({ ...prev, heading: e.target.value }))}
                  placeholder="e.g. Get 10% Off"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={config.description}
                  onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the offer..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Footer Note</label>
                <input
                  type="text"
                  value={config.note}
                  onChange={(e) => setConfig((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. No spam, unsubscribe anytime."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900 mb-4">Popup Behavior</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Discount Percent (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.discountPercent}
                  onChange={(e) => setConfig((prev) => ({ ...prev, discountPercent: e.target.value }))}
                  placeholder="e.g. 10"
                  className={inputClass}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Discount % of the coupon emailed to new subscribers
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Popup Delay (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={config.delaySeconds}
                  onChange={(e) => setConfig((prev) => ({ ...prev, delaySeconds: e.target.value }))}
                  placeholder="e.g. 8"
                  className={inputClass}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  How long to wait before showing the popup (in seconds)
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Image URL
                </label>
                <input
                  type="text"
                  value={config.image || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, image: e.target.value || null }))}
                  placeholder="e.g. /p1.png (leave empty for default)"
                  className={inputClass}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Product image shown in the popup. Leave empty to use default.
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900 mb-4">Preview</h2>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 max-w-lg mx-auto">
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                  {config.tag || "JOIN OUR COMMUNITY"}
                </span>
                <h3 className="text-xl font-bold text-zinc-900">
                  {config.heading || "Get 10% Off"}
                </h3>
                <p className="text-sm text-zinc-600">
                  {config.description || "Subscribe to our newsletter..."}
                </p>
                <div className="pt-3 space-y-2">
                  <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-400">
                    Enter your email
                  </div>
                  <div className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white text-center">
                    Subscribe
                  </div>
                </div>
                <p className="text-xs text-zinc-400 pt-1">
                  {config.note || "No spam, unsubscribe anytime."}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={configSaving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {configSaving ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove Subscriber"
        description={`Are you sure you want to remove "${deleteTarget?.email}"? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
