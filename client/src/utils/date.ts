export const getYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (date: Date) => 
  date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });

export const formatDate = (date: Date) => 
  date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });