/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Turkish phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, '').replace(/[-()]/g, '');
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Validate Turkish ID number (TC Kimlik No)
 */
export const isValidTCKN = (tckn: string): boolean => {
  if (!/^\d{11}$/.test(tckn)) return false;
  if (tckn[0] === '0') return false;

  const digits = tckn.split('').map(Number);
  
  // Check digit 10
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = (sumOdd * 7 - sumEven) % 10;
  if (check10 !== digits[9]) return false;

  // Check digit 11
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumFirst10 % 10 !== digits[10]) return false;

  return true;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+90 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('90')) {
    const num = cleaned.slice(2);
    return `+90 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 8)} ${num.slice(8)}`;
  }
  return phone;
};
