/**
 * Parses a date string and ensures it's treated as UTC if no timezone is specified.
 * This is a helper function to ensure consistent date parsing.
 */
function parseUTCDate(value: string | Date): Date {
  if (typeof value === "string") {
    let dateStr = value.trim();
    
    // Check if it already has timezone information
    const hasTimezone = 
      dateStr.endsWith('Z') || // UTC indicator
      /[+-]\d{2}:\d{2}$/.test(dateStr) || // Timezone offset like +05:30 or -05:00
      /[+-]\d{4}$/.test(dateStr); // Timezone offset like +0530 or -0500
    
    // If no timezone info, append 'Z' to treat as UTC
    // This is critical: without timezone, JavaScript treats it as LOCAL time
    if (!hasTimezone && dateStr.length > 0) {
      dateStr = dateStr + 'Z';
    }
    
    return new Date(dateStr);
  } else {
    return value;
  }
}

/**
 * Formats a timestamp to show only the time (e.g., "2:30 PM")
 * Automatically converts UTC timestamps to the user's local timezone.
 * Used for message timestamps in chat interfaces.
 */
export function formatChatTime(value: string | Date): string {
  const date = parseUTCDate(value);
  
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Use Intl.DateTimeFormat with undefined locale to automatically use
  // the user's browser timezone and locale settings
  // This converts the UTC timestamp to the viewer's local timezone
  // For example, if backend sends "2024-01-15T10:30:00Z" (UTC),
  // it will show as "4:00 PM" in IST (UTC+5:30) or appropriate time in other timezones
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // Use 12-hour format (2:30 PM) or false for 24-hour (14:30)
    timeZone: undefined, // Use browser's local timezone
  }).format(date);
}

/**
 * Formats a timestamp to show full date and time in the user's local timezone.
 * Used for admin pages and other places where full date-time is needed.
 */
export function formatDateTime(value: string | Date): string {
  const date = parseUTCDate(value);
  
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Format with full date and time, using user's local timezone
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: undefined, // Use browser's local timezone
  }).format(date);
}


