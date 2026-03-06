import { NextResponse } from "next/server";
import { buildAffiliateUrl } from "@/lib/affiliate";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const affiliateUrl = buildAffiliateUrl(url);

  return NextResponse.redirect(affiliateUrl, { status: 302 });
}
