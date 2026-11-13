import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import {
  cleanImageText,
  detectImageContentType,
  isCommerciallyReusableLicense,
  MAX_PRODUCT_IMAGE_BYTES,
  validateProviderImageUrl,
} from '../lib/productImageSecurity.js';

const SEARCH_TIMEOUT_MS = 8_000;
const STORAGE_TIMEOUT_MS = 15_000;
const LICENSE_URLS = {
  open_food_facts: 'https://creativecommons.org/licenses/by-sa/3.0/',
};
const FILE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hmac(key, value, encoding = 'hex') {
  return createHmac('sha256', key).update(value).digest(encoding);
}

function signedToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${hmac(config.jwtSecret, encoded, 'base64url')}`;
}

function verifySignedToken(token, ownerId) {
  if (typeof token !== 'string' || token.length > 6000) throw new AppError('The selected image has expired. Search again.');
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) throw new AppError('The selected image token is invalid.');
  const expected = Buffer.from(hmac(config.jwtSecret, encoded, 'base64url'));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new AppError('The selected image token is invalid.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new AppError('The selected image token is invalid.');
  }
  if (payload.ownerId !== ownerId || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
    throw new AppError('The selected image has expired. Search again.');
  }
  return payload;
}

function selectionToken(ownerId, candidate) {
  return signedToken({
    ownerId,
    expiresAt: Date.now() + 15 * 60 * 1000,
    provider: candidate.provider,
    imageUrl: candidate.imageUrl,
    sourceUrl: candidate.sourceUrl,
    title: candidate.title,
    license: candidate.license,
    licenseUrl: candidate.licenseUrl,
    attribution: candidate.attribution,
  });
}

async function fetchJson(url, label) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'RetailProPOS/1.0 (product-image lookup)' },
      redirect: 'error',
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
  } catch {
    throw new AppError(`${label} could not be reached. Try again shortly.`, 502);
  }
  if (!response.ok) throw new AppError(`${label} returned an error. Try again shortly.`, 502);
  try {
    return await response.json();
  } catch {
    throw new AppError(`${label} returned an invalid response.`, 502);
  }
}

function offCandidate(product, ownerId) {
  const imageUrl = product.image_front_url || product.image_url;
  const code = String(product.code ?? '').replace(/\D/g, '');
  if (!imageUrl || !/^\d{8,20}$/.test(code)) return null;

  try {
    validateProviderImageUrl(imageUrl, 'open_food_facts');
  } catch {
    return null;
  }

  const title = cleanImageText(product.product_name || `Product ${code}`, 180);
  const brand = cleanImageText(product.brands, 120);
  const candidate = {
    provider: 'open_food_facts',
    imageUrl,
    previewUrl: imageUrl,
    sourceUrl: `https://world.openfoodfacts.org/product/${code}`,
    title,
    license: 'CC BY-SA 3.0',
    licenseUrl: LICENSE_URLS.open_food_facts,
    attribution: `Open Food Facts${brand ? ` · ${brand}` : ''}`,
  };
  return {
    token: selectionToken(ownerId, candidate),
    preview_url: candidate.previewUrl,
    title: candidate.title,
    source_name: 'Open Food Facts',
    source_url: candidate.sourceUrl,
    license: candidate.license,
    license_url: candidate.licenseUrl,
    attribution: candidate.attribution,
  };
}

async function openFoodFactsSearch({ name, brand, category, barcode }, ownerId) {
  const fields = 'code,product_name,brands,image_url,image_front_url';
  let products = [];

  if (barcode) {
    const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
    url.searchParams.set('fields', fields);
    const result = await fetchJson(url, 'Open Food Facts');
    if (result.status === 1 && result.product) products.push(result.product);
  }

  let candidates = products.map((product) => offCandidate(product, ownerId)).filter(Boolean);
  if (!candidates.length) {
    const terms = [name, brand, category].filter(Boolean).join(' ').slice(0, 180);
    if (!terms) return [];
    const url = new URL('https://world.openfoodfacts.org/api/v2/search');
    url.searchParams.set('search_terms', terms);
    url.searchParams.set('page_size', '8');
    url.searchParams.set('fields', fields);
    const result = await fetchJson(url, 'Open Food Facts');
    products = Array.isArray(result.products) ? result.products : [];
    candidates = products.map((product) => offCandidate(product, ownerId)).filter(Boolean);
  }

  return candidates;
}

function commonsCandidate(page, ownerId) {
  const info = page.imageinfo?.[0];
  const metadata = info?.extmetadata ?? {};
  const license = cleanImageText(metadata.LicenseShortName?.value || metadata.UsageTerms?.value, 100);
  if (!info?.url || !info.thumburl || !isCommerciallyReusableLicense(license)) return null;

  try {
    validateProviderImageUrl(info.url, 'wikimedia_commons');
    validateProviderImageUrl(info.thumburl, 'wikimedia_commons');
  } catch {
    return null;
  }

  const title = cleanImageText(page.title?.replace(/^File:/, '') || 'Wikimedia Commons image', 180);
  const artist = cleanImageText(metadata.Artist?.value || metadata.Credit?.value, 240);
  const rawLicenseUrl = String(metadata.LicenseUrl?.value ?? '');
  const licenseUrlValue = rawLicenseUrl.match(/https:\/\/[^\s"'<>]+/i)?.[0] ?? '';
  const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`;
  const candidate = {
    provider: 'wikimedia_commons',
    imageUrl: info.url,
    previewUrl: info.thumburl,
    sourceUrl,
    title,
    license,
    licenseUrl: cleanImageText(licenseUrlValue, 500),
    attribution: artist ? `${artist} · Wikimedia Commons` : 'Wikimedia Commons',
  };
  return {
    token: selectionToken(ownerId, candidate),
    preview_url: candidate.previewUrl,
    title: candidate.title,
    source_name: 'Wikimedia Commons',
    source_url: candidate.sourceUrl,
    license: candidate.license,
    license_url: candidate.licenseUrl,
    attribution: candidate.attribution,
  };
}

async function commonsSearch({ name, brand, category }, ownerId) {
  const terms = [name, brand, category].filter(Boolean).join(' ').slice(0, 180);
  if (!terms) return [];
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', terms);
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', '12');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|extmetadata');
  url.searchParams.set('iiurlwidth', '480');
  url.searchParams.set('format', 'json');
  const result = await fetchJson(url, 'Wikimedia Commons');
  return Object.values(result.query?.pages ?? {}).map((page) => commonsCandidate(page, ownerId)).filter(Boolean);
}

export async function searchProductImages(query, ownerId) {
  const providers = [
    { name: 'Open Food Facts', search: () => openFoodFactsSearch(query, ownerId) },
    { name: 'Wikimedia Commons', search: () => commonsSearch(query, ownerId) },
  ];
  const results = await Promise.allSettled(providers.map((provider) => provider.search()));
  const items = [];
  const warnings = [];
  let successfulProviders = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successfulProviders += 1;
      items.push(...result.value);
    } else {
      warnings.push(`${providers[index].name} is temporarily unavailable.`);
    }
  });
  if (!successfulProviders) throw new AppError('Image search providers are unavailable. Try again shortly.', 502);
  return {
    items: items.slice(0, 16),
    warnings,
    storage_configured: config.imageStorage.configured,
  };
}

function metadataSignature(ownerId, imageUrl, metadata) {
  return hmac(config.jwtSecret, JSON.stringify([
    ownerId,
    imageUrl,
    metadata.provider,
    metadata.source_url,
    metadata.license,
    metadata.license_url,
    metadata.attribution,
    metadata.saved_at,
  ]), 'base64url');
}

function signedMetadata(ownerId, imageUrl, fields) {
  const metadata = {
    provider: fields.provider,
    source_url: fields.source_url || '',
    license: fields.license,
    license_url: fields.license_url || '',
    attribution: fields.attribution,
    saved_at: new Date().toISOString(),
  };
  return { ...metadata, signature: metadataSignature(ownerId, imageUrl, metadata) };
}

export function verifyStoredProductImage(ownerId, imageUrl, metadata) {
  if (typeof imageUrl !== 'string' || !imageUrl || !metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }
  const { publicBaseUrl } = config.imageStorage;
  if (!publicBaseUrl) return false;

  try {
    const base = new URL(publicBaseUrl);
    const image = new URL(imageUrl);
    if (
      base.protocol !== 'https:' ||
      image.protocol !== 'https:' ||
      image.origin !== base.origin ||
      image.search ||
      image.hash ||
      image.username ||
      image.password
    ) return false;
    const basePath = base.pathname.replace(/\/+$/, '');
    const ownerPrefix = `${basePath}/${ownerId}/products/`;
    if (!image.pathname.startsWith(ownerPrefix)) return false;
  } catch {
    return false;
  }

  if (!['open_food_facts', 'wikimedia_commons', 'manual_upload'].includes(metadata.provider)) return false;
  if (typeof metadata.signature !== 'string') return false;
  const expected = Buffer.from(metadataSignature(ownerId, imageUrl, metadata));
  const supplied = Buffer.from(metadata.signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function storageEndpoint() {
  let endpoint;
  try {
    endpoint = new URL(config.imageStorage.endpoint);
  } catch {
    throw new AppError('Product image storage has an invalid endpoint configuration.', 503);
  }
  if (
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && !config.production && ['localhost', '127.0.0.1'].includes(endpoint.hostname)))
  ) {
    throw new AppError('Product image storage must use a secure HTTPS endpoint.', 503);
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/i.test(config.imageStorage.bucket)) {
    throw new AppError('Product image storage bucket is not configured correctly.', 503);
  }
  return endpoint;
}

function awsEncodePath(pathname) {
  return pathname.split('/').map((part) => encodeURIComponent(decodeURIComponent(part))
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

function s3Authorization(url, contentType, payloadHash) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const { region, accessKeyId, secretAccessKey } = config.imageStorage;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `content-type:${contentType}\nhost:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}`;
  const canonicalRequest = ['PUT', awsEncodePath(url.pathname), '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
  const dateKey = createHmac('sha256', `AWS4${secretAccessKey}`).update(date).digest();
  const regionKey = createHmac('sha256', dateKey).update(region).digest();
  const serviceKey = createHmac('sha256', regionKey).update('s3').digest();
  const signingKey = createHmac('sha256', serviceKey).update('aws4_request').digest();
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  return {
    amzDate,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function putObject(key, contentType, buffer) {
  if (!config.imageStorage.configured) {
    throw new AppError('Product image storage is not configured. Contact your administrator.', 503);
  }
  const endpoint = storageEndpoint();
  const basePath = endpoint.pathname.replace(/\/+$/, '');
  const url = new URL(`${basePath}/${encodeURIComponent(config.imageStorage.bucket)}/${key}`, endpoint.origin);
  const payloadHash = createHash('sha256').update(buffer).digest('hex');
  const { amzDate, authorization } = s3Authorization(url, contentType, payloadHash);
  let response;
  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        'Content-Type': contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
      },
      body: buffer,
      redirect: 'error',
      signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS),
    });
  } catch {
    throw new AppError('Product image storage could not be reached. Check the storage configuration.', 502);
  }
  if (!response.ok) {
    console.error(`Product image storage rejected an upload with status ${response.status}.`);
    throw new AppError('Product image storage rejected the upload. Check bucket permissions and credentials.', 502);
  }

  let publicBase;
  try {
    publicBase = new URL(config.imageStorage.publicBaseUrl);
  } catch {
    throw new AppError('Product image storage public URL is not configured correctly.', 503);
  }
  if (publicBase.protocol !== 'https:' || publicBase.search || publicBase.hash || publicBase.username || publicBase.password) {
    throw new AppError('Product image storage public URL must be a secure HTTPS base URL.', 503);
  }
  return new URL(`${publicBase.pathname.replace(/\/+$/, '')}/${key}`, publicBase.origin).toString();
}

async function storeProductImage(ownerId, buffer, contentType, fields) {
  if (buffer.length > MAX_PRODUCT_IMAGE_BYTES) throw new AppError('Product images must be 5 MB or smaller.');
  if (detectImageContentType(buffer) !== contentType) throw new AppError('The uploaded file is not a valid JPEG, PNG, or WebP image.');
  const extension = FILE_EXTENSIONS[contentType];
  if (!extension) throw new AppError('Only JPEG, PNG, and WebP images are supported.');
  const key = `${ownerId}/products/${randomUUID()}.${extension}`;
  const imageUrl = await putObject(key, contentType, buffer);
  return {
    image_url: imageUrl,
    image_metadata: signedMetadata(ownerId, imageUrl, fields),
  };
}

async function boundedResponseBody(response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_PRODUCT_IMAGE_BYTES) {
    throw new AppError('The selected image is larger than 5 MB.');
  }
  if (!response.body) throw new AppError('The image provider returned an empty image.');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PRODUCT_IMAGE_BYTES) {
      await reader.cancel();
      throw new AppError('The selected image is larger than 5 MB.');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

async function fetchProviderImage(imageUrl, provider) {
  const url = validateProviderImageUrl(imageUrl, provider);
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'image/jpeg,image/png,image/webp' },
      redirect: 'error',
      signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS),
    });
  } catch {
    throw new AppError('The selected image provider could not be reached. Search again or choose another image.', 502);
  }
  if (!response.ok) throw new AppError('The selected image is no longer available. Search again.');
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!FILE_EXTENSIONS[contentType]) throw new AppError('The selected image is not a supported JPEG, PNG, or WebP file.');
  const buffer = await boundedResponseBody(response);
  if (detectImageContentType(buffer) !== contentType) throw new AppError('The image provider returned an invalid image file.');
  return { buffer, contentType };
}

export async function importSelectedProductImage(ownerId, token) {
  const selection = verifySignedToken(token, ownerId);
  if (!['open_food_facts', 'wikimedia_commons'].includes(selection.provider)) {
    throw new AppError('The selected image provider is not supported.');
  }
  const image = await fetchProviderImage(selection.imageUrl, selection.provider);
  return storeProductImage(ownerId, image.buffer, image.contentType, {
    provider: selection.provider,
    source_url: selection.sourceUrl,
    license: selection.license,
    license_url: selection.licenseUrl,
    attribution: selection.attribution,
  });
}

export async function uploadProductImage(ownerId, buffer, contentType) {
  return storeProductImage(ownerId, buffer, contentType, {
    provider: 'manual_upload',
    source_url: '',
    license: 'User-provided',
    license_url: '',
    attribution: 'User-provided image',
  });
}

export function validateProductImageFields(ownerId, data) {
  const hasImageUrl = Object.hasOwn(data, 'image_url');
  const hasMetadata = Object.hasOwn(data, 'image_metadata');
  if (!hasImageUrl && !hasMetadata) return;
  if (!hasImageUrl || !hasMetadata) {
    throw new AppError('Image URL and image metadata must be saved together.');
  }
  const imageUrl = String(data.image_url ?? '').trim();
  if (!imageUrl) {
    data.image_url = '';
    data.image_metadata = null;
    return;
  }
  if (!verifyStoredProductImage(ownerId, imageUrl, data.image_metadata)) {
    throw new AppError('The product image is invalid or does not belong to this store.');
  }
  data.image_url = imageUrl;
}
