const HTML_ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export const decodeHtmlEntities = (input = '') =>
  String(input).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = String(entity).toLowerCase();
    if (normalized[0] === '#') {
      const isHex = normalized[1] === 'x';
      const rawCode = isHex ? normalized.slice(2) : normalized.slice(1);
      const parsed = parseInt(rawCode, isHex ? 16 : 10);
      if (Number.isFinite(parsed)) {
        try {
          return String.fromCodePoint(parsed);
        } catch {
          return match;
        }
      }
      return match;
    }
    return HTML_ENTITY_MAP[normalized] ?? match;
  });

export const normalizeLongformSourceText = (input = '') => {
  let text = String(input).replace(/\r\n?/g, '\n').trim();
  if (!text) return '';

  text = decodeHtmlEntities(text);

  if (/<\/?[a-z][^>]*>/i.test(text)) {
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<li\b[^>]*>/gi, '\n- ');
    text = text.replace(/<\/(p|div|section|article|blockquote|ul|ol|h[1-6]|table|tr)>/gi, '\n\n');
    text = text.replace(/<\/(td|th)>/gi, ' ');
    text = text.replace(/<[^>]+>/g, '');
  }

  text = text.replace(/\u00a0/g, ' ');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};
