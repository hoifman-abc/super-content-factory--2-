import test from 'node:test';
import assert from 'node:assert/strict';

import {
  imageExtFromMime,
  parseDataUrlImage,
  uploadDataUrlToPublicUrl,
} from '../utils/local-image-upload.js';

const TINY_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yF9sAAAAASUVORK5CYII=';

test('parseDataUrlImage extracts mime, extension, and bytes', () => {
  const parsed = parseDataUrlImage(TINY_PNG_DATA_URL);
  assert.ok(parsed);
  assert.equal(parsed.mime, 'image/png');
  assert.equal(parsed.ext, 'png');
  assert.ok(parsed.bytes instanceof Buffer);
  assert.ok(parsed.bytes.length > 0);
});

test('imageExtFromMime handles common image mime types', () => {
  assert.equal(imageExtFromMime('image/png'), 'png');
  assert.equal(imageExtFromMime('image/jpeg'), 'jpg');
  assert.equal(imageExtFromMime('image/webp'), 'webp');
  assert.equal(imageExtFromMime('image/gif'), 'gif');
});

test('uploadDataUrlToPublicUrl falls back to the next provider', async () => {
  const calls = [];
  const url = await uploadDataUrlToPublicUrl(TINY_PNG_DATA_URL, {}, async (input, init) => {
    const target = String(input);
    calls.push(target);
    if (target.includes('tmpfiles.org')) {
      throw new Error('socket hang up');
    }
    assert.equal(target, 'https://0x0.st');
    assert.equal(init?.method, 'POST');
    return {
      ok: true,
      status: 200,
      text: async () => 'https://0x0.st/abc.png',
    };
  });

  assert.equal(url, 'https://0x0.st/abc.png');
  assert.deepEqual(calls, ['https://tmpfiles.org/api/v1/upload', 'https://0x0.st']);
});

test('uploadDataUrlToPublicUrl surfaces provider failures and recovery hints', async () => {
  await assert.rejects(
    () => uploadDataUrlToPublicUrl(TINY_PNG_DATA_URL, {}, async (input) => {
      const target = String(input);
      if (target.includes('tmpfiles.org')) {
        throw new Error('ECONNRESET');
      }
      return {
        ok: false,
        status: 503,
        text: async () => 'uploads disabled',
      };
    }),
    (error) => {
      assert.match(error.message, /tmpfiles\.org/i);
      assert.match(error.message, /0x0\.st/i);
      assert.match(error.message, /WECHAT_IMAGE_UPLOAD_URL/);
      assert.match(error.message, /WECHAT_IMAGE_SMMS_TOKEN/);
      return true;
    },
  );
});
