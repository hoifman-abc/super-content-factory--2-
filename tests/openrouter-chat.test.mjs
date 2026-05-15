import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAbortError,
  requestOpenRouterChat,
} from '../utils/openrouter-chat.js';

test('requestOpenRouterChat forwards AbortSignal to fetch and trims content', async () => {
  const controller = new AbortController();
  let capturedInit = null;

  const content = await requestOpenRouterChat({
    apiKey: 'test-key',
    baseUrl: 'https://openrouter.ai/api/v1',
    siteUrl: 'https://example.com',
    model: 'openai/test-model',
    messages: [{ role: 'user', content: 'hello' }],
    signal: controller.signal,
    fetchImpl: async (_input, init) => {
      capturedInit = init;
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '  stopped requests should not leak errors  ',
              },
            },
          ],
        }),
      };
    },
  });

  assert.equal(content, 'stopped requests should not leak errors');
  assert.equal(capturedInit?.signal, controller.signal);
  assert.equal(capturedInit?.method, 'POST');
});

test('isAbortError returns true for aborted requests and false for ordinary failures', () => {
  const abortError = new DOMException('The operation was aborted.', 'AbortError');
  const normalError = new Error('OpenRouter API error 500: boom');

  assert.equal(isAbortError(abortError), true);
  assert.equal(isAbortError(normalError), false);
});
