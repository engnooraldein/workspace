"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createRestaurantAction, type ActionState } from "@/app/actions/admin";
import { dict, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
};

export default function CreateRestaurantModal({ lang }: Props) {
  const t = dict[lang];
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({});

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22d3ee");
  const [secondaryColor, setSecondaryColor] = useState("#fbbf24");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState("pro");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createRestaurantAction(state, formData);
      setState(result);
      if (result.ok) {
        setOpen(false);
        // Reset form
        setName("");
        setNameEn("");
        setSlug("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sb-btn sb-btn-primary !py-2 text-xs"
      >
        + {t["admin.newRestaurant"]}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="sb-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-lg font-black">{t["admin.newRestaurant"]}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[var(--muted)] hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="sb-label">{t["admin.restaurants"]} (العربية) *</label>
                  <input
                    name="name"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-"));
                      }
                    }}
                    placeholder="مطعم بغداد"
                    className="sb-input"
                  />
                </div>

                <div>
                  <label className="sb-label">English Name</label>
                  <input
                    name="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Baghdad Restaurant"
                    className="sb-input"
                  />
                </div>
              </div>

              <div>
                <label className="sb-label">{t["admin.slug"]} *</label>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-[var(--muted)]">https://.../</span>
                  <input
                    name="slug"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="baghdad"
                    className="sb-input flex-1"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[var(--muted)]">{t["admin.slugHint"]}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="sb-label">{t["admin.brandColor"]} 1</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 rounded cursor-pointer border border-[var(--line)] bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="sb-input !py-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="sb-label">{t["admin.brandColor"]} 2</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-9 w-12 rounded cursor-pointer border border-[var(--line)] bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="sb-input !py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="sb-label">الهاتف / Phone</label>
                  <input
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07700000000"
                    className="sb-input"
                  />
                </div>

                <div>
                  <label className="sb-label">واتساب / WhatsApp</label>
                  <input
                    name="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="9647700000000"
                    className="sb-input"
                  />
                </div>
              </div>

              <div>
                <label className="sb-label">العنوان / Address</label>
                <input
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="بغداد، المنصور"
                  className="sb-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="sb-label">{t["admin.plan"]}</label>
                  <select
                    name="plan"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="sb-input"
                  >
                    <option value="trial">Trial (تجريبي)</option>
                    <option value="pro">Pro (احترافي)</option>
                    <option value="enterprise">Enterprise (شركات)</option>
                  </select>
                </div>

                <div>
                  <label className="sb-label">{t["admin.subscription"]}</label>
                  <select name="subscriptionStatus" defaultValue="active" className="sb-input">
                    <option value="active">{t["common.active"]}</option>
                    <option value="frozen">{t["common.frozen"]}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="sb-label">{t["admin.uploadLogo"]}</label>
                <input
                  type="file"
                  name="logo"
                  accept="image/png, image/jpeg, image/webp"
                  className="sb-input text-xs"
                />
                <p className="mt-1 text-[10px] text-[var(--muted)]">{t["admin.logoHint"]}</p>
              </div>

              {state.error ? (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-300">
                  {state.error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="sb-btn sb-btn-ghost !py-2 text-xs"
                >
                  {t["common.cancel"]}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="sb-btn sb-btn-primary !py-2 text-xs"
                >
                  {pending ? t["common.loading"] : t["common.save"]}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
