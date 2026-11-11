import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushMessage = {
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped, e.g. `/santa/abc`. */
  url?: string;
};

type Ticket = { status: "ok" | "error"; details?: { error?: string } };

/**
 * Send a notification to every device of these users through Expo's push service.
 * Best effort: never throws. Tokens of uninstalled apps are cleaned up.
 */
export async function sendPush(userIds: string[], message: PushMessage) {
  if (!userIds.length) return;
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: [...new Set(userIds)] } },
      select: { token: true },
    });
    const all = tokens.map((t) => t.token);
    const dead: string[] = [];

    for (let i = 0; i < all.length; i += 100) {
      const batch = all.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            title: message.title,
            body: message.body,
            sound: "default",
            data: message.url ? { url: message.url } : {},
          }))
        ),
      });
      if (!res.ok) {
        console.error("[push] Expo responded", res.status, await res.text());
        continue;
      }
      const { data } = (await res.json()) as { data: Ticket[] };
      data.forEach((ticket, j) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") dead.push(batch[j]);
      });
    }

    if (dead.length) await prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
  } catch (e) {
    console.error("[push] send failed", e);
  }
}
