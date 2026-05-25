const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return { success: false, error: 'Cloudinary not configured' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Use JPEG, PNG, WEBP, or GIF.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File too large. Maximum 10MB.' };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData },
    );
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Upload failed' };
    }
    return { success: true, url: data.secure_url };
  } catch {
    return { success: false, error: 'Network error during upload' };
  }
}
