/**
 * Smaller, modern-format variant of a product photo for thumbnails.
 * Cloudinary resizes on its CDN (cached after the first request); other hosts are returned as-is.
 * `width` is in physical pixels.
 */
export function thumb(url: string, width: number): string;
export function thumb(url: string | null | undefined, width: number): string | null | undefined;
export function thumb(url: string | null | undefined, width: number) {
  if (!url) return url;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!(?:[a-z]_[^/]*,?)+\/)(.*)$/);
  return m ? `${m[1]}w_${width},c_limit,q_auto,f_auto/${m[2]}` : url;
}
