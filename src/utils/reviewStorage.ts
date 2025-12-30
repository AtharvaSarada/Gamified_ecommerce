
import { supabase } from '@/lib/supabase';

// Helper for validating image dimensions
async function validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img.width <= 4096 && img.height <= 4096);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(false);
        };

        img.src = objectUrl;
    });
}

// Helper for checking monthly storage quota
async function checkUserStorageQuota(userId: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('reviews')
        .select('images')
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo);

    if (error) {
        console.error('Quota check failed:', error);
        return true; // Fail open
    }

    const totalImages = data.reduce((acc, review) => {
        return acc + (review.images?.length || 0);
    }, 0);

    return totalImages < 50;
}

export async function uploadReviewImage(
    file: File,
    userId: string,
    signal?: AbortSignal
): Promise<string> {
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('IMAGE_TOO_LARGE');
    }

    // Validate MIME type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('INVALID_IMAGE_FORMAT');
    }

    // Validate dimensions
    const isValidDimensions = await validateImageDimensions(file);
    if (!isValidDimensions) {
        throw new Error('IMAGE_DIMENSIONS');
    }

    // Check quota
    const hasQuota = await checkUserStorageQuota(userId);
    if (!hasQuota) {
        throw new Error('QUOTA_EXCEEDED');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('review-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            // @ts-ignore - Supabase types might be slightly outdated on signal support but it passes through
            ...(signal && { signal })
        });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('review-images')
        .getPublicUrl(fileName);

    return publicUrl;
}

export async function deleteReviewImages(urls: string[]): Promise<void> {
    if (!urls || urls.length === 0) return;

    // Extract file paths from URLs
    // Expected URL format: https://[project].supabase.co/storage/v1/object/public/review-images/[userId]/[file].jpg
    const filePaths = urls.map(url => {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/review-images/');
            return parts.length > 1 ? parts[1] : null;
        } catch {
            return null;
        }
    }).filter((path): path is string => Boolean(path));

    if (filePaths.length === 0) return;

    const { error } = await supabase.storage
        .from('review-images')
        .remove(filePaths);

    if (error) {
        console.error('Failed to delete images:', error);
        // Don't throw - image cleanup is non-critical
    }
}
