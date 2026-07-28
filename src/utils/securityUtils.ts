/**
 * Security utilities for protecting the application
 */

// Input sanitization to prevent XSS attacks
export const sanitizeInput = (input: string | unknown) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .replace(/=/g, '&#x3D;');
};

// Validate and sanitize form data (recursive)
export const sanitizeFormData = (formData: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeFormData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Validate payment amount to prevent manipulation
export const validatePaymentAmount = (amount: number, expectedAmount: number) => {
  return amount === expectedAmount;
};

// Generate secure transaction ID
export const generateTransactionId = () => {
  const timestamp = Date.now();
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  const random = Array.from(array, b => b.toString(36)).join('');
  return `CSI_${timestamp}_${random}`;
};

// Encode data for temporary storage (NOT encryption - only obfuscation)
export const encodeData = (data: unknown) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (error) {
    return null;
  }
};

// Decode data from temporary storage
export const decodeData = (encodedData: string) => {
  try {
    return JSON.parse(atob(encodedData));
  } catch (error) {
    return null;
  }
};

// Validate email format
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string) => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number format
  return phoneRegex.test(phone);
};

// Validate USN format
export const isValidUSN = (usn: string) => {
  const usnRegex = /^(NNM|NU)/i;
  return usnRegex.test(usn);
};

// Sanitize phone number - Remove 0, +91 and keep only 10 digits
export const sanitizePhone = (phone: string | unknown) => {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = String(phone).replace(/\D/g, '');

  // Remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Remove country code +91 (91 after removing non-digits)
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }

  // Take only first 10 digits
  return cleaned.substring(0, 10);
};

// Rate limiting helper (client-side)
export const createRateLimiter = (maxAttempts = 5, windowMs = 60000) => {
  const attempts = new Map<string, number[]>();

  return (key: string) => {
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    // Clean old attempts
    const recentAttempts = userAttempts.filter(
      (timestamp: number) => now - timestamp < windowMs
    );

    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);
    return true; // Allowed
  };
};

// Content Security Policy headers (to be set on server)
export const getCSPHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.razorpay.com",
      "frame-src https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  };
};
