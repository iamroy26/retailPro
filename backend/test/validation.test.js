import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/lib/errors.js';
import { finiteNumber, parseFilter, parseLimit, parseOffset, requiredText } from '../src/lib/validation.js';

test('required text is trimmed and bounded', () => {
  assert.equal(requiredText('  Retail  ', 'Name'), 'Retail');
  assert.throws(() => requiredText(' ', 'Name'), AppError);
  assert.throws(() => requiredText('abcdef', 'Name', { max: 5 }), AppError);
});

test('numeric validation rejects non-finite, out-of-range, and fractional integer values', () => {
  assert.equal(finiteNumber('4', 'Quantity', { min: 1, integer: true }), 4);
  assert.throws(() => finiteNumber('NaN', 'Quantity'), AppError);
  assert.throws(() => finiteNumber('-1', 'Quantity', { min: 0 }), AppError);
  assert.throws(() => finiteNumber('1.5', 'Quantity', { integer: true }), AppError);
});

test('filters must be JSON objects', () => {
  assert.deepEqual(parseFilter('{"is_archived":false}'), { is_archived: false });
  assert.throws(() => parseFilter('{broken'), AppError);
  assert.throws(() => parseFilter('[]'), AppError);
});

test('pagination limits are capped and invalid offsets reset safely', () => {
  assert.equal(parseLimit('900'), 500);
  assert.equal(parseLimit('0'), 50);
  assert.equal(parseOffset('-2'), 0);
  assert.equal(parseOffset('3'), 3);
});
