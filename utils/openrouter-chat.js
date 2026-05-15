export const isAbortError = (error) => {
  if (!error) return false;
  if (error.name === 'AbortError' || error.code === 'ABORT_ERR') return true;

  const message = String(error?.message || error).toLowerCase();
  return message.includes('aborterror') || message.includes('aborted');
};

export const requestOpenRouterChat = async ({
  apiKey,
  baseUrl,
  siteUrl,
  model,
  messages,
  signal,
  fetchImpl = fetch,
  title = 'Super Content Factory',
}) => {
  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': title,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = '';
    try {
      const parsed = JSON.parse(errorText);
      parsedMessage =
        parsed?.error?.message ||
        parsed?.message ||
        '';
    } catch {
      parsedMessage = '';
    }

    if (response.status === 402) {
      throw new Error(
        `OpenRouter billing error: insufficient credits or paid-model access required. Please top up or switch to an available free model.${parsedMessage ? ` (${parsedMessage})` : ''}`
      );
    }
    if (response.status === 401) {
      throw new Error(`OpenRouter auth failed. Check VITE_OPENROUTER_API_KEY in .env.local.${parsedMessage ? ` (${parsedMessage})` : ''}`);
    }
    if (response.status === 429) {
      throw new Error(`OpenRouter rate limited the request. Please retry later or switch model.${parsedMessage ? ` (${parsedMessage})` : ''}`);
    }

    throw new Error(`OpenRouter API error ${response.status}: ${parsedMessage || errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }
  return content.trim();
};
