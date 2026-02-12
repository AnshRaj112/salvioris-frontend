export function formatChatTime(value: string | Date): string {
  let date: Date;
  
  if (typeof value === "string") {
    // Parse the UTC timestamp string from backend
    // If it doesn't end with 'Z', assume it's UTC and append 'Z'
    const dateStr = value.endsWith('Z') || value.includes('+') || value.includes('-') && value.length > 10
      ? value
      : value + 'Z';
    date = new Date(dateStr);
  } else {
    date = value;
  }
  
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Use Intl.DateTimeFormat with undefined locale to automatically use
  // the user's browser timezone and locale settings
  // This converts the UTC timestamp to the viewer's local timezone
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // Use 12-hour format (2:30 PM) or false for 24-hour (14:30)
  }).format(date);
}


