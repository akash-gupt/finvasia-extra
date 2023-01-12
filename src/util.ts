import crypto from 'crypto';

export const sha256 = (data: string) => {
  const h = crypto.createHash('sha256');
  h.update(data, 'utf-8');
  return h.digest('hex');
};
