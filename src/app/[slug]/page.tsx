import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getLang } from "@/lib/lang";
import { loadPublicRestaurant } from "@/lib/serialize";
import RestaurantPublicClient from "./RestaurantPublicClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await loadPublicRestaurant(slug);
  if (!restaurant) return { title: "Restaurant Not Found" };

  return {
    title: `${restaurant.name} | المنيو وتتبع الطلبات`,
    description: restaurant.tagline ?? restaurant.taglineEn ?? `قائمة طعام وخدمة النداء الذكي لمطعم ${restaurant.name}`,
    openGraph: {
      title: `${restaurant.name} | Smart Buzzer`,
      description: restaurant.tagline ?? restaurant.taglineEn ?? undefined,
      images: restaurant.logoUrl ? [restaurant.logoUrl] : undefined,
    },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await loadPublicRestaurant(slug);
  if (!restaurant) notFound();

  const lang = await getLang();

  return <RestaurantPublicClient restaurant={restaurant} lang={lang} />;
}
