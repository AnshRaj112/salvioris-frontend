/**
 * Generate a consistent color for a user based on their ID
 * This ensures the same user always gets the same color
 */
export function generateUserColor(userId: string): string {
  // Generate a hash from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a color with good saturation and lightness
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 50 + (Math.abs(hash) % 15); // 50-65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get user color from localStorage or generate a new one
 */
export function getUserColor(userId: string): string {
  if (typeof window === "undefined") {
    return generateUserColor(userId);
  }
  
  const storedColor = localStorage.getItem(`user_color_${userId}`);
  if (storedColor) {
    return storedColor;
  }
  
  const color = generateUserColor(userId);
  localStorage.setItem(`user_color_${userId}`, color);
  return color;
}

/**
 * Store user color in localStorage
 */
export function storeUserColor(userId: string, color?: string): void {
  if (typeof window === "undefined") return;
  
  const colorToStore = color || generateUserColor(userId);
  localStorage.setItem(`user_color_${userId}`, colorToStore);
}

