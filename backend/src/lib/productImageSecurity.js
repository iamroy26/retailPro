import { AppError } from './errors.js';

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_HOSTS = {
  open_food_facts: new Set(['images.openfoodfacts.org']),
  wikimedia_commons: new Set(['upload.wikimedia.org']),
};

export function validateProviderImageUrl(value, provider) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new AppError('The selected image URL is invalid.');
  }

  if (
    !Object.hasOwn(IMAGE_HOSTS, provider) ||
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    !IMAGE_HOSTS[provider].has(url.hostname.toLowerCase()) ||
    url.hash
  ) {
    throw new AppError('The selected image is not hosted by its approved image provider.');
  }
  return url;
}

export function detectImageContentType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString('ascii') === 'PNG' &&
    buffer.subarray(4, 8).equals(Buffer.from([0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp';
  return null;
}

export function isCommerciallyReusableLicense(value) {
  const license = String(value ?? '').trim();
  return /^(?:CC0(?:\s|$)|Public domain(?:\s|$)|CC BY(?:-SA)?(?:\s|$))/i.test(license);
}

export function cleanImageText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
