import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWechatImagePayload,
  normalizeHttpImages,
  normalizeRawWechatImages,
} from '../utils/wechat-publish-images.js';

test('normalizeHttpImages keeps only trimmed HTTP image URLs', () => {
  assert.deepEqual(
    normalizeHttpImages([' https://a.com/1.png ', 'data:image/png;base64,AAA', 'http://b.com/2.jpg', '']),
    ['https://a.com/1.png', 'http://b.com/2.jpg'],
  );
});

test('normalizeRawWechatImages keeps only trimmed data URLs', () => {
  assert.deepEqual(
    normalizeRawWechatImages([' https://a.com/1.png ', ' data:image/png;base64,AAA ', '', 'data:image/jpeg;base64,BBB']),
    ['data:image/png;base64,AAA', 'data:image/jpeg;base64,BBB'],
  );
});

test('buildWechatImagePayload splits HTTP and data URL images for greenbook publishing', () => {
  const payload = buildWechatImagePayload({
    wechatType: 'greenbook',
    images: [
      'https://cdn.example.com/a.png',
      'data:image/png;base64,AAA',
      '  https://cdn.example.com/a.png  ',
      '',
    ],
  });

  assert.deepEqual(payload.mainImages, ['https://cdn.example.com/a.png']);
  assert.deepEqual(payload.rawMainImages, ['data:image/png;base64,AAA']);
});

test('buildWechatImagePayload ignores raw images for article publishing', () => {
  const payload = buildWechatImagePayload({
    wechatType: 'article',
    images: ['https://cdn.example.com/a.png', 'data:image/png;base64,AAA'],
  });

  assert.deepEqual(payload.mainImages, ['https://cdn.example.com/a.png']);
  assert.deepEqual(payload.rawMainImages, []);
});

test('buildWechatImagePayload returns stable empty arrays for empty greenbook input', () => {
  const payload = buildWechatImagePayload({
    wechatType: 'greenbook',
    images: [],
  });

  assert.deepEqual(payload.mainImages, []);
  assert.deepEqual(payload.rawMainImages, []);
});

test('buildWechatImagePayload keeps data URLs in rawMainImages without converting them', () => {
  const dataUrl = 'data:image/png;base64,AAA';
  const payload = buildWechatImagePayload({
    wechatType: 'greenbook',
    images: [dataUrl],
  });

  assert.deepEqual(payload.mainImages, []);
  assert.deepEqual(payload.rawMainImages, [dataUrl]);
});
