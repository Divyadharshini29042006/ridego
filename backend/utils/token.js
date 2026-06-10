import crypto from 'crypto';

// Generate a secure random token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a token for database storage
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};