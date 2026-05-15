import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWorkFromMaterial,
  findWorkBySourceMaterialId,
} from '../utils/material-to-work.js';

test('buildWorkFromMaterial preserves the source material type and reusable fields', () => {
  const material = {
    id: 'mat-1',
    type: 'video',
    title: 'Interview playback',
    content: 'A full interview transcript.',
    sourceUrl: 'https://example.com/interview',
    imageUrl: 'https://example.com/cover.jpg',
    mediaUrl: 'https://example.com/interview.mp4',
    images: ['https://example.com/cover.jpg'],
  };

  const work = buildWorkFromMaterial(material, {
    nowLabel: 'Just now',
    createId: () => 'work-123',
  });

  assert.deepEqual(work, {
    id: 'work-123',
    title: 'Interview playback',
    type: 'video',
    date: 'Just now',
    content: 'A full interview transcript.',
    preview: 'A full interview transcript.',
    imageUrl: 'https://example.com/cover.jpg',
    mediaUrl: 'https://example.com/interview.mp4',
    images: ['https://example.com/cover.jpg'],
    sourceUrl: 'https://example.com/interview',
    sourceMaterialId: 'mat-1',
  });
});

test('buildWorkFromMaterial derives a compact preview when the material has only long content', () => {
  const longText = 'x'.repeat(120);

  const work = buildWorkFromMaterial({
    id: 'mat-2',
    type: 'pdf',
    title: 'Whitepaper',
    content: longText,
  }, {
    createId: () => 'work-456',
  });

  assert.equal(work.preview, `${'x'.repeat(100)}...`);
});

test('findWorkBySourceMaterialId returns the existing converted work for duplicate detection', () => {
  const works = [
    { id: 'w1', title: 'Legacy', type: 'Doc' },
    { id: 'w2', title: 'Converted', type: 'pdf', sourceMaterialId: 'mat-9' },
  ];

  assert.deepEqual(findWorkBySourceMaterialId(works, 'mat-9'), works[1]);
  assert.equal(findWorkBySourceMaterialId(works, 'missing'), undefined);
});
