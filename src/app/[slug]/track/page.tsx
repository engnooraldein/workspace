import { notFound } from "next/navigation";

import TrackingClient from "@/components/tracking/TrackingClient";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { loadPublicOrder, loadPublicRestaurant } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
};

export default async function TrackPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const lang = await getLang();
  const t = dict[lang];

  const token = Array.isArray(query.order) ? query.order[0] : query.order;

  if (!token) {
    return (
      <div className="sb-card p-6 text-center">
        <p className="font-bold text-rose-300">{t["track.expired"]}</p>
      </div>
    );
  }

  const order = await loadPublicOrder(token);
  if (!order) {
    return (
      <div className="sb-card p-6 text-center">
        <p className="font-bold text-rose-300">{t["track.notFound"]}</p>
      </div>
    );
  }

  // The tracking token must belong to the restaurant in the URL.
  if (order.restaurant.slug !== slug.toLowerCase()) notFound();

  const restaurant = await loadPublicRestaurant(slug);

  return (
    <TrackingClient
      initial={order}
      menu={restaurant?.menu ?? []}
      promos={restaurant?.promos ?? []}
      lang={lang}
    />
  );
}
