const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export async function uploadToCloudinary(
  imageUrl: string
): Promise<string | null> {
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
    return data.secure_url as string;
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
