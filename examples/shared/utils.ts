import crypto from 'crypto';

export const delay = (to: number) => new Promise((res) => setTimeout(res, to));
export const randomString = () => crypto.randomBytes(8).toString('hex');
