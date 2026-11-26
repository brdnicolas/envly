/**
 * Android App Links: envly.fr links open the app when installed (autoVerify intent filters in app.json).
 * ANDROID_CERT_SHA256: SHA-256 fingerprint(s) of the app signing certificate, comma-separated
 * (Google Play Console → Test and release → App integrity → App signing).
 */
export const dynamic = "force-dynamic";

export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return Response.json(
    fingerprints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: "fr.envly.app", sha256_cert_fingerprints: fingerprints },
          },
        ]
      : [],
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
