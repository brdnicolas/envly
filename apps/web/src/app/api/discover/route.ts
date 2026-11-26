import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { blockedIds } from "@/lib/blocks";
import { BUDGETS, discover, isBudget } from "@/lib/discover";

/** Gift ideas feed (app "Découvrir" screen). ?budget=moins-de-20|20-50|50-100|plus-de-100 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  const budget = new URL(req.url).searchParams.get("budget");
  const exclude = me ? [me, ...(await blockedIds(me))] : [];
  const items = await discover({ budget: isBudget(budget) ? budget : undefined, excludeUserIds: exclude });
  return NextResponse.json({
    budgets: Object.entries(BUDGETS).map(([key, b]) => ({ key, label: b.label })),
    items,
  });
}
