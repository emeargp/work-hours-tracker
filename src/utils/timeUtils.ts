// Time formatting utilities

export const formatTime = (date: Date, format: '12h' | '24h' = '24h'): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

export const formatTimeString = (timeString: string, format: '12h' | '24h' = '24h'): string => {
  // Convert HH:MM string to display format
  const [hours, minutes] = timeString.split(':').map(num => parseInt(num) || 0);
  const date = new Date();
  date.setHours(hours, minutes);
  return formatTime(date, format);
};

export const parseTimeInput = (timeInput: string, format: '12h' | '24h' = '24h'): string => {
  // Convert user input back to HH:MM format for storage
  if (format === '24h') {
    return timeInput; // Already in HH:MM format
  }
  
  // Parse 12-hour format (e.g., "02:30 PM" -> "14:30")
  const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
  const match = timeInput.match(timeRegex);
  
  if (!match) {
    return timeInput; // Return as-is if format doesn't match
  }
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const createTimeFromString = (timeString: string): Date => {
  // Create a Date object from HH:MM string
  const [hours, minutes] = timeString.split(':').map(num => parseInt(num) || 0);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};
