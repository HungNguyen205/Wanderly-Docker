/**
 * Default images for the application
 */

// Default itinerary cover image
// Option 1: Use online placeholder (current)
//export const DEFAULT_ITINERARY_IMAGE = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80";

// Option 2: Use local image (uncomment and add your image to src/assets/images/)
import defaultItineraryImage from '@/assets/images/default-itinerary.jpg';
export const DEFAULT_ITINERARY_IMAGE = defaultItineraryImage;

/**
 * Get itinerary cover image with fallback
 * @param {string|null|undefined} coverImageUrl - The cover image URL from API
 * @returns {string} Image URL (either provided or default)
 */
export const getItineraryCoverImage = (coverImageUrl) => {
    if (coverImageUrl && coverImageUrl.trim() !== '') {
        return coverImageUrl;
    }
    return DEFAULT_ITINERARY_IMAGE;
};

