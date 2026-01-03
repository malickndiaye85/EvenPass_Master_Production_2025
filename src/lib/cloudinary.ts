// Cloudinary upload utility for KYC documents

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dus8ia9x8';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'evenpass_upload';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

/**
 * Upload un fichier vers Cloudinary (unsigned upload)
 * @param file Le fichier à uploader
 * @param folder Le dossier de destination dans Cloudinary
 * @returns L'URL sécurisée du fichier uploadé
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'verification-documents'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    console.log('[CLOUDINARY] Uploading file:', file.name, 'to folder:', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CLOUDINARY] Upload error:', errorData);
      throw new Error(errorData.error?.message || 'Erreur lors de l\'upload');
    }

    const data: CloudinaryUploadResult = await response.json();
    console.log('[CLOUDINARY] Upload successful:', data.secure_url);

    return data.secure_url;
  } catch (error) {
    console.error('[CLOUDINARY] Upload failed:', error);
    throw error;
  }
}

/**
 * Upload plusieurs fichiers vers Cloudinary
 * @param files Tableau de fichiers à uploader
 * @param folder Le dossier de destination
 * @returns Tableau d'URLs
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string = 'verification-documents'
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
}
