import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeLongformSourceText } from '../utils/longform-text.js';

test('converts encoded html paragraphs into readable text blocks for longform generation', () => {
  const input = '&lt;p&gt;第一段&lt;/p&gt;&lt;p&gt;第二段&lt;/p&gt;';

  assert.equal(normalizeLongformSourceText(input), '第一段\n\n第二段');
});

test('preserves markdown markers while stripping html wrappers and restoring line breaks', () => {
  const input = '<p># 标题</p><p>> 引言</p><p>正文<br />第二行</p>';

  assert.equal(normalizeLongformSourceText(input), '# 标题\n\n> 引言\n\n正文\n第二行');
});
