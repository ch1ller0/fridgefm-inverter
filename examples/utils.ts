import crypto from 'crypto';

export const delay = (to: number) => new Promise((res) => setTimeout(res, to));
export const random = (up: number) => Math.round(up * Math.random());
export const randomString = () => crypto.randomBytes(64).toString('hex');
