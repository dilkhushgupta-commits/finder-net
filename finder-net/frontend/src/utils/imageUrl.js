/**
 * Resolve image URLs - handles both Cloudinary URLs and local uploads
 * Local uploads are proxied through Vite dev server to backend
 */

export const resolveImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/400x300?text=No+Image';
  
  // If it's already an absolute URL (Cloudinary, etc.), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Local upload — Vite proxy forwards /uploads to backend
  if (url.startsWith('/uploads/')) {
    return url;
  }
  
  return url;
};

/**
 * Get the first image URL from an item's images array
 */
export const getItemImageUrl = (item) => {
  const url = item?.images?.[0]?.url;
  return resolveImageUrl(url);
};
