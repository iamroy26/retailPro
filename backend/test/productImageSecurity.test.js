import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanImageText,
  detectImageContentType,
  isCommerciallyReusableLicense,
  validateProviderImageUrl,
} from '../src/lib/productImageSecurity.js';

test('only provider HTTPS image URLs are accepted', () => {
  assert.equal(
    validateProviderImageUrl('https://images.openfoodfacts.org/images/products/123/front.400.jpg', 'open_food_facts').hostname,
    'images.openfoodfacts.org',
  );
  assert.equal(
    validateProviderImageUrl('https://upload.wikimedia.org/wikipedia/commons/a/a0/product.png', 'wikimedia_commons').hostname,
    'upload.wikimedia.org',
  );
  for (const [url, provider] of [
    ['http://images.openfoodfacts.org/photo.jpg', 'open_food_facts'],
    ['https://127.0.0.1/image.jpg', 'open_food_facts'],
    ['https://upload.wikimedia.org.evil.example/image.jpg', 'wikimedia_commons'],
    ['https://user@upload.wikimedia.org/image.jpg', 'wikimedia_commons'],
    ['https://example.com/image.jpg', 'unknown'],
  ]) {
    assert.throws(() => validateProviderImageUrl(url, provider));
  }
});

test('raster file signatures are checked and unsupported formats are rejected', () => {
  assert.equal(detectImageContentType(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg');
  assert.equal(detectImageContentType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(detectImageContentType(Buffer.from('RIFF0000WEBP')), 'image/webp');
  assert.equal(detectImageContentType(Buffer.from('<svg></svg>')), null);
});

test('commercially reusable licenses include CC BY/SA and public domain, not non-commercial licenses', () => {
  assert.equal(isCommerciallyReusableLicense('CC BY-SA 4.0'), true);
  assert.equal(isCommerciallyReusableLicense('CC BY 4.0'), true);
  assert.equal(isCommerciallyReusableLicense('CC0 1.0'), true);
  assert.equal(isCommerciallyReusableLicense('Public domain'), true);
  assert.equal(isCommerciallyReusableLicense('CC BY-NC 4.0'), false);
  assert.equal(isCommerciallyReusableLicense('All rights reserved'), false);
});

test('provider attribution text is reduced to bounded plain text', () => {
  assert.equal(cleanImageText('<a href="x">Retail &amp; Co</a>  photo'), 'Retail & Co photo');
  assert.equal(cleanImageText('abcdefgh', 4), 'abcd');
});
