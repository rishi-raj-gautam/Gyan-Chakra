import crypto from 'crypto';

export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

export const generateReferralCode = (): string =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

export const generateSecureToken = (): string =>
  crypto.randomBytes(32).toString('hex');
