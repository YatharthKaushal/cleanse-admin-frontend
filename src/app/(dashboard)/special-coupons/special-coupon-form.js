"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { adminSpecialCouponApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import {
  FormField,
  TextInput,
  NumberInput,
  SelectInput,
  Toggle,
  SectionCard,
  RadioCards,
  ProductPicker,
  CategoryPicker,
  VolumeTiersEditor,
  FixedPriceBundleEditor,
} from "./form-components";

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

const PROMOTION_TYPES = [
  { value: "bxgy", label: "Buy X Get Y", description: "Buy products, get others free or discounted" },
  { value: "volume_discount", label: "Volume Discount", description: "Buy more, save more with tiered pricing" },
  { value: "spend_threshold", label: "Spend Threshold", description: "Spend a minimum to unlock rewards" },
  { value: "fixed_price_bundle", label: "Fixed Price Bundle", description: "Set of products at a combo price" },
  { value: "free_gift", label: "Free Gift", description: "Auto-add a free product to qualifying orders" },
  { value: "tiered_shipping", label: "Tiered Shipping", description: "Custom shipping rates by order value" },
];

const BUY_CONDITION_TYPES = [
  { value: "product", label: "Specific Products" },
  { value: "category", label: "From Category" },
  { value: "any", label: "Any Products" },
];

const REWARD_TYPES = [
  { value: "free", label: "Free (100% off)" },
  { value: "percentage_off", label: "Percentage Off" },
  { value: "fixed_off", label: "Fixed Amount Off" },
];

const REWARD_SCOPES = [
  { value: "same_as_buy", label: "Same as buy products" },
  { value: "specific_products", label: "Specific products" },
  { value: "cheapest_in_cart", label: "Cheapest in cart" },
  { value: "most_expensive_in_cart", label: "Most expensive in cart" },
];

const SPEND_REWARD_TYPES = [
  { value: "percentage_off", label: "Percentage Off" },
  { value: "fixed_off", label: "Fixed Amount Off" },
  { value: "free", label: "Free Product" },
  { value: "free_shipping", label: "Free Shipping" },
];

export default function SpecialCouponFormPage({ promotion }) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = !!promotion;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: promotion?.title || "",
    description: promotion?.description || "",
    promotionType: promotion?.promotionType || "bxgy",
    applicationMethod: promotion?.applicationMethod || "automatic",
    code: promotion?.code || "",

    // Buy condition
    buyConditionType: promotion?.buyCondition?.type || "any",
    buyConditionProductIds: promotion?.buyCondition?.productIds?.map((p) => p._id || p) || [],
    buyConditionCategoryIds: promotion?.buyCondition?.categoryIds?.map((c) => c._id || c) || [],
    buyConditionMinQuantity: promotion?.buyCondition?.minQuantity ?? "",
    buyConditionMinAmount: promotion?.buyCondition?.minAmount ?? "",

    // Get reward
    getRewardType: promotion?.getReward?.type || "free",
    getRewardScope: promotion?.getReward?.rewardScope || "same_as_buy",
    getRewardProductIds: promotion?.getReward?.productIds?.map((p) => p._id || p) || [],
    getRewardQuantity: promotion?.getReward?.quantity ?? 1,
    getRewardDiscountValue: promotion?.getReward?.discountValue ?? "",
    getRewardMaxDiscount: promotion?.getReward?.maxDiscountAmount ?? "",

    // Volume tiers
    volumeTiers: promotion?.volumeTiers || [
      { minQuantity: 2, discountType: "percentage", discountValue: 10 },
      { minQuantity: 3, discountType: "percentage", discountValue: 15 },
    ],

    // Fixed price bundle
    fixedPriceBundleProductIds: promotion?.fixedPriceBundle?.productIds?.map((p) => p._id || p) || [],
    fixedPriceBundleQuantities: promotion?.fixedPriceBundle?.quantities || [],
    fixedPriceBundlePrice: promotion?.fixedPriceBundle?.fixedPrice ?? "",

    // Free gift
    freeGiftProductId: promotion?.freeGift?.productId?._id || promotion?.freeGift?.productId || "",
    freeGiftVariantSize: promotion?.freeGift?.variantSize || "",
    freeGiftMaxQuantity: promotion?.freeGift?.maxQuantity ?? 1,

    // Shipping tier
    shippingTierDiscountType: promotion?.shippingTier?.discountType || "percentage",
    shippingTierDiscountValue: promotion?.shippingTier?.discountValue ?? "",

    // Scheduling
    validFrom: formatDateForInput(promotion?.validFrom),
    validTill: formatDateForInput(promotion?.validTill),

    // Usage
    usageLimit: promotion?.usageLimit ?? "",
    perUserLimit: promotion?.perUserLimit ?? 1,

    // Eligibility
    isFirstOrderOnly: promotion?.isFirstOrderOnly ?? false,
    minOrderValue: promotion?.minOrderValue ?? "",
    maxOrderValue: promotion?.maxOrderValue ?? "",

    // Stacking
    stackable: promotion?.stackable ?? false,
    stackGroup: promotion?.stackGroup || "",
    excludeWithCoupons: promotion?.excludeWithCoupons !== false,
    priority: promotion?.priority ?? 0,
    maxDiscountPerOrder: promotion?.maxDiscountPerOrder ?? "",

    // Status
    isActive: promotion?.isActive !== false,

    // Notes
    notes: promotion?.notes || "",
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const buildPayload = () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      promotionType: form.promotionType,
      applicationMethod: form.applicationMethod,
      code: form.applicationMethod === "code" ? form.code.trim().toUpperCase() : null,
      validFrom: form.validFrom || undefined,
      validTill: form.validTill,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perUserLimit: Number(form.perUserLimit) || 1,
      isFirstOrderOnly: form.isFirstOrderOnly,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      maxOrderValue: form.maxOrderValue ? Number(form.maxOrderValue) : undefined,
      stackable: form.stackable,
      stackGroup: form.stackGroup.trim() || undefined,
      excludeWithCoupons: form.excludeWithCoupons,
      priority: Number(form.priority) || 0,
      maxDiscountPerOrder: form.maxDiscountPerOrder ? Number(form.maxDiscountPerOrder) : undefined,
      isActive: form.isActive,
      notes: form.notes.trim() || undefined,
    };

    // Build buy condition
    const buyCondition = { type: form.buyConditionType };
    if (form.buyConditionType === "product") {
      buyCondition.productIds = form.buyConditionProductIds;
    }
    if (form.buyConditionType === "category") {
      buyCondition.categoryIds = form.buyConditionCategoryIds;
    }
    if (form.buyConditionMinQuantity) {
      buyCondition.minQuantity = Number(form.buyConditionMinQuantity);
    }
    if (form.buyConditionMinAmount) {
      buyCondition.minAmount = Number(form.buyConditionMinAmount);
    }
    payload.buyCondition = buyCondition;

    // Type-specific fields
    switch (form.promotionType) {
      case "bxgy": {
        payload.getReward = {
          type: form.getRewardType,
          rewardScope: form.getRewardScope,
          quantity: Number(form.getRewardQuantity) || 1,
        };
        if (form.getRewardScope === "specific_products") {
          payload.getReward.productIds = form.getRewardProductIds;
        }
        if (form.getRewardType !== "free") {
          payload.getReward.discountValue = Number(form.getRewardDiscountValue) || 0;
        }
        if (form.getRewardType === "percentage_off" && form.getRewardMaxDiscount) {
          payload.getReward.maxDiscountAmount = Number(form.getRewardMaxDiscount);
        }
        break;
      }
      case "volume_discount": {
        payload.volumeTiers = form.volumeTiers.map((t) => ({
          minQuantity: Number(t.minQuantity),
          discountType: t.discountType,
          discountValue: Number(t.discountValue),
        }));
        break;
      }
      case "spend_threshold": {
        payload.getReward = {
          type: form.getRewardType,
        };
        if (form.getRewardType === "percentage_off" || form.getRewardType === "fixed_off") {
          payload.getReward.discountValue = Number(form.getRewardDiscountValue) || 0;
        }
        if (form.getRewardType === "free") {
          payload.getReward.productIds = form.getRewardProductIds;
          payload.getReward.quantity = Number(form.getRewardQuantity) || 1;
        }
        if (form.getRewardType === "percentage_off" && form.getRewardMaxDiscount) {
          payload.getReward.maxDiscountAmount = Number(form.getRewardMaxDiscount);
        }
        break;
      }
      case "fixed_price_bundle": {
        payload.fixedPriceBundle = {
          productIds: form.fixedPriceBundleProductIds,
          quantities: form.fixedPriceBundleQuantities,
          fixedPrice: Number(form.fixedPriceBundlePrice) || 0,
        };
        break;
      }
      case "free_gift": {
        payload.freeGift = {
          productId: form.freeGiftProductId || undefined,
          variantSize: form.freeGiftVariantSize || undefined,
          maxQuantity: Number(form.freeGiftMaxQuantity) || 1,
        };
        break;
      }
      case "tiered_shipping": {
        payload.shippingTier = {
          discountType: form.shippingTierDiscountType,
          discountValue: Number(form.shippingTierDiscountValue) || 0,
        };
        break;
      }
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.validTill) { setError("Valid Till date is required"); return; }
    if (form.validFrom && form.validTill && new Date(form.validFrom) >= new Date(form.validTill)) {
      setError("Valid Till must be after Valid From"); return;
    }
    if (form.applicationMethod === "code" && !form.code.trim()) {
      setError("Coupon code is required for code-based promotions");
      return;
    }

    // Type-specific validations
    switch (form.promotionType) {
      case "bxgy":
        if (!form.buyConditionMinQuantity || Number(form.buyConditionMinQuantity) < 1) {
          setError("Minimum buy quantity is required for Buy X Get Y"); return;
        }
        break;
      case "volume_discount":
        if (!form.volumeTiers || form.volumeTiers.length < 2) {
          setError("At least 2 volume tiers are required"); return;
        }
        break;
      case "spend_threshold":
        if (!form.buyConditionMinAmount || Number(form.buyConditionMinAmount) <= 0) {
          setError("Minimum spend amount is required for Spend Threshold"); return;
        }
        break;
      case "fixed_price_bundle":
        if (!form.fixedPriceBundleProductIds || form.fixedPriceBundleProductIds.length < 2) {
          setError("At least 2 products are required for a Fixed Price Bundle"); return;
        }
        if (!form.fixedPriceBundlePrice || Number(form.fixedPriceBundlePrice) <= 0) {
          setError("Bundle price is required"); return;
        }
        break;
      case "free_gift":
        if (!form.freeGiftProductId) {
          setError("Gift product is required for Free Gift promotion"); return;
        }
        break;
      case "tiered_shipping":
        if (!form.shippingTierDiscountValue && form.shippingTierDiscountValue !== 0) {
          setError("Shipping discount value is required"); return;
        }
        break;
    }

    setSaving(true);
    setError("");

    try {
      const payload = buildPayload();
      if (isEdit) {
        await adminSpecialCouponApi.update(promotion._id, payload);
        showToast("Promotion updated", "success");
      } else {
        await adminSpecialCouponApi.create(payload);
        showToast("Promotion created", "success");
      }
      router.push("/special-coupons");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save promotion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Back link + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/special-coupons"
          className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            {isEdit ? "Edit Special Coupon" : "New Special Coupon"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Configure an advanced promotion with custom rules
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {/* Section 1: Basics */}
        <SectionCard title="Basics" description="Promotion identity and type">
          <FormField label="Title" required>
            <TextInput
              value={form.title}
              onChange={(v) => set("title", v)}
              placeholder="e.g. Summer BOGO Sale"
            />
          </FormField>

          <FormField label="Description" required>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Customer-facing description"
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors resize-none"
            />
          </FormField>

          <FormField label="Promotion Type" required>
            <RadioCards
              value={form.promotionType}
              onChange={(v) => set("promotionType", v)}
              options={PROMOTION_TYPES}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Application Method" required>
              <SelectInput
                value={form.applicationMethod}
                onChange={(v) => set("applicationMethod", v)}
                options={[
                  { value: "automatic", label: "Automatic (no code needed)" },
                  { value: "code", label: "Requires coupon code" },
                ]}
              />
            </FormField>
            {form.applicationMethod === "code" && (
              <FormField label="Coupon Code" required>
                <TextInput
                  value={form.code}
                  onChange={(v) => set("code", v.toUpperCase())}
                  placeholder="e.g. BOGO50"
                  className="uppercase"
                />
              </FormField>
            )}
          </div>
        </SectionCard>

        {/* Section 2: Conditions (dynamic based on type) */}
        {form.promotionType === "bxgy" && (
          <SectionCard title="Buy X Get Y" description="Define what customers buy and what they get">
            {/* Buy condition */}
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Customer Must Buy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Condition Type">
                <SelectInput
                  value={form.buyConditionType}
                  onChange={(v) => set("buyConditionType", v)}
                  options={BUY_CONDITION_TYPES}
                />
              </FormField>
              <FormField label="Minimum Quantity" required>
                <NumberInput
                  value={form.buyConditionMinQuantity}
                  onChange={(v) => set("buyConditionMinQuantity", v)}
                  min={1}
                  placeholder="e.g. 2"
                />
              </FormField>
            </div>
            {form.buyConditionType === "product" && (
              <ProductPicker
                selectedIds={form.buyConditionProductIds}
                onChange={(ids) => set("buyConditionProductIds", ids)}
                label="Buy Products"
              />
            )}
            {form.buyConditionType === "category" && (
              <CategoryPicker
                selectedIds={form.buyConditionCategoryIds}
                onChange={(ids) => set("buyConditionCategoryIds", ids)}
                label="Buy from Categories"
              />
            )}

            <hr className="border-zinc-100" />

            {/* Get reward */}
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Customer Gets</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Reward Type">
                <SelectInput
                  value={form.getRewardType}
                  onChange={(v) => set("getRewardType", v)}
                  options={REWARD_TYPES}
                />
              </FormField>
              <FormField label="Reward Quantity">
                <NumberInput
                  value={form.getRewardQuantity}
                  onChange={(v) => set("getRewardQuantity", v)}
                  min={1}
                  placeholder="e.g. 1"
                />
              </FormField>
            </div>
            <FormField label="Which Products Get Discounted">
              <SelectInput
                value={form.getRewardScope}
                onChange={(v) => set("getRewardScope", v)}
                options={REWARD_SCOPES}
              />
            </FormField>
            {form.getRewardScope === "specific_products" && (
              <ProductPicker
                selectedIds={form.getRewardProductIds}
                onChange={(ids) => set("getRewardProductIds", ids)}
                label="Reward Products"
              />
            )}
            {form.getRewardType !== "free" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Discount Value" required>
                  <NumberInput
                    value={form.getRewardDiscountValue}
                    onChange={(v) => set("getRewardDiscountValue", v)}
                    min={0}
                    prefix={form.getRewardType === "percentage_off" ? "%" : "\u20B9"}
                    placeholder="e.g. 50"
                  />
                </FormField>
                {form.getRewardType === "percentage_off" && (
                  <FormField label="Max Discount" hint="optional">
                    <NumberInput
                      value={form.getRewardMaxDiscount}
                      onChange={(v) => set("getRewardMaxDiscount", v)}
                      min={0}
                      prefix={"\u20B9"}
                      placeholder="e.g. 500"
                    />
                  </FormField>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {form.promotionType === "volume_discount" && (
          <SectionCard title="Volume Discount Tiers" description="Buy more, save more">
            <FormField label="Applies To">
              <SelectInput
                value={form.buyConditionType}
                onChange={(v) => set("buyConditionType", v)}
                options={BUY_CONDITION_TYPES}
              />
            </FormField>
            {form.buyConditionType === "product" && (
              <ProductPicker
                selectedIds={form.buyConditionProductIds}
                onChange={(ids) => set("buyConditionProductIds", ids)}
              />
            )}
            {form.buyConditionType === "category" && (
              <CategoryPicker
                selectedIds={form.buyConditionCategoryIds}
                onChange={(ids) => set("buyConditionCategoryIds", ids)}
              />
            )}
            <FormField label="Discount Tiers" required>
              <VolumeTiersEditor
                tiers={form.volumeTiers}
                onChange={(tiers) => set("volumeTiers", tiers)}
              />
            </FormField>
          </SectionCard>
        )}

        {form.promotionType === "spend_threshold" && (
          <SectionCard title="Spend Threshold" description="Reward customers who spend above a minimum">
            <FormField label="Minimum Spend Amount" required>
              <NumberInput
                value={form.buyConditionMinAmount}
                onChange={(v) => set("buyConditionMinAmount", v)}
                min={0}
                prefix={"\u20B9"}
                placeholder="e.g. 2000"
              />
            </FormField>
            <FormField label="Reward Type">
              <SelectInput
                value={form.getRewardType}
                onChange={(v) => set("getRewardType", v)}
                options={SPEND_REWARD_TYPES}
              />
            </FormField>
            {(form.getRewardType === "percentage_off" || form.getRewardType === "fixed_off") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Discount Value" required>
                  <NumberInput
                    value={form.getRewardDiscountValue}
                    onChange={(v) => set("getRewardDiscountValue", v)}
                    min={0}
                    prefix={form.getRewardType === "percentage_off" ? "%" : "\u20B9"}
                  />
                </FormField>
                {form.getRewardType === "percentage_off" && (
                  <FormField label="Max Discount" hint="optional">
                    <NumberInput
                      value={form.getRewardMaxDiscount}
                      onChange={(v) => set("getRewardMaxDiscount", v)}
                      min={0}
                      prefix={"\u20B9"}
                    />
                  </FormField>
                )}
              </div>
            )}
            {form.getRewardType === "free" && (
              <ProductPicker
                selectedIds={form.getRewardProductIds}
                onChange={(ids) => set("getRewardProductIds", ids)}
                label="Free Product"
              />
            )}
          </SectionCard>
        )}

        {form.promotionType === "fixed_price_bundle" && (
          <SectionCard title="Fixed Price Bundle" description="Set of products at a combo price">
            <FixedPriceBundleEditor
              productIds={form.fixedPriceBundleProductIds}
              quantities={form.fixedPriceBundleQuantities}
              fixedPrice={form.fixedPriceBundlePrice}
              onChange={({ productIds, quantities, fixedPrice }) => {
                set("fixedPriceBundleProductIds", productIds);
                set("fixedPriceBundleQuantities", quantities);
                set("fixedPriceBundlePrice", fixedPrice);
              }}
            />
          </SectionCard>
        )}

        {form.promotionType === "free_gift" && (
          <SectionCard title="Free Gift" description="Add a free product when conditions are met">
            <FormField label="Trigger Condition">
              <SelectInput
                value={form.buyConditionType}
                onChange={(v) => set("buyConditionType", v)}
                options={[
                  { value: "any", label: "Minimum Order Value" },
                  { value: "product", label: "Specific Product in Cart" },
                  { value: "category", label: "Category in Cart" },
                ]}
              />
            </FormField>
            {form.buyConditionType === "any" && (
              <FormField label="Minimum Order Value">
                <NumberInput
                  value={form.buyConditionMinAmount}
                  onChange={(v) => set("buyConditionMinAmount", v)}
                  min={0}
                  prefix={"\u20B9"}
                />
              </FormField>
            )}
            {form.buyConditionType === "product" && (
              <ProductPicker
                selectedIds={form.buyConditionProductIds}
                onChange={(ids) => set("buyConditionProductIds", ids)}
                label="Required Product in Cart"
              />
            )}
            {form.buyConditionType === "category" && (
              <CategoryPicker
                selectedIds={form.buyConditionCategoryIds}
                onChange={(ids) => set("buyConditionCategoryIds", ids)}
                label="Required Category in Cart"
              />
            )}

            <hr className="border-zinc-100" />

            <ProductPicker
              selectedIds={form.freeGiftProductId ? [form.freeGiftProductId] : []}
              onChange={(ids) => set("freeGiftProductId", ids[0] || "")}
              label="Gift Product"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Variant/Size" hint="optional">
                <TextInput
                  value={form.freeGiftVariantSize}
                  onChange={(v) => set("freeGiftVariantSize", v)}
                  placeholder="e.g. 100ml"
                />
              </FormField>
              <FormField label="Max Gifts Per Order">
                <NumberInput
                  value={form.freeGiftMaxQuantity}
                  onChange={(v) => set("freeGiftMaxQuantity", v)}
                  min={1}
                />
              </FormField>
            </div>
          </SectionCard>
        )}

        {form.promotionType === "tiered_shipping" && (
          <SectionCard title="Tiered Shipping" description="Custom shipping discount based on order value">
            <FormField label="Minimum Order Value">
              <NumberInput
                value={form.buyConditionMinAmount}
                onChange={(v) => set("buyConditionMinAmount", v)}
                min={0}
                prefix={"\u20B9"}
                placeholder="e.g. 800"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Shipping Discount Type">
                <SelectInput
                  value={form.shippingTierDiscountType}
                  onChange={(v) => set("shippingTierDiscountType", v)}
                  options={[
                    { value: "percentage", label: "Percentage Off Shipping" },
                    { value: "fixed_rate", label: "Flat Shipping Rate" },
                  ]}
                />
              </FormField>
              <FormField label="Value" required>
                <NumberInput
                  value={form.shippingTierDiscountValue}
                  onChange={(v) => set("shippingTierDiscountValue", v)}
                  min={0}
                  prefix={form.shippingTierDiscountType === "percentage" ? "%" : "\u20B9"}
                />
              </FormField>
            </div>
          </SectionCard>
        )}

        {/* Section 3: Scheduling */}
        <SectionCard title="Scheduling" description="When this promotion is valid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Valid From">
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </FormField>
            <FormField label="Valid Till" required>
              <input
                type="date"
                value={form.validTill}
                onChange={(e) => set("validTill", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Section 4: Usage Limits */}
        <SectionCard title="Usage Limits">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Total Usage Limit" hint="0 = unlimited">
              <NumberInput
                value={form.usageLimit}
                onChange={(v) => set("usageLimit", v)}
                min={0}
                placeholder="0"
              />
            </FormField>
            <FormField label="Per Customer Limit">
              <NumberInput
                value={form.perUserLimit}
                onChange={(v) => set("perUserLimit", v)}
                min={0}
                placeholder="1"
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Section 5: Eligibility */}
        <SectionCard title="Eligibility" description="Who can use this promotion">
          <Toggle
            checked={form.isFirstOrderOnly}
            onChange={(v) => set("isFirstOrderOnly", v)}
            label="First order only"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Min Order Value" hint="optional">
              <NumberInput
                value={form.minOrderValue}
                onChange={(v) => set("minOrderValue", v)}
                min={0}
                prefix={"\u20B9"}
                placeholder="0"
              />
            </FormField>
            <FormField label="Max Order Value" hint="optional">
              <NumberInput
                value={form.maxOrderValue}
                onChange={(v) => set("maxOrderValue", v)}
                min={0}
                prefix={"\u20B9"}
                placeholder="No limit"
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Section 6: Stacking Rules */}
        <SectionCard title="Stacking Rules" description="How this promotion interacts with other discounts">
          <Toggle
            checked={form.stackable}
            onChange={(v) => set("stackable", v)}
            label="Can stack with other special promotions"
          />
          <Toggle
            checked={form.excludeWithCoupons}
            onChange={(v) => set("excludeWithCoupons", v)}
            label="Block regular coupon codes when this is active"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Stack Group" hint="promotions in same group conflict">
              <TextInput
                value={form.stackGroup}
                onChange={(v) => set("stackGroup", v)}
                placeholder="e.g. summer-sale"
              />
            </FormField>
            <FormField label="Priority" hint="higher = applied first">
              <NumberInput
                value={form.priority}
                onChange={(v) => set("priority", v)}
                min={0}
                placeholder="0"
              />
            </FormField>
          </div>
          <FormField label="Max Discount Per Order" hint="optional, absolute cap">
            <NumberInput
              value={form.maxDiscountPerOrder}
              onChange={(v) => set("maxDiscountPerOrder", v)}
              min={0}
              prefix={"\u20B9"}
              placeholder="No limit"
            />
          </FormField>
        </SectionCard>

        {/* Section 7: Notes */}
        <SectionCard title="Admin Notes" description="Internal notes, not shown to customers">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Internal notes about this promotion..."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors resize-none"
          />
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
          <Toggle
            checked={form.isActive}
            onChange={(v) => set("isActive", v)}
            label={form.isActive ? "Active" : "Draft (inactive)"}
          />
          <div className="flex items-center gap-3">
            <Link
              href="/special-coupons"
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Update Promotion" : "Create Promotion"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
