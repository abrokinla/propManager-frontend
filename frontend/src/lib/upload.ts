import api from './api';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Use JPEG, PNG, WEBP, or GIF.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File too large. Maximum 10MB.' };
  }

  try {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/upload-image/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, url: data.image_url };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: string } } };
    return { success: false, error: axiosErr.response?.data?.error || 'Upload failed' };
  }
}
