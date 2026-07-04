import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Generate a new TOTP secret
export const generateSecret = (issuer: string, userIdentifier: string) => {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${userIdentifier})`,
    issuer,
    length: 32, // 32 bytes = 256 bits
  });

  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  };
};

// Generate a QR code from an otpauth URL
export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  return await QRCode.toDataURL(otpauthUrl);
};

// Verify a TOTP token
export const verifyToken = (secretBase32: string, token: string, window: number = 2): boolean => {
  console.log('[TOTP_VERIFY] Verifying token:', {
    secretBase32Length: secretBase32.length,
    token,
    tokenLength: token.length,
    window
  });
  
  // Generate expected tokens for debugging
  const expected = speakeasy.totp({
    secret: secretBase32,
    encoding: 'base32',
    step: 30,
  });
  console.log('[TOTP_VERIFY] Current expected token:', expected);
  
  const result = speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token,
    window, // Allow ±2 window (1 minute tolerance)
  });
  
  console.log('[TOTP_VERIFY] Verification result:', result);
  return result;
};

// Generate a random backup code
export const generateBackupCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate multiple backup codes
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
};
