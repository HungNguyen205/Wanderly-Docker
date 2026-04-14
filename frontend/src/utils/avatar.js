/**
 * Generate default avatar URL using UI Avatars API
 * @param {string} name - User's name or email
 * @param {string} backgroundColor - Background color (hex without #)
 * @param {number} size - Avatar size (default: 256)
 * @returns {string} Avatar URL
 */
export const getDefaultAvatar = (name = "User", backgroundColor = "FF6B6B", size = 256) => {
    const encodedName = encodeURIComponent(name || "User");
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=fff&bold=true&size=${size}`;
};

