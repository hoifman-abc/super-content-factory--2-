# WeChat Official Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop WeChat greenbook publishing from depending on `/local-upload-image` and send raw images to the existing `/wechat-publish` backend for official WeChat upload.

**Architecture:** Extract WeChat greenbook image normalization and payload shaping into a focused helper, cover it with node tests first, then update the publish modal to use that helper and send `rawMainImages` for `data:image/...` inputs while preserving existing HTTP image handling. Keep the existing `postWechat('/wechat-publish', payload)` entrypoint and limit the frontend change to payload shaping plus clearer backend-driven error messaging.

**Tech Stack:** React, TypeScript, Vite, node:test

---

### Task 1: Add Focused Image Normalization Helpers

**Files:**
- Create: `utils/wechat-publish-images.js`
- Create: `tests/wechat-publish-images.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

import {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `utils/wechat-publish-images.js`

- [ ] **Step 3: Write minimal implementation**

```javascript
const normalizeImage = (value) => String(value || '').trim();

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

export const normalizeHttpImages = (images = []) => {
  return unique(images.map(normalizeImage).filter((value) => /^https?:\/\//i.test(value)));
};

export const normalizeRawWechatImages = (images = []) => {
  return unique(images.map(normalizeImage).filter((value) => /^data:image\//i.test(value)));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: PASS with 2 tests passing

- [ ] **Step 5: Commit**

```bash
git add tests/wechat-publish-images.test.mjs utils/wechat-publish-images.js
git commit -m "test: add wechat publish image normalization helpers"
```

### Task 2: Add WeChat Greenbook Payload Shaping

**Files:**
- Modify: `utils/wechat-publish-images.js`
- Modify: `tests/wechat-publish-images.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWechatImagePayload } from '../utils/wechat-publish-images.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: FAIL with `SyntaxError` or export error because `buildWechatImagePayload` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```javascript
export const buildWechatImagePayload = ({ wechatType, images = [] } = {}) => {
  if (wechatType !== 'greenbook') {
    return {
      mainImages: normalizeHttpImages(images),
      rawMainImages: [],
    };
  }

  return {
    mainImages: normalizeHttpImages(images),
    rawMainImages: normalizeRawWechatImages(images),
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: PASS with 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add tests/wechat-publish-images.test.mjs utils/wechat-publish-images.js
git commit -m "feat: add wechat greenbook image payload shaping"
```

### Task 3: Extend the WeChat Publish Payload Contract

**Files:**
- Modify: `pages/WorkspacePage.tsx`
- Modify: `utils/wechat-publish-images.js`
- Test: `tests/wechat-publish-images.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWechatImagePayload } from '../utils/wechat-publish-images.js';

test('buildWechatImagePayload returns stable empty arrays for empty greenbook input', () => {
  const payload = buildWechatImagePayload({
    wechatType: 'greenbook',
    images: [],
  });

  assert.deepEqual(payload.mainImages, []);
  assert.deepEqual(payload.rawMainImages, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: FAIL if `buildWechatImagePayload` returns `undefined` fields or unstable values for empty image input

- [ ] **Step 3: Write minimal implementation in the helper and payload type**

```javascript
export const buildWechatImagePayload = ({ wechatType, images = [] } = {}) => {
  const mainImages = normalizeHttpImages(images);
  const rawMainImages = wechatType === 'greenbook' ? normalizeRawWechatImages(images) : [];

  return {
    mainImages,
    rawMainImages,
  };
};
```

```typescript
type PublishWechatPayload = {
  wechatAppid: string;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  mainImages?: string[];
  rawMainImages?: string[];
  author?: string;
  contentFormat?: 'markdown' | 'html';
  articleType?: 'news' | 'newspic';
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: PASS with 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add pages/WorkspacePage.tsx tests/wechat-publish-images.test.mjs utils/wechat-publish-images.js
git commit -m "feat: extend wechat publish payload with raw images"
```

### Task 4: Remove Greenbook Dependence on `/local-upload-image`

**Files:**
- Modify: `pages/WorkspacePage.tsx`
- Test: `tests/wechat-publish-images.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWechatImagePayload } from '../utils/wechat-publish-images.js';

test('buildWechatImagePayload keeps data URLs in rawMainImages without converting them', () => {
  const dataUrl = 'data:image/png;base64,AAA';
  const payload = buildWechatImagePayload({
    wechatType: 'greenbook',
    images: [dataUrl],
  });

  assert.deepEqual(payload.mainImages, []);
  assert.deepEqual(payload.rawMainImages, [dataUrl]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: FAIL if the helper still rewrites, drops, or normalizes away raw image inputs incorrectly

- [ ] **Step 3: Write minimal implementation in the publish modal**

```typescript
import { buildWechatImagePayload } from '../utils/wechat-publish-images.js';
```

```typescript
if (wechatType === 'greenbook') {
  if (!mergedImages || mergedImages.length === 0) {
    setSubmitError('小绿书至少需要 1 张图片');
    return;
  }

  if (finalBody.length > 1000) {
    finalBody = finalBody.slice(0, 1000);
    truncated = true;
  }
}

const { mainImages, rawMainImages } = buildWechatImagePayload({
  wechatType,
  images: mergedImages,
});

const payload: PublishWechatPayload = {
  wechatAppid,
  title: safeTitle,
  content: finalBody || (work?.content || ''),
  summary,
  coverImage: coverImageToUse,
  mainImages: wechatType === 'greenbook'
    ? (mainImages.length > 0 ? mainImages : undefined)
    : undefined,
  rawMainImages: wechatType === 'greenbook'
    ? (rawMainImages.length > 0 ? rawMainImages : undefined)
    : undefined,
  contentFormat,
  articleType,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/wechat-publish-images.test.mjs`
Expected: PASS with 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add pages/WorkspacePage.tsx tests/wechat-publish-images.test.mjs utils/wechat-publish-images.js
git commit -m "feat: send raw wechat greenbook images to backend"
```

### Task 5: Update Frontend Messaging and Verify Integration

**Files:**
- Modify: `pages/WorkspacePage.tsx`
- Test: `tests/local-image-upload.test.mjs`
- Test: `tests/wechat-publish-images.test.mjs`

- [ ] **Step 1: Keep failure handling backend-driven**

```typescript
} catch (err: any) {
  const msg = err?.message || '发布失败，请稍后重试';
  setSubmitError(msg);
  alert(`发布失败：${msg}`);
}
```

- [ ] **Step 2: Run the focused node tests**

Run: `node --test tests/wechat-publish-images.test.mjs tests/local-image-upload.test.mjs`
Expected: PASS with all tests passing

- [ ] **Step 3: Run the complete node test suite**

Run: `node --test tests/*.test.mjs`
Expected: PASS with all existing and new node tests passing

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: Vite build exits with code 0

- [ ] **Step 5: Commit**

```bash
git add pages/WorkspacePage.tsx tests/wechat-publish-images.test.mjs utils/wechat-publish-images.js
git commit -m "feat: prepare frontend for wechat official image upload"
```

## Backend Handoff Requirement

The frontend work in this repository is only half of the rollout. Before end-to-end greenbook publishing can succeed, the existing backend endpoint at `wx.limyai.com /wechat-publish` must:

1. Accept `rawMainImages?: string[]`.
2. Upload those raw images through WeChat official server-side image APIs.
3. Replace raw inputs with WeChat-hosted image URLs before final publish.
4. Return actionable WeChat upload errors to the frontend.
