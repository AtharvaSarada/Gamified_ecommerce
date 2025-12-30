
import { useCallback } from 'react';

export const ERROR_MESSAGES: Record<string, string> = {
    401: "Please log in to submit a review",
    403: "You must purchase this product to review it",
    409: "You've already reviewed this product",
    413: "Image too large (max 5MB per image)",
    422: "Please remove inappropriate language from your review",
    429: "Review limit reached. Try again in 24 hours.",
    500: "Something went wrong. Please try again.",
    503: "Service temporarily unavailable. Please try again.",
    NETWORK_ERROR: "Connection lost. Check your internet.",
    IMAGE_DIMENSIONS: "Image dimensions exceed 4096x4096px",
    QUOTA_EXCEEDED: "Daily image upload limit reached (50 images/day)",
    IMAGE_TOO_LARGE: "Image file size exceeds 5MB",
    INVALID_IMAGE_FORMAT: "Only JPG, PNG, and WebP images are allowed",
    RATE_LIMIT_EXCEEDED: "You've reached the maximum of 5 reviews per day"
};

export const useReviewError = () => {
    const getErrorMessage = useCallback((error: any) => {
        if (!error) return "An unknown error occurred";

        // Handle string errors (manual throws)
        if (typeof error === 'string') {
            return ERROR_MESSAGES[error] || error;
        }

        // Handle Error objects
        if (error instanceof Error) {
            // Check if message matches a key
            if (ERROR_MESSAGES[error.message]) {
                return ERROR_MESSAGES[error.message];
            }
            return error.message;
        }

        // Handle Supabase errors
        const statusCode = error.code || error.status;
        if (statusCode && ERROR_MESSAGES[statusCode]) {
            return ERROR_MESSAGES[statusCode];
        }

        return ERROR_MESSAGES[500];
    }, []);

    return { getErrorMessage };
};
