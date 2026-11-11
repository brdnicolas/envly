import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scrapeProduct, ScrapeError } from "@/lib/scrape";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const { title, description, imageUrl, images, price, currency } = await scrapeProduct(url);
    return NextResponse.json({ title, description, imageUrl, images, price, currency });
  } catch (e) {
    const code = e instanceof ScrapeError ? e.code : "fetch_failed";
    if (code === "invalid_url") {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }
    if (code === "no_product") {
      return NextResponse.json(
        { error: "Could not extract product info. Please fill in the details manually." },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch URL. Please fill in the details manually." },
      { status: 400 }
    );
  }
}
