const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export type UploadedImage = { url: string; width: number | null; height: number | null };

export async function uploadToCloudinary(imageUrl: string): Promise<UploadedImage | null> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = `folder=envly&timestamp=${timestamp}&transformation=f_webp,q_auto,w_800`;

    const { createHash } = await import("crypto");
    const signature = createHash("sha1")
      .update(params + API_SECRET)
      .digest("hex");

    const formData = new FormData();
    formData.append("file", imageUrl);
    formData.append("folder", "envly");
    formData.append("timestamp", timestamp.toString());
    formData.append("transformation", "f_webp,q_auto,w_800");
    formData.append("api_key", API_KEY);
    formData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[cloudinary] Upload failed:", res.status, err);
      return null;
    }

    const data = await res.json();
    return {
      url: data.secure_url as string,
      width: typeof data.width === "number" ? data.width : null,
      height: typeof data.height === "number" ? data.height : null,
    };
  } catch (e) {
    console.error("[cloudinary] Upload error:", e);
    return null;
  }
}

export function getCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?((?:envly|wishly)\/.+?)(?:\.[a-z]+)?$/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  const publicId = getCloudinaryPublicId(imageUrl);
  if (!publicId) return;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = `public_id=${publicId}&timestamp=${timestamp}`;

    const { createHash } = await import("crypto");
    const signature = createHash("sha1")
      .update(params + API_SECRET)
      .digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", API_KEY);
    formData.append("signature", signature);

    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      { method: "POST", body: formData }
    );
  } catch {
    // Best-effort deletion, don't block the wish delete
  }
}

/**
 * Pixel size of an image already hosted on Cloudinary, without downloading it (`fl_getinfo` returns JSON).
 * Returns null for other hosts or on any failure.
 */
export async function cloudinaryImageSize(url: string | null | undefined): Promise<{ width: number; height: number } | null> {
  if (!url) return null;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (!m) return null;
  try {
    const res = await fetch(`${m[1]}fl_getinfo/${m[2]}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const info = await res.json();
    const { width, height } = info.output ?? info.input ?? {};
    return typeof width === "number" && typeof height === "number" ? { width, height } : null;
  } catch {
    return null;
  }
}
