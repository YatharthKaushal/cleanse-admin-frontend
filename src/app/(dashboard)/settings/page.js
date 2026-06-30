"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, TrashIcon, ReloadIcon } from "@radix-ui/react-icons";
import { adminSettingsApi, adminShiprocketApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import Toggle from "@/components/toggle";

const DEFAULTS = {
  discount_tier_config: {
    enabled: true,
    tiers: [
      { threshold: 3500, type: "percent", percent: 15, label: "15% OFF" },
      { threshold: 2000, type: "percent", percent: 10, label: "10% OFF" },
      { threshold: 1200, type: "free_shipping", label: "Free Shipping" },
      { threshold: 500, type: "percent", percent: 5, label: "5% OFF" },
    ],
  },
  SHIPPING: { FREE_THRESHOLD: 1200, STANDARD_RATE: 99 },
  GIFT_WRAP_COST: 99,
  LOYALTY_RATE: 0.1,
  REFERRAL_REWARD: 200,
  loyalty_config: {
    enabled: true,
    earnRatePerRupee: 0.1,
    redeemRatePerPoint: 1,
    minRedemptionPoints: 100,
    maxPercentOfOrder: 50,
    expiryDays: 365,
    showInProfile: true,
  },
  referral_config: {
    enabled: true,
    rewardMode: "loyalty_points_referrer",
    referrerRewardValue: 200,
    refereeRewardValue: 100,
    referrerCouponDiscountType: "fixed",
    refereeCouponDiscountType: "fixed",
    couponValidityDays: 30,
    qualifyingOrderMinValue: 0,
    codePrefix: "CLEANSE-",
  },
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [discountTiers, setDiscountTiers] = useState(
    DEFAULTS.discount_tier_config.tiers
  );
  const [discountTiersEnabled, setDiscountTiersEnabled] = useState(
    DEFAULTS.discount_tier_config.enabled
  );
  const [shipping, setShipping] = useState(DEFAULTS.SHIPPING);
  const [giftWrapCost, setGiftWrapCost] = useState(DEFAULTS.GIFT_WRAP_COST);
  const [loyaltyRate, setLoyaltyRate] = useState(DEFAULTS.LOYALTY_RATE);
  const [referralReward, setReferralReward] = useState(DEFAULTS.REFERRAL_REWARD);
  const [loyaltyConfig, setLoyaltyConfig] = useState(DEFAULTS.loyalty_config);
  const [referralConfig, setReferralConfig] = useState(DEFAULTS.referral_config);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsApi.get();
      if (data) {
        const tierCfg = data.discount_tier_config;
        const tiers =
          tierCfg && Array.isArray(tierCfg.tiers) && tierCfg.tiers.length > 0
            ? tierCfg.tiers
            : DEFAULTS.discount_tier_config.tiers;
        setDiscountTiers(
          [...tiers].sort((a, b) => Number(b.threshold) - Number(a.threshold))
        );
        setDiscountTiersEnabled(tierCfg ? tierCfg.enabled !== false : true);
        setShipping(data.SHIPPING ?? DEFAULTS.SHIPPING);
        setGiftWrapCost(data.GIFT_WRAP_COST ?? DEFAULTS.GIFT_WRAP_COST);
        setLoyaltyRate(data.LOYALTY_RATE ?? DEFAULTS.LOYALTY_RATE);
        setReferralReward(data.REFERRAL_REWARD ?? DEFAULTS.REFERRAL_REWARD);
        setLoyaltyConfig({ ...DEFAULTS.loyalty_config, ...(data.loyalty_config || {}) });
        setReferralConfig({ ...DEFAULTS.referral_config, ...(data.referral_config || {}) });
      }
    } catch {
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    // Validate + normalize cart tiers before saving
    const cleanTiers = discountTiers.map((t) => ({
      threshold: Number(t.threshold),
      type: t.type === "free_shipping" ? "free_shipping" : "percent",
      percent: Number(t.percent),
      label: (t.label || "").trim(),
    }));
    for (const t of cleanTiers) {
      if (!(t.threshold > 0)) {
        showToast("Each tier needs a threshold greater than 0", "error");
        return;
      }
      if (!t.label) {
        showToast("Each tier needs a label", "error");
        return;
      }
      if (t.type === "percent" && !(t.percent > 0 && t.percent <= 100)) {
        showToast("Percent tiers need a discount between 1 and 100", "error");
        return;
      }
    }
    if (cleanTiers.filter((t) => t.type === "free_shipping").length > 1) {
      showToast("Only one Free Shipping tier is allowed", "error");
      return;
    }

    setSaving(true);
    try {
      const sortedTiers = [...cleanTiers].sort(
        (a, b) => b.threshold - a.threshold
      );
      await adminSettingsApi.update({
        discount_tier_config: {
          enabled: !!discountTiersEnabled,
          tiers: sortedTiers.map((t) =>
            t.type === "free_shipping"
              ? {
                  threshold: t.threshold,
                  type: "free_shipping",
                  label: t.label,
                }
              : {
                  threshold: t.threshold,
                  type: "percent",
                  percent: t.percent,
                  label: t.label,
                }
          ),
        },
        SHIPPING: {
          FREE_THRESHOLD: Number(shipping.FREE_THRESHOLD),
          STANDARD_RATE: Number(shipping.STANDARD_RATE),
        },
        GIFT_WRAP_COST: Number(giftWrapCost),
        LOYALTY_RATE: Number(loyaltyRate),
        REFERRAL_REWARD: Number(referralReward),
        loyalty_config: {
          enabled: !!loyaltyConfig.enabled,
          earnRatePerRupee: Number(loyaltyConfig.earnRatePerRupee),
          redeemRatePerPoint: Number(loyaltyConfig.redeemRatePerPoint),
          minRedemptionPoints: Number(loyaltyConfig.minRedemptionPoints),
          maxPercentOfOrder: Number(loyaltyConfig.maxPercentOfOrder),
          expiryDays: Number(loyaltyConfig.expiryDays),
          showInProfile: !!loyaltyConfig.showInProfile,
        },
        referral_config: {
          enabled: !!referralConfig.enabled,
          rewardMode: referralConfig.rewardMode,
          referrerRewardValue: Number(referralConfig.referrerRewardValue),
          refereeRewardValue: Number(referralConfig.refereeRewardValue),
          referrerCouponDiscountType: referralConfig.referrerCouponDiscountType,
          refereeCouponDiscountType: referralConfig.refereeCouponDiscountType,
          couponValidityDays: Number(referralConfig.couponValidityDays),
          qualifyingOrderMinValue: Number(referralConfig.qualifyingOrderMinValue),
          codePrefix: referralConfig.codePrefix || "CLEANSE-",
        },
      });
      setDiscountTiers(sortedTiers);
      showToast("Settings saved successfully", "success");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (index, field, value) => {
    setDiscountTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  };

  const addTier = () => {
    setDiscountTiers((prev) => [
      ...prev,
      { threshold: 0, type: "percent", percent: 0, label: "" },
    ]);
  };

  const removeTier = (index) => {
    setDiscountTiers((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage pricing rules, shipping, and rewards
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage pricing rules, shipping, and rewards
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Cart Tier Discounts */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-zinc-900">
              Cart Tier Discounts
            </h2>
            <div className="flex items-center gap-4">
              <Toggle
                checked={discountTiersEnabled}
                onCheckedChange={setDiscountTiersEnabled}
                label="Enabled"
                size="sm"
              />
              <button
                type="button"
                onClick={addTier}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Tier
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            {discountTiersEnabled
              ? "Spend-based rewards shown as the cart progress bar. Use one Free Shipping tier to set the free-shipping threshold."
              : "Disabled — no tier discounts apply and the cart progress bar is hidden."}
          </p>

          {discountTiers.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No discount tiers configured. Click "Add Tier" to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
            <div
              className={`space-y-3 min-w-[560px] ${
                discountTiersEnabled ? "" : "opacity-60"
              }`}
            >
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1.1fr_1fr_1.2fr_40px] gap-3">
                <label className="text-xs font-medium text-zinc-500">
                  Threshold (&#8377;)
                </label>
                <label className="text-xs font-medium text-zinc-500">Type</label>
                <label className="text-xs font-medium text-zinc-500">
                  Discount (%)
                </label>
                <label className="text-xs font-medium text-zinc-500">Label</label>
                <span />
              </div>

              {discountTiers.map((tier, index) => {
                const isFreeShipping = tier.type === "free_shipping";
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1.1fr_1fr_1.2fr_40px] gap-3 items-center"
                  >
                    <input
                      type="number"
                      min="0"
                      value={tier.threshold}
                      onChange={(e) =>
                        updateTier(index, "threshold", e.target.value)
                      }
                      placeholder="e.g. 3500"
                      className={inputClass}
                    />
                    <select
                      value={isFreeShipping ? "free_shipping" : "percent"}
                      onChange={(e) => updateTier(index, "type", e.target.value)}
                      className={inputClass}
                    >
                      <option value="percent">Percent off</option>
                      <option value="free_shipping">Free shipping</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={isFreeShipping ? "" : tier.percent ?? ""}
                      onChange={(e) =>
                        updateTier(index, "percent", e.target.value)
                      }
                      disabled={isFreeShipping}
                      placeholder={isFreeShipping ? "—" : "e.g. 15"}
                      className={`${inputClass} disabled:bg-zinc-50 disabled:text-zinc-300`}
                    />
                    <input
                      type="text"
                      value={tier.label}
                      onChange={(e) => updateTier(index, "label", e.target.value)}
                      placeholder={isFreeShipping ? "e.g. Free Shipping" : "e.g. 15% OFF"}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Remove tier"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>

        {/* Section 2: Shipping */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Shipping</h2>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Standard Shipping Rate (&#8377;)
            </label>
            <input
              type="number"
              min="0"
              value={shipping.STANDARD_RATE}
              onChange={(e) =>
                setShipping((prev) => ({
                  ...prev,
                  STANDARD_RATE: e.target.value,
                }))
              }
              placeholder="e.g. 99"
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            The free-shipping threshold is set as a Free Shipping tier under Cart
            Tier Discounts above. Per-region rates/thresholds are managed in
            Shipping Zones.
          </p>
        </div>

        {/* Section 3: Gift Wrap */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Gift Wrap</h2>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Gift Wrap Cost (&#8377;)
            </label>
            <input
              type="number"
              min="0"
              value={giftWrapCost}
              onChange={(e) => setGiftWrapCost(e.target.value)}
              placeholder="e.g. 99"
              className={inputClass}
            />
          </div>
        </div>

        {/* Section 4: Loyalty & Referral */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">
            Loyalty &amp; Referral
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Loyalty Rate (points per &#8377;)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loyaltyRate}
                onChange={(e) => setLoyaltyRate(e.target.value)}
                placeholder="e.g. 0.1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referral Reward (&#8377;)
              </label>
              <input
                type="number"
                min="0"
                value={referralReward}
                onChange={(e) => setReferralReward(e.target.value)}
                placeholder="e.g. 200"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Loyalty Program Config */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Loyalty Program
            </h2>
            <Toggle
              checked={!!loyaltyConfig.enabled}
              onCheckedChange={(val) =>
                setLoyaltyConfig({ ...loyaltyConfig, enabled: val })
              }
              label="Enabled"
              size="sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Earn rate (points per &#8377;)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={loyaltyConfig.earnRatePerRupee}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, earnRatePerRupee: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Redeem rate (&#8377; per point)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={loyaltyConfig.redeemRatePerPoint}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, redeemRatePerPoint: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Minimum redemption (points)
              </label>
              <input
                type="number"
                min="0"
                value={loyaltyConfig.minRedemptionPoints}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, minRedemptionPoints: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Max % of order paid by points
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={loyaltyConfig.maxPercentOfOrder}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, maxPercentOfOrder: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Expiry (days, 0 = no expiry)
              </label>
              <input
                type="number"
                min="0"
                value={loyaltyConfig.expiryDays}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, expiryDays: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Referral Program Config */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Referral Program
            </h2>
            <Toggle
              checked={!!referralConfig.enabled}
              onCheckedChange={(val) =>
                setReferralConfig({ ...referralConfig, enabled: val })
              }
              label="Enabled"
              size="sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Reward mode
              </label>
              <select
                value={referralConfig.rewardMode}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, rewardMode: e.target.value })
                }
                className={inputClass}
              >
                <option value="loyalty_points_referrer">Points to referrer only</option>
                <option value="loyalty_points_both">Points to both sides</option>
                <option value="coupon_referrer">Coupon to referrer only</option>
                <option value="coupon_both">Coupon to both sides</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Code prefix
              </label>
              <input
                type="text"
                value={referralConfig.codePrefix}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, codePrefix: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referrer reward value
              </label>
              <input
                type="number"
                min="0"
                value={referralConfig.referrerRewardValue}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, referrerRewardValue: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referee reward value
              </label>
              <input
                type="number"
                min="0"
                value={referralConfig.refereeRewardValue}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, refereeRewardValue: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referrer coupon type (if coupon mode)
              </label>
              <select
                value={referralConfig.referrerCouponDiscountType}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, referrerCouponDiscountType: e.target.value })
                }
                className={inputClass}
              >
                <option value="fixed">Fixed (&#8377;)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referee coupon type (if coupon mode)
              </label>
              <select
                value={referralConfig.refereeCouponDiscountType}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, refereeCouponDiscountType: e.target.value })
                }
                className={inputClass}
              >
                <option value="fixed">Fixed (&#8377;)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Coupon validity (days)
              </label>
              <input
                type="number"
                min="1"
                value={referralConfig.couponValidityDays}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, couponValidityDays: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Qualifying order min value (&#8377;)
              </label>
              <input
                type="number"
                min="0"
                value={referralConfig.qualifyingOrderMinValue}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, qualifyingOrderMinValue: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Shiprocket */}
        <ShiprocketSettings inputClass={inputClass} />
      </div>
    </div>
  );
}

function ShiprocketSettings({ inputClass }) {
  const { showToast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [pickup, setPickup] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add-pickup form
  const emptyPickup = {
    pickup_location: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    address_2: "",
    city: "",
    state: "",
    country: "India",
    pin_code: "",
  };
  const [form, setForm] = useState(emptyPickup);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Serviceability checker
  const [svcPin, setSvcPin] = useState("");
  const [svcCod, setSvcCod] = useState(true);
  const [svcResult, setSvcResult] = useState(null);
  const [svcLoading, setSvcLoading] = useState(false);

  // Operational config (pickup, warehouse, courier, NDR, package, alert email)
  const [cfg, setCfg] = useState(null);
  const [savingCfg, setSavingCfg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, p, c] = await Promise.all([
        adminShiprocketApi.wallet().catch(() => null),
        adminShiprocketApi.listPickup().catch(() => null),
        adminShiprocketApi.getConfig().catch(() => null),
      ]);
      setWallet(w?.balance ?? null);
      const list = p?.pickup?.shipping_address || p?.pickup || [];
      setPickup(Array.isArray(list) ? list : []);
      if (c?.config) setCfg(c.config);
    } catch {
      showToast("Failed to load Shiprocket data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const addPickup = async () => {
    if (!form.pickup_location || !form.pin_code || !form.phone) {
      showToast("Nickname, pincode and phone are required", "error");
      return;
    }
    setAdding(true);
    try {
      await adminShiprocketApi.addPickup(form);
      showToast("Pickup location added — verify it in Shiprocket before shipping", "success");
      setForm(emptyPickup);
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add pickup", "error");
    } finally {
      setAdding(false);
    }
  };

  // Pick a registered pickup location → auto-fill pincode + warehouse fields.
  const selectPickup = (nickname) => {
    const rec = pickup.find((p) => p.pickup_location === nickname);
    setCfg((c) => ({
      ...c,
      pickupLocation: nickname,
      ...(rec
        ? {
            pickupPincode: rec.pin_code || c.pickupPincode,
            warehouse: {
              ...c.warehouse,
              name: rec.name || c.warehouse?.name || "",
              address: rec.address || c.warehouse?.address || "",
              city: rec.city || c.warehouse?.city || "",
              state: rec.state || c.warehouse?.state || "",
              phone: rec.phone || c.warehouse?.phone || "",
            },
          }
        : {}),
    }));
  };

  const saveConfig = async () => {
    setSavingCfg(true);
    try {
      const data = await adminShiprocketApi.setConfig(cfg);
      if (data?.config) setCfg(data.config);
      showToast("Shipping configuration saved", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save config", "error");
    } finally {
      setSavingCfg(false);
    }
  };

  const checkSvc = async () => {
    if (!/^\d{6}$/.test(svcPin)) {
      showToast("Enter a valid 6-digit pincode", "error");
      return;
    }
    setSvcLoading(true);
    setSvcResult(null);
    try {
      const data = await adminShiprocketApi.checkServiceability(svcPin, svcCod ? 1 : 0, 0.5);
      setSvcResult(data.serviceability);
    } catch (err) {
      showToast(err?.response?.data?.message || "Serviceability check failed", "error");
    } finally {
      setSvcLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Shiprocket</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Account, pickup addresses & serviceability</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          <ReloadIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Wallet */}
      <div className="rounded-lg border border-zinc-200 p-4 flex items-center justify-between">
        <span className="text-sm text-zinc-500">Wallet balance</span>
        <span className="text-lg font-semibold text-zinc-900">
          {wallet === null ? "—" : `₹${Number(wallet).toLocaleString("en-IN")}`}
        </span>
      </div>

      {/* Operational configuration */}
      {cfg && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Configuration</h3>
          <div className="rounded-lg border border-zinc-200 p-4 space-y-4">
            {/* Pickup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Default pickup location</label>
                <select
                  value={cfg.pickupLocation || ""}
                  onChange={(e) => selectPickup(e.target.value)}
                  className={inputClass}
                >
                  {!pickup.some((p) => p.pickup_location === cfg.pickupLocation) && (
                    <option value={cfg.pickupLocation || ""}>{cfg.pickupLocation || "— select —"}</option>
                  )}
                  {pickup.map((p) => (
                    <option key={p.pickup_location} value={p.pickup_location}>
                      {p.pickup_location} ({p.pin_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Pickup pincode</label>
                <input
                  value={cfg.pickupPincode || ""}
                  onChange={(e) => setCfg({ ...cfg, pickupPincode: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Warehouse (return destination) */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">Warehouse address (where customer returns are sent back)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["name", "Name"],
                  ["phone", "Phone"],
                  ["address", "Address"],
                  ["city", "City"],
                  ["state", "State"],
                ].map(([k, label]) => (
                  <div key={k} className={k === "address" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
                    <input
                      value={cfg.warehouse?.[k] || ""}
                      onChange={(e) =>
                        setCfg({ ...cfg, warehouse: { ...cfg.warehouse, [k]: e.target.value } })
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Courier + NDR + alert email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Default courier ID (blank = auto)</label>
                <input
                  value={cfg.defaultCourierId || ""}
                  onChange={(e) => setCfg({ ...cfg, defaultCourierId: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">NDR auto re-attempts before RTO</label>
                <input
                  type="number"
                  min="0"
                  value={cfg.ndrMaxReattempts ?? 2}
                  onChange={(e) => setCfg({ ...cfg, ndrMaxReattempts: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Alert email (lost/damaged shipments)</label>
                <input
                  value={cfg.adminNotifyEmail || ""}
                  onChange={(e) => setCfg({ ...cfg, adminNotifyEmail: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Package defaults */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">Default package size (cm) / weight (kg)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["length", "Length"],
                  ["breadth", "Breadth"],
                  ["height", "Height"],
                  ["weight", "Weight"],
                ].map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={cfg.pkg?.[k] ?? ""}
                      onChange={(e) => setCfg({ ...cfg, pkg: { ...cfg.pkg, [k]: e.target.value } })}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveConfig}
                disabled={savingCfg}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {savingCfg ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : null}
                Save configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup locations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pickup locations</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
          {pickup.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">No pickup locations.</p>
          ) : (
            pickup.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {p.pickup_location}
                    {p.is_primary_location ? (
                      <span className="ml-2 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">primary</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {[p.city, p.state, p.pin_code].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400">status {p.status}</span>
              </div>
            ))
          )}
        </div>

        {showForm && (
          <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["pickup_location", "Nickname *"],
                ["name", "Contact name"],
                ["phone", "Phone *"],
                ["email", "Email"],
                ["address", "Address"],
                ["address_2", "Address 2"],
                ["city", "City"],
                ["state", "State"],
                ["pin_code", "Pincode *"],
                ["country", "Country"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addPickup}
              disabled={adding}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {adding ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : <PlusIcon className="h-3.5 w-3.5" />}
              Add pickup location
            </button>
          </div>
        )}
      </div>

      {/* Serviceability checker */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Serviceability checker</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={svcPin}
            onChange={(e) => setSvcPin(e.target.value)}
            placeholder="Delivery pincode"
            className="w-40 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <Toggle
            checked={svcCod}
            onCheckedChange={setSvcCod}
            label="COD"
            size="sm"
          />
          <button
            onClick={checkSvc}
            disabled={svcLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {svcLoading ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : null} Check
          </button>
        </div>
        {svcResult && (
          <div className="rounded-lg border border-zinc-200 p-3">
            {svcResult.available ? (
              <>
                <p className="text-sm text-green-700 mb-2">
                  Serviceable · est. {svcResult.estimatedDays} days
                </p>
                <div className="space-y-1">
                  {(svcResult.couriers || []).slice(0, 8).map((c, i) => (
                    <div key={i} className="flex justify-between text-xs text-zinc-600">
                      <span>{c.name}</span>
                      <span>₹{c.rate} · {c.estimatedDays}d</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-red-600">Not serviceable to this pincode.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
