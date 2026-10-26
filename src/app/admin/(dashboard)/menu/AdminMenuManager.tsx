"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createCategoryAction,
  deleteCategoryAction,
  createMenuItemAction,
  toggleMenuItemAction,
  deleteMenuItemAction,
  createPromoAction,
  togglePromoAction,
  deletePromoAction,
  type ActionState,
} from "@/app/actions/admin";
import { dict, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";

type TenantOption = {
  id: string;
  name: string;
  slug: string;
  currency: string;
};

type CategoryWithItems = {
  id: string;
  name: string;
  nameEn: string | null;
  items: {
    id: string;
    name: string;
    nameEn: string | null;
    description: string | null;
    price: number;
    isAvailable: boolean;
  }[];
};

type Promo = {
  id: string;
  title: string;
  titleEn: string | null;
  body: string | null;
  isActive: boolean;
};

type Props = {
  tenants: TenantOption[];
  initialTenantId: string;
  categories: CategoryWithItems[];
  promos: Promo[];
  lang: Lang;
};

export default function AdminMenuManager({
  tenants,
  initialTenantId,
  categories,
  promos,
  lang,
}: Props) {
  const t = dict[lang];
  const router = useRouter();

  const [tenantId, setTenantId] = useState(initialTenantId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catNameEn, setCatNameEn] = useState("");

  // Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemCatId, setItemCatId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  // Promo Modal State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoTitleEn, setPromoTitleEn] = useState("");
  const [promoBody, setPromoBody] = useState("");

  const currentTenant = tenants.find((tn) => tn.id === tenantId) ?? tenants[0];

  function handleTenantChange(newId: string) {
    setTenantId(newId);
    router.push(`/admin/menu?tenantId=${newId}`);
  }

  // ---------------------------------------------------- Category Handlers
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("tenantId", tenantId);
    fd.append("name", catName);
    if (catNameEn) fd.append("nameEn", catNameEn);

    startTransition(async () => {
      const res = await createCategoryAction({}, fd);
      if (res.ok) {
        setShowCategoryModal(false);
        setCatName("");
        setCatNameEn("");
        router.refresh();
      } else {
        setError(res.error ?? "Failed to create category");
      }
    });
  }

  async function handleDeleteCategory(catId: string) {
    if (!confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا القسم؟" : "Delete this category?")) return;
    startTransition(async () => {
      await deleteCategoryAction(catId);
      router.refresh();
    });
  }

  // ---------------------------------------------------- Item Handlers
  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("tenantId", tenantId);
    if (itemCatId) fd.append("categoryId", itemCatId);
    fd.append("name", itemName);
    if (itemNameEn) fd.append("nameEn", itemNameEn);
    if (itemDesc) fd.append("description", itemDesc);
    fd.append("price", itemPrice);

    startTransition(async () => {
      const res = await createMenuItemAction({}, fd);
      if (res.ok) {
        setShowItemModal(false);
        setItemName("");
        setItemNameEn("");
        setItemDesc("");
        setItemPrice("");
        router.refresh();
      } else {
        setError(res.error ?? "Failed to create item");
      }
    });
  }

  async function handleToggleItem(itemId: string) {
    startTransition(async () => {
      await toggleMenuItemAction(itemId);
      router.refresh();
    });
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا الصنف؟" : "Delete this item?")) return;
    startTransition(async () => {
      await deleteMenuItemAction(itemId);
      router.refresh();
    });
  }

  // ---------------------------------------------------- Promo Handlers
  async function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("tenantId", tenantId);
    fd.append("title", promoTitle);
    if (promoTitleEn) fd.append("titleEn", promoTitleEn);
    if (promoBody) fd.append("body", promoBody);

    startTransition(async () => {
      const res = await createPromoAction({}, fd);
      if (res.ok) {
        setShowPromoModal(false);
        setPromoTitle("");
        setPromoTitleEn("");
        setPromoBody("");
        router.refresh();
      } else {
        setError(res.error ?? "Failed to create promo");
      }
    });
  }

  async function handleTogglePromo(promoId: string, currentActive: boolean) {
    startTransition(async () => {
      await togglePromoAction(promoId, !currentActive);
      router.refresh();
    });
  }

  async function handleDeletePromo(promoId: string) {
    if (!confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا العرض؟" : "Delete this promo?")) return;
    startTransition(async () => {
      await deletePromoAction(promoId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Tenant Selector */}
      <div className="sb-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-[var(--muted)] uppercase">
            {t["admin.restaurants"]}:
          </label>
          <select
            value={tenantId}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="sb-input !w-auto !py-1.5 text-sm font-bold bg-slate-800"
          >
            {tenants.map((tn) => (
              <option key={tn.id} value={tn.id}>
                {tn.name} (/{tn.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="sb-btn sb-btn-ghost !py-1.5 text-xs font-bold"
          >
            + {t["admin.addCategory"]}
          </button>
          <button
            type="button"
            onClick={() => {
              setItemCatId(categories[0]?.id ?? "");
              setShowItemModal(true);
            }}
            className="sb-btn sb-btn-primary !py-1.5 text-xs font-bold"
          >
            + {t["admin.addItem"]}
          </button>
          <button
            type="button"
            onClick={() => setShowPromoModal(true)}
            className="sb-btn sb-btn-warm !py-1.5 text-xs font-bold"
          >
            + {t["admin.addPromo"]}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-xs font-bold text-rose-300">
          {error}
        </div>
      ) : null}

      {/* ------------------------------------------------ Promos Section */}
      {promos.length > 0 ? (
        <section className="sb-card p-5 space-y-3">
          <h2 className="text-base font-black flex items-center gap-2 text-[var(--brand-secondary)]">
            <span>🔥</span>
            <span>{t["admin.promos"]} ({promos.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 flex justify-between items-start gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-white text-sm">{promo.title}</p>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        promo.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {promo.isActive ? t["common.active"] : t["common.frozen"]}
                    </span>
                  </div>
                  {promo.body ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">{promo.body}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    type="button"
                    onClick={() => handleTogglePromo(promo.id, promo.isActive)}
                    className="p-1 text-xs rounded hover:bg-slate-700 text-[var(--muted)]"
                    title="Toggle active"
                  >
                    {promo.isActive ? "⏸️" : "▶️"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePromo(promo.id)}
                    className="p-1 text-xs rounded hover:bg-rose-500/20 text-rose-400"
                    title={t["common.delete"]}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Categories & Items */}
      {categories.length === 0 ? (
        <div className="sb-card p-12 text-center text-[var(--muted)]">
          <p className="font-bold text-sm">{t["admin.noData"]}</p>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="sb-btn sb-btn-primary mt-4 !py-2 text-xs"
          >
            + {t["admin.addCategory"]}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <section key={cat.id} className="sb-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{cat.name}</h3>
                  {cat.nameEn ? (
                    <span className="text-xs text-[var(--muted)] font-medium">({cat.nameEn})</span>
                  ) : null}
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                    {cat.items.length} {lang === "ar" ? "أصناف" : "items"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemCatId(cat.id);
                      setShowItemModal(true);
                    }}
                    className="sb-btn sb-btn-ghost !p-1.5 text-xs text-[var(--brand-primary)]"
                    title={t["admin.addItem"]}
                  >
                    + {t["admin.addItem"]}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="sb-btn sb-btn-ghost !p-1.5 text-xs text-rose-400 hover:text-rose-300"
                    title={t["common.delete"]}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {cat.items.length === 0 ? (
                <p className="text-xs text-[var(--muted)] text-center py-4">
                  {lang === "ar" ? "لا توجد أصناف في هذا القسم بعد." : "No items in this category yet."}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 flex flex-col justify-between ${
                        !item.isAvailable ? "opacity-60" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-white">{item.name}</h4>
                          <span className="font-black text-xs text-[var(--brand-secondary)] whitespace-nowrap">
                            {formatMoney(item.price, lang, currentTenant?.currency ?? "IQD")}
                          </span>
                        </div>
                        {item.nameEn ? (
                          <p className="text-[10px] text-[var(--muted)]">{item.nameEn}</p>
                        ) : null}
                        {item.description ? (
                          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                            {item.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id)}
                          className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                            item.isAvailable
                              ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              : "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                          }`}
                        >
                          {item.isAvailable ? t["admin.available"] : t["admin.unavailable"]}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-xs text-[var(--muted)] hover:text-rose-400 transition"
                          title={t["common.delete"]}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* ------------------------------------------------ Add Category Modal */}
      {showCategoryModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="sb-card relative w-full max-w-sm p-5 space-y-4">
            <h3 className="text-base font-black">{t["admin.addCategory"]}</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="sb-label">اسم القسم (العربية) *</label>
                <input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="مثال: المقبلات، المشاوي"
                  className="sb-input"
                />
              </div>
              <div>
                <label className="sb-label">English Name</label>
                <input
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="e.g. Appetizers, Grills"
                  className="sb-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="sb-btn sb-btn-ghost !py-1.5 text-xs"
                >
                  {t["common.cancel"]}
                </button>
                <button type="submit" disabled={pending} className="sb-btn sb-btn-primary !py-1.5 text-xs">
                  {pending ? t["common.loading"] : t["common.save"]}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ Add Item Modal */}
      {showItemModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="sb-card relative w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-black">{t["admin.addItem"]}</h3>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="sb-label">{t["admin.categories"]}</label>
                <select
                  value={itemCatId}
                  onChange={(e) => setItemCatId(e.target.value)}
                  className="sb-input"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="sb-label">{t["admin.itemName"]} *</label>
                  <input
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="برجر لحم خاص"
                    className="sb-input"
                  />
                </div>
                <div>
                  <label className="sb-label">{t["admin.itemNameEn"]}</label>
                  <input
                    value={itemNameEn}
                    onChange={(e) => setItemNameEn(e.target.value)}
                    placeholder="Special Beef Burger"
                    className="sb-input"
                  />
                </div>
              </div>

              <div>
                <label className="sb-label">{t["admin.price"]} ({currentTenant?.currency ?? "IQD"}) *</label>
                <input
                  required
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="15000"
                  className="sb-input font-bold"
                />
              </div>

              <div>
                <label className="sb-label">{t["admin.itemDescription"]}</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="مكونات الصنف والملاحظات..."
                  rows={2}
                  className="sb-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="sb-btn sb-btn-ghost !py-1.5 text-xs"
                >
                  {t["common.cancel"]}
                </button>
                <button type="submit" disabled={pending} className="sb-btn sb-btn-primary !py-1.5 text-xs">
                  {pending ? t["common.loading"] : t["common.save"]}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ Add Promo Modal */}
      {showPromoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="sb-card relative w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-black">{t["admin.addPromo"]}</h3>
            <form onSubmit={handleCreatePromo} className="space-y-3">
              <div>
                <label className="sb-label">{t["admin.promoTitle"]} *</label>
                <input
                  required
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  placeholder="خصم ٢٠٪ على المشروبات"
                  className="sb-input"
                />
              </div>
              <div>
                <label className="sb-label">Title (English)</label>
                <input
                  value={promoTitleEn}
                  onChange={(e) => setPromoTitleEn(e.target.value)}
                  placeholder="20% off all drinks"
                  className="sb-input"
                />
              </div>
              <div>
                <label className="sb-label">{t["admin.promoBody"]}</label>
                <textarea
                  value={promoBody}
                  onChange={(e) => setPromoBody(e.target.value)}
                  placeholder="ساري لغاية نهاية الشهر..."
                  rows={2}
                  className="sb-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="sb-btn sb-btn-ghost !py-1.5 text-xs"
                >
                  {t["common.cancel"]}
                </button>
                <button type="submit" disabled={pending} className="sb-btn sb-btn-warm !py-1.5 text-xs">
                  {pending ? t["common.loading"] : t["common.save"]}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
