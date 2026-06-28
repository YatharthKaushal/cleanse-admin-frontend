import api from "./api";

export const adminAuthApi = {
  login: (credentials) =>
    api.post("/admin/auth/login", credentials).then((r) => r.data),
  logout: () => api.post("/admin/auth/logout").then((r) => r.data),
};

export const adminWhatsAppApi = {
  // Returns slide's { data: [...templates], meta } payload.
  listTemplates: (params) =>
    api.get("/admin/whatsapp/templates", { params }).then((r) => r.data.data),
  // Returns slide's { data: [...logs], meta } payload.
  getLogs: (params) =>
    api.get("/admin/whatsapp/logs", { params }).then((r) => r.data.data),
  // body: { to, templateName, languageCode, components? }
  sendTemplate: (body) =>
    api.post("/admin/whatsapp/send", body).then((r) => r.data.data),
  confirmCod: (orderId) =>
    api.post(`/admin/whatsapp/orders/${orderId}/confirm`).then((r) => r.data.data),
  cancelCod: (orderId, reason) =>
    api.post(`/admin/whatsapp/orders/${orderId}/cancel`, { reason }).then((r) => r.data.data),
};

export const adminProductApi = {
  list: (params) =>
    api.get("/admin/products", { params }).then((r) => r.data.data),
  listFeatured: () =>
    api.get("/admin/products/featured").then((r) => r.data.data),
  reorderFeatured: (ids) =>
    api.patch("/admin/products/featured/reorder", { ids }).then((r) => r.data),
  get: (id) => api.get(`/admin/products/${id}`).then((r) => r.data.data),
  create: (formData) =>
    api
      .post("/admin/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  update: (id, formData) =>
    api
      .patch(`/admin/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),
  restore: (id) =>
    api.patch(`/admin/products/${id}/restore`).then((r) => r.data),
};

export const adminCategoryApi = {
  list: () => api.get("/admin/categories").then((r) => r.data.data),
  create: (formData) =>
    api
      .post("/admin/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  update: (id, formData) =>
    api
      .patch(`/admin/categories/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/categories/${id}`).then((r) => r.data),
};

export const adminTestimonialApi = {
  list: (params) =>
    api.get("/admin/testimonials", { params }).then((r) => r.data.data),
  get: (id) =>
    api.get(`/admin/testimonials/${id}`).then((r) => r.data.data),
  create: (formData) =>
    api
      .post("/admin/testimonials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  update: (id, formData) =>
    api
      .patch(`/admin/testimonials/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  delete: (id) =>
    api.delete(`/admin/testimonials/${id}`).then((r) => r.data),
};

export const adminOrderApi = {
  list: (params) =>
    api.get("/admin/orders", { params }).then((r) => r.data.data),
  get: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data.data),
  updateStatus: (id, status, note) =>
    api
      .patch(`/admin/orders/${id}/status`, { status, note })
      .then((r) => r.data.data),
  addNote: (id, note) =>
    api.patch(`/admin/orders/${id}/notes`, { note }).then((r) => r.data.data),
  refund: (id, amount, reason) =>
    api
      .post(`/admin/orders/${id}/refund`, { amount, reason })
      .then((r) => r.data.data),
  approveReturn: (id, action, note) =>
    api
      .patch(`/admin/orders/${id}/return`, { action, note })
      .then((r) => r.data.data),
};

// Per-order + account-level Shiprocket operations
export const adminShiprocketApi = {
  // per-order (return updated order in r.data.data.order)
  sync: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/sync`).then((r) => r.data.data),
  assignAwb: (id, courierId) =>
    api
      .post(`/admin/orders/${id}/shiprocket/assign-awb`, { courierId })
      .then((r) => r.data.data),
  pickup: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/pickup`).then((r) => r.data.data),
  label: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/label`).then((r) => r.data.data),
  manifest: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/manifest`).then((r) => r.data.data),
  invoice: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/invoice`).then((r) => r.data.data),
  cancel: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/cancel`).then((r) => r.data.data),
  track: (id) =>
    api.get(`/admin/orders/${id}/shiprocket/track`).then((r) => r.data.data),
  ndr: (id, action, comments) =>
    api
      .post(`/admin/orders/${id}/shiprocket/ndr`, { action, comments })
      .then((r) => r.data.data),
  createReturn: (id) =>
    api.post(`/admin/orders/${id}/shiprocket/return`).then((r) => r.data.data),
  serviceability: (id) =>
    api
      .get(`/admin/orders/${id}/shiprocket/serviceability`)
      .then((r) => r.data.data),
  // account-level
  listPickup: () =>
    api.get("/admin/shiprocket/pickup").then((r) => r.data.data),
  addPickup: (data) =>
    api.post("/admin/shiprocket/pickup", data).then((r) => r.data.data),
  couriers: () =>
    api.get("/admin/shiprocket/couriers").then((r) => r.data.data),
  wallet: () => api.get("/admin/shiprocket/wallet").then((r) => r.data.data),
  checkServiceability: (pincode, cod, weight) =>
    api
      .post("/admin/shiprocket/serviceability", { pincode, cod, weight })
      .then((r) => r.data.data),
  getMode: () => api.get("/admin/shiprocket/mode").then((r) => r.data.data),
  setMode: (mode) =>
    api.patch("/admin/shiprocket/mode", { mode }).then((r) => r.data.data),
  getConfig: () => api.get("/admin/shiprocket/config").then((r) => r.data.data),
  setConfig: (config) =>
    api.patch("/admin/shiprocket/config", config).then((r) => r.data.data),
  orderWebhookLogs: (id) =>
    api.get(`/admin/orders/${id}/shiprocket/logs`).then((r) => r.data.data),
  webhookLogs: (params) =>
    api.get("/admin/shiprocket/webhook-logs", { params }).then((r) => r.data.data),
};

export const adminBundleApi = {
  list: (params) =>
    api.get("/admin/bundles", { params }).then((r) => r.data.data),
  get: (id) => api.get(`/admin/bundles/${id}`).then((r) => r.data.data),
  create: (data) =>
    api.post("/admin/bundles", data).then((r) => r.data.data),
  update: (id, data) =>
    api.patch(`/admin/bundles/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/bundles/${id}`).then((r) => r.data),
};

export const adminShippingApi = {
  list: () => api.get("/admin/shipping").then((r) => r.data.data),
  create: (data) =>
    api.post("/admin/shipping", data).then((r) => r.data.data),
  update: (id, data) =>
    api.patch(`/admin/shipping/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/shipping/${id}`).then((r) => r.data),
};

export const adminCouponApi = {
  list: (params) =>
    api.get("/admin/coupons", { params }).then((r) => r.data.data),
  create: (data) =>
    api.post("/admin/coupons", data).then((r) => r.data.data),
  update: (id, data) =>
    api.patch(`/admin/coupons/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/coupons/${id}`).then((r) => r.data),
};

export const adminSettingsApi = {
  get: () => api.get("/admin/settings").then((r) => r.data.data),
  update: (data) =>
    api.patch("/admin/settings", data).then((r) => r.data.data),
};

export const adminDashboardApi = {
  overview: () => api.get("/admin/dashboard").then((r) => r.data.data),
  salesReport: (params) =>
    api.get("/admin/dashboard/reports/sales", { params }).then((r) => r.data.data),
  customerReport: () =>
    api.get("/admin/dashboard/reports/customers").then((r) => r.data.data),
  productReport: () =>
    api.get("/admin/dashboard/reports/products").then((r) => r.data.data),
};

export const adminCustomerApi = {
  list: (params) =>
    api.get("/admin/customers", { params }).then((r) => r.data.data),
  get: (id) => api.get(`/admin/customers/${id}`).then((r) => r.data.data),
};

export const adminBlogApi = {
  list: (params) =>
    api.get("/admin/blogs", { params }).then((r) => r.data.data),
  get: (id) => api.get(`/admin/blogs/${id}`).then((r) => r.data.data),
  create: (formData) =>
    api
      .post("/admin/blogs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  update: (id, formData) =>
    api
      .patch(`/admin/blogs/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/blogs/${id}`).then((r) => r.data),
  authors: () => api.get("/admin/blogs/authors").then((r) => r.data.data),
};

export const adminNewsletterApi = {
  listSubscribers: (params) =>
    api.get("/admin/newsletter/subscribers", { params }).then((r) => r.data.data),
  deleteSubscriber: (id) =>
    api.delete(`/admin/newsletter/subscribers/${id}`).then((r) => r.data),
  toggleSubscriber: (id) =>
    api.patch(`/admin/newsletter/subscribers/${id}/toggle`).then((r) => r.data.data),
  getStats: () =>
    api.get("/admin/newsletter/stats").then((r) => r.data.data),
  exportSubscribers: (status) =>
    api.get("/admin/newsletter/export", { params: { status }, responseType: "blob" }).then((r) => r.data),
  toggle: (enabled) =>
    api.patch("/admin/newsletter/toggle", { enabled }).then((r) => r.data.data),
  getConfig: () =>
    api.get("/admin/newsletter/config").then((r) => r.data.data),
  updateConfig: (data) =>
    api.patch("/admin/newsletter/config", data).then((r) => r.data.data),
  // Campaigns
  listCampaigns: (params) =>
    api.get("/admin/newsletter/campaigns", { params }).then((r) => r.data.data),
  getCampaign: (id) =>
    api.get(`/admin/newsletter/campaigns/${id}`).then((r) => r.data.data),
  createCampaign: (data) =>
    api.post("/admin/newsletter/campaigns", data).then((r) => r.data.data),
  updateCampaign: (id, data) =>
    api.patch(`/admin/newsletter/campaigns/${id}`, data).then((r) => r.data.data),
  deleteCampaign: (id) =>
    api.delete(`/admin/newsletter/campaigns/${id}`).then((r) => r.data),
  sendCampaign: (id) =>
    api.post(`/admin/newsletter/campaigns/${id}/send`).then((r) => r.data.data),
};

export const adminSpinWheelApi = {
  listPrizes: () =>
    api.get("/admin/spin-wheel/prizes").then((r) => r.data.data),
  createPrize: (data) =>
    api.post("/admin/spin-wheel/prizes", data).then((r) => r.data.data),
  updatePrize: (id, data) =>
    api.patch(`/admin/spin-wheel/prizes/${id}`, data).then((r) => r.data.data),
  deletePrize: (id) =>
    api.delete(`/admin/spin-wheel/prizes/${id}`).then((r) => r.data),
  listEntries: (params) =>
    api.get("/admin/spin-wheel/entries", { params }).then((r) => r.data.data),
  toggle: (enabled) =>
    api.patch("/admin/spin-wheel/toggle", { enabled }).then((r) => r.data.data),
};

export const adminSpecialCouponApi = {
  list: (params) =>
    api.get("/admin/special-coupons", { params }).then((r) => r.data.data),
  get: (id) =>
    api.get(`/admin/special-coupons/${id}`).then((r) => r.data.data),
  create: (data) =>
    api.post("/admin/special-coupons", data).then((r) => r.data.data),
  update: (id, data) =>
    api.patch(`/admin/special-coupons/${id}`, data).then((r) => r.data.data),
  delete: (id) =>
    api.delete(`/admin/special-coupons/${id}`).then((r) => r.data),
  clone: (id) =>
    api.post(`/admin/special-coupons/${id}/clone`).then((r) => r.data.data),
  usage: (id) =>
    api.get(`/admin/special-coupons/${id}/usage`).then((r) => r.data.data),
};

export const adminReviewApi = {
  list: (params) =>
    api.get("/admin/reviews", { params }).then((r) => r.data.data),
  stats: () => api.get("/admin/reviews/stats").then((r) => r.data.data),
  approve: (id) =>
    api.patch(`/admin/reviews/${id}/approve`).then((r) => r.data.data),
  delete: (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data),
};

export const adminReferralApi = {
  list: (params) =>
    api.get("/admin/referrals", { params }).then((r) => r.data.data),
  stats: () => api.get("/admin/referrals/stats").then((r) => r.data.data),
  markRewarded: (id) =>
    api.post(`/admin/referrals/${id}/mark-rewarded`).then((r) => r.data.data),
  reverse: (id) =>
    api.post(`/admin/referrals/${id}/reverse`).then((r) => r.data.data),
};

export const adminLoyaltyApi = {
  listUsers: (params) =>
    api.get("/admin/loyalty/users", { params }).then((r) => r.data.data),
  getUserTransactions: (userId, params) =>
    api
      .get(`/admin/loyalty/users/${userId}/transactions`, { params })
      .then((r) => r.data.data),
  adjust: (userId, points, reason) =>
    api
      .post(`/admin/loyalty/users/${userId}/adjust`, { points, reason })
      .then((r) => r.data.data),
  stats: () => api.get("/admin/loyalty/stats").then((r) => r.data.data),
};

export const adminMediaApi = {
  list: (params) =>
    api.get("/admin/media", { params }).then((r) => r.data.data),
  get: (id) => api.get(`/admin/media/${id}`).then((r) => r.data.data),
  upload: (formData) =>
    api
      .post("/admin/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
};

export const adminCmsApi = {
  getSection: (key) => api.get(`/admin/cms/${key}`).then((r) => r.data.data),
  updateSection: (key, data) =>
    api.patch(`/admin/cms/${key}`, data).then((r) => r.data.data),
  uploadImage: (formData) =>
    api
      .post("/admin/cms/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
  uploadVideo: (formData) =>
    api
      .post("/admin/cms/upload-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),
};
