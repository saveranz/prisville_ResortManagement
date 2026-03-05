/**
 * Compress and resize image file before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default: 1200px)
 * @param maxHeight - Maximum height (default: 1200px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Try using createImageBitmap for faster decoding (if available)
        let img: HTMLImageElement | ImageBitmap;
        let width: number;
        let height: number;
        
        if ('createImageBitmap' in window && e.target?.result instanceof ArrayBuffer) {
          // Fast path: use createImageBitmap
          const blob = new Blob([e.target.result], { type: file.type });
          img = await createImageBitmap(blob);
          width = img.width;
          height = img.height;
        } else {
          // Fallback: traditional Image loading
          img = new Image();
          const imgElement = img as HTMLImageElement;
          
          await new Promise<void>((imgResolve, imgReject) => {
            imgElement.onload = () => imgResolve();
            imgElement.onerror = () => imgReject(new Error('Failed to load image'));
            imgElement.src = e.target?.result as string;
          });
          
          width = imgElement.width;
          height = imgElement.height;
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        // Use requestAnimationFrame to prevent blocking UI
        requestAnimationFrame(() => {
          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true,
            willReadFrequently: false
          });
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw image with smooth scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium'; // Use 'medium' instead of 'high' for speed
          ctx.drawImage(img as any, 0, 0, width, height);
          
          // Convert to base64 with compression (async operation)
          requestAnimationFrame(() => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                const blobReader = new FileReader();
                blobReader.onloadend = () => {
                  resolve(blobReader.result as string);
                };
                blobReader.onerror = reject;
                blobReader.readAsDataURL(blob);
              },
              'image/jpeg',
              quality
            );
          });
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    // Use readAsArrayBuffer for createImageBitmap support
    if ('createImageBitmap' in window) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Validate file size and type
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10MB)
 * @returns Object with validation result
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Create a fast low-quality thumbnail for instant preview
 * Uses aggressive compression for speed
 */
export async function createThumbnail(file: File): Promise<string> {
  return compressImage(file, 200, 200, 0.5);
}
