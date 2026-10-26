import { handler, json } from "@/lib/api";
import { loadPublicRestaurant } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export const GET = handler(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const restaurant = await loadPublicRestaurant(slug);
  if (!restaurant) return json({ error: "NOT_FOUND" }, 404);
  return json(restaurant);
});
