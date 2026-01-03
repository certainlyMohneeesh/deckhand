import { nanoid, customAlphabet } from 'nanoid';
import QRCode from 'qrcode';

// Generate a 6-character room code using uppercase letters and numbers
const generateRoomCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

/**
 * Generate a unique 6-character room code
 */
export function createRoomCode(): string {
  return generateRoomCode();
}

/**
 * Generate a QR code data URL containing the room join URL
 * @param roomCode - The room code to encode
 * @param baseUrl - The base URL of the application (e.g., http://localhost:3000)
 */
export async function generateRoomQRCode(
  roomCode: string,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
): Promise<string> {
  const joinUrl = `${baseUrl}/join?room=${roomCode}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate a room code format (6 uppercase alphanumeric characters)
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Format a room code for display (e.g., ABC123 -> ABC-123)
 */
export function formatRoomCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Normalize a room code (remove spaces, dashes, convert to uppercase)
 */
export function normalizeRoomCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Get device name from user agent or default
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  
  const ua = window.navigator.userAgent;
  
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Win/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux PC';
  
  return 'Unknown Device';
}

/**
 * Get a unique session ID for this device
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return nanoid();
  
  let sessionId = sessionStorage.getItem('deckhand-session-id');
  
  if (!sessionId) {
    sessionId = nanoid();
    sessionStorage.setItem('deckhand-session-id', sessionId);
  }
  
  return sessionId;
}
