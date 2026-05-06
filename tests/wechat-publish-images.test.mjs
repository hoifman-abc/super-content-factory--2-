import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWechatImagePayload,
  normalizeHttpImages,
  normalizeRawWechatImages,
  pickWechatCoverImage,
  resolveWechatPublishableImages,
  requiresWechatImageUploadBridge,
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

test('buildWechatImagePayload keeps only HTTP images in mainImages for greenbook publishing', () => {
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

test('pickWechatCoverImage skips data URLs and falls back to the first HTTP image', () => {
  const coverImage = pickWechatCoverImage({
    preferredCoverImage: 'data:image/png;base64,AAA',
    images: [
      'data:image/png;base64,BBB',
      ' https://cdn.example.com/a.png ',
      'http://cdn.example.com/b.jpg',
    ],
  });

  assert.equal(coverImage, 'https://cdn.example.com/a.png');
});

test('pickWechatCoverImage returns undefined when only raw images are available', () => {
  const coverImage = pickWechatCoverImage({
    images: ['data:image/png;base64,AAA', ' data:image/jpeg;base64,BBB '],
  });

  assert.equal(coverImage, undefined);
});

test('resolveWechatPublishableImages uploads raw images and preserves order', async () => {
  const calls = [];
  const images = await resolveWechatPublishableImages({
    images: [
      'data:image/png;base64,AAA',
      'https://cdn.example.com/a.png',
      ' data:image/jpeg;base64,BBB ',
    ],
    uploadDataImage: async (dataUrl) => {
      calls.push(dataUrl);
      if (dataUrl.includes('AAA')) return 'https://cdn.example.com/uploaded-a.png';
      return 'https://cdn.example.com/uploaded-b.jpg';
    },
  });

  assert.deepEqual(images, [
    'https://cdn.example.com/uploaded-a.png',
    'https://cdn.example.com/a.png',
    'https://cdn.example.com/uploaded-b.jpg',
  ]);
  assert.deepEqual(calls, ['data:image/png;base64,AAA', 'data:image/jpeg;base64,BBB']);
});

test('resolveWechatPublishableImages reuses uploads for duplicate raw images', async () => {
  let uploads = 0;
  const images = await resolveWechatPublishableImages({
    images: [
      'data:image/png;base64,AAA',
      'data:image/png;base64,AAA',
    ],
    uploadDataImage: async () => {
      uploads += 1;
      return 'https://cdn.example.com/uploaded-a.png';
    },
  });

  assert.deepEqual(images, ['https://cdn.example.com/uploaded-a.png']);
  assert.equal(uploads, 1);
});

test('requiresWechatImageUploadBridge is true for greenbook payloads with only raw images', () => {
  assert.equal(
    requiresWechatImageUploadBridge({
      wechatType: 'greenbook',
      mainImages: [],
      rawMainImages: ['data:image/png;base64,AAA'],
    }),
    true,
  );
});

test('requiresWechatImageUploadBridge is false when a greenbook payload already has HTTP images', () => {
  assert.equal(
    requiresWechatImageUploadBridge({
      wechatType: 'greenbook',
      mainImages: ['https://cdn.example.com/a.png'],
      rawMainImages: ['data:image/png;base64,AAA'],
    }),
    false,
  );
});
