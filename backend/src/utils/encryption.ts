import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

// Get or generate encryption key (32 bytes for AES-256)
const getEncryptionKey = (): Buffer => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('Missing ENCRYPTION_KEY environment variable (must be 32 bytes hex)');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  return key;
};

// Encrypt a secret string using AES-256-GCM
export const encrypt = (plaintext: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 16 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// Decrypt a secret string encrypted with encrypt()
export const decrypt = (encryptedString: string): string => {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = encryptedString.split(':');
  
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted string format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
};

// Hash a backup code using bcrypt
export const hashBackupCode = async (code: string): Promise<string> => {
  return await bcrypt.hash(code, 10);
};

// Verify a backup code against its hash
export const verifyBackupCode = async (code: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(code, hash);
};

// Generate a random 32-byte key and log it (for setup purposes)
export const generateEncryptionKey = (): string => {
  const key = crypto.randomBytes(32).toString('hex');
  return key;
};
