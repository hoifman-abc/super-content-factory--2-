
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { 
  Type as TypeIcon, 
  Settings, 
  Sparkles, 
  Image as ImageIcon,
  Settings2,
  Info,
  Heading1,
  Highlighter,
  Quote,
  Palette,
  Wand2,
  AlignLeft,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layout
} from 'lucide-react';
import { CanvasRatio, RATIO_MAP, PageContent, ContentBlock, BlockType, CanvasTheme, THEME_MAP, CoverData, CanvasTemplate, TEMPLATE_MAP } from './xhs-tool/types';

type XhsLongImageToolProps = {
  ratio?: string;
  prompt?: string;
  selectedMaterialIds?: string[];
  selectedWorkIds?: string[];
  initialTitle?: string;
  initialText?: string;
};

const SONG_FONT_STACK = "'FZXiaoBiaoSong', 'Songti SC', 'Noto Serif SC', 'SimSun', serif";
const BODY_LINE_HEIGHT = 1.75;
const BLOCK_MARGIN_EM = 1.15;
const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_SITE_URL = import.meta.env.VITE_OPENROUTER_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const OPENROUTER_IMAGE_MODEL = import.meta.env.VITE_OPENROUTER_MODEL_MAP__GEMINI_2_5_FLASH_IMAGE || 'google/gemini-2.5-flash-image';
const OPENROUTER_TEXT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL_MAP__GEMINI_3_PRO || import.meta.env.VITE_OPENROUTER_MODEL_MAP__GEMINI_2_5_PRO || 'google/gemini-2.5-pro';
const OPENROUTER_LAYOUT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL_MAP__GEMINI_3_PRO || import.meta.env.VITE_OPENROUTER_MODEL_MAP__GEMINI_2_5_PRO || 'google/gemini-2.5-pro';

const callOpenRouterJson = async (prompt: string, model: string = OPENROUTER_TEXT_MODEL) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('缺少 OpenRouter Key，请在 .env.local 配置 VITE_OPENROUTER_API_KEY');

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': OPENROUTER_SITE_URL,
      'X-Title': 'Super Content Factory'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || response.statusText);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map((c: any) => c.text || '').join('\n') : (content?.toString?.() || '');
  return text.trim();
};

const parseJsonFromText = (text: string) => {
  try {
    const stripped = text
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .trim();
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return JSON.parse(stripped); // let it throw if truly invalid
    }
    const candidate = stripped.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  } catch (err) {
    console.warn('Failed to parse JSON text from model:', text);
    throw err;
  }
};

export default function App({ initialTitle, initialText }: XhsLongImageToolProps) {
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [ratio, setRatio] = useState<CanvasRatio>(CanvasRatio.RATIO_3_4);
  const [theme, setTheme] = useState<CanvasTheme>(CanvasTheme.WHITE);
  const [template, setTemplate] = useState<CanvasTemplate>(CanvasTemplate.CLASSIC);
  const [fontSize, setFontSize] = useState<number>(36);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [coverData, setCoverData] = useState<CoverData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  const measureRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number, end: number, scrollTop: number } | null>(null);

  const currentTheme = THEME_MAP[theme];
  const currentTemplate = TEMPLATE_MAP[template];
  const isMinimalTemplate = template === CanvasTemplate.MINIMAL;
  const shouldShowCover = useMemo(() => template === CanvasTemplate.CLASSIC && !!(title || coverData), [template, title, coverData]);
  const minimalInlineTitle = useMemo(() => (title || coverData?.title || '').trim(), [title, coverData]);
  const minimalTopLineColor = 'rgba(156, 163, 175, 0.5)';
  const minimalCharLineColor = 'rgba(156, 163, 175, 0.35)';

  const buildMinimalHeroHtml = useCallback((heroTitle: string) => {
    const safeTitle = heroTitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const decoratedChars = Array.from(safeTitle).map((char) => {
      if (char === '\n') return '<br />';
      if (char === ' ') return '<span style="display: inline-block; width: 0.35em;"></span>';
      return `<span style="display: inline-block; border-bottom: 9px solid ${minimalCharLineColor}; padding-bottom: 0.05em; margin-bottom: 0.08em;">${char}</span>`;
    }).join('');

    return `<div style="margin-bottom: 52px;"><div style="height: 2px; width: 100%; background: ${minimalTopLineColor}; border-radius: 9999px; margin-bottom: 34px;"></div><h1 style="font-size: ${fontSize * 2.3}px; line-height: 1.1; font-weight: 900; color: ${currentTheme.title}; margin: 0; text-align: left; word-break: break-all; font-family: ${SONG_FONT_STACK};">${decoratedChars}</h1></div>`;
  }, [currentTheme.title, fontSize, minimalCharLineColor, minimalTopLineColor]);

  const totalPreviewPages = useMemo(() => (shouldShowCover ? 1 : 0) + pages.length, [shouldShowCover, pages]);
  
  useEffect(() => {
    if (initialTitle && initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (pendingSelection.current && textareaRef.current) {
      const { start, end, scrollTop } = pendingSelection.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      textareaRef.current.scrollTop = scrollTop;
      pendingSelection.current = null;
    }
  }, [text]);

  useEffect(() => {
    if (currentPreviewIndex >= totalPreviewPages && totalPreviewPages > 0) {
      setCurrentPreviewIndex(totalPreviewPages - 1);
    }
  }, [totalPreviewPages, currentPreviewIndex]);

  const handleFormat = (type: 'title' | 'quote' | 'highlight') => {
    const el = textareaRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = text.substring(start, end);
    let newText = text;
    let newCursorPos = end;

    if (type === 'title') {
      const before = text.substring(0, start);
      const after = text.substring(end);
      const replacement = `# ${selectedText}`;
      newText = before + replacement + after;
      newCursorPos = start + replacement.length;
    } else if (type === 'quote') {
      const before = text.substring(0, start);
      const after = text.substring(end);
      const replacement = `> ${selectedText}`;
      newText = before + replacement + after;
      newCursorPos = start + replacement.length;
    } else if (type === 'highlight') {
      const before = text.substring(0, start);
      const after = text.substring(end);
      const replacement = `==${selectedText}==`;
      newText = before + replacement + after;
      newCursorPos = start + replacement.length;
    }

    pendingSelection.current = { start: newCursorPos, end: newCursorPos, scrollTop };
    setText(newText);
  };

  const renderRichText = (content: string) => {
    const parts = content.split(/(==.*?==)/g);
    return parts.map((part, i) => {
      if (part.startsWith('==') && part.endsWith('==')) {
        const innerText = part.slice(2, -2);
        const highlightBg = theme === CanvasTheme.DARK ? 'rgba(180, 83, 9, 0.4)' : 'rgba(254, 249, 195, 0.8)';
        const underlineColor = theme === CanvasTheme.DARK ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
        
        return (
          <mark 
            key={i} 
            style={{ 
              backgroundColor: highlightBg, 
              color: 'inherit',
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '4px',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              textDecorationThickness: '2px',
              textDecorationColor: underlineColor
            }} 
            className="mx-0.5"
          >
            {innerText}
          </mark>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getBlockHTML = (block: ContentBlock, fSize: number) => {
    const lineH = BODY_LINE_HEIGHT; 
    let style = `font-size: ${fSize}px; line-height: ${lineH}; margin-bottom: ${BLOCK_MARGIN_EM}em; white-space: pre-wrap; word-break: break-all; font-family: ${SONG_FONT_STACK}; font-weight: 600;`;
    const highlightBg = theme === CanvasTheme.DARK ? 'rgba(180, 83, 9, 0.4)' : 'rgba(254, 249, 195, 0.8)';
    
    let content = block.text.replace(
      /==(.*?)==/g,
      `<mark style="background-color: ${highlightBg}; color: inherit; font-weight: 900; padding: 2px 6px; border-radius: 4px; box-decoration-break: clone; -webkit-box-decoration-break: clone; text-decoration: underline; text-underline-offset: 4px;">$1</mark>`
    );
    
    if (block.type === 'title') {
      style = `font-size: ${fSize * 1.4}px; font-weight: 900; margin-bottom: ${BLOCK_MARGIN_EM}em; line-height: 1.3; font-family: ${SONG_FONT_STACK};`;
      return `<h2 style="${style}">${content}</h2>`;
    } else if (block.type === 'quote') {
      style = `font-size: ${fSize}px; border-left: 8px solid #ddd; padding-left: 30px; margin-bottom: ${BLOCK_MARGIN_EM}em; line-height: ${lineH}; font-family: ${SONG_FONT_STACK}; font-weight: 600;`;
      return `<blockquote style="${style}">${content}</blockquote>`;
    }
    return `<p style="${style}">${content}</p>`;
  };

  const paginateText = useCallback(() => {
    if (!measureRef.current) {
      setPages([]);
      return;
    }

    const config = RATIO_MAP[ratio];
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const verticalPadding = currentTemplate.hasBorder ? 320 : 280;
    const maxContentHeight = config.height - verticalPadding; 
    const shouldInjectMinimalHero = isMinimalTemplate && !!minimalInlineTitle;
    
    const allBlocks: ContentBlock[] = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) return { type: 'title', text: trimmed.replace('# ', '') };
      if (trimmed.startsWith('> ')) return { type: 'quote', text: trimmed.replace('> ', '') };
      return { type: 'paragraph', text: line };
    });

    let currentPages: PageContent[] = [];
    let currentPageBlocks: ContentBlock[] = [];
    
    const tester = measureRef.current;
    tester.style.width = `${config.width - 200}px`;
    tester.innerHTML = '';
    if (shouldInjectMinimalHero) {
      const intro = document.createElement('div');
      intro.innerHTML = buildMinimalHeroHtml(minimalInlineTitle);
      tester.appendChild(intro);
    }

    for (const block of allBlocks) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = getBlockHTML(block, fontSize);
      const blockEl = tempDiv.firstElementChild as HTMLElement;
      if (!blockEl) continue; 
      tester.appendChild(blockEl);
      
      if (tester.offsetHeight > maxContentHeight) {
        if (currentPageBlocks.length > 0) {
          currentPages.push({ blocks: [...currentPageBlocks], pageIndex: currentPages.length });
          currentPageBlocks = [block];
          tester.innerHTML = '';
          const newBlockEl = blockEl.cloneNode(true) as HTMLElement;
          tester.appendChild(newBlockEl);
        } else {
          currentPages.push({ blocks: [block], pageIndex: currentPages.length });
          currentPageBlocks = [];
          tester.innerHTML = '';
        }
      } else {
        currentPageBlocks.push(block);
      }
    }

    if (currentPageBlocks.length > 0) {
      currentPages.push({ blocks: currentPageBlocks, pageIndex: currentPages.length });
    } else if (currentPages.length === 0 && shouldInjectMinimalHero) {
      currentPages.push({ blocks: [], pageIndex: 0 });
    }
    setPages(currentPages);
  }, [text, ratio, fontSize, theme, template, isMinimalTemplate, minimalInlineTitle, buildMinimalHeroHtml]);

  useEffect(() => {
    paginateText();
  }, [paginateText]);

  const normalizeFormattedBody = (value: string) => value
    .replace(/\r/g, '')
    .replace(/^#\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/==/g, '')
    .replace(/[ \t\n]/g, '');

  const applySentenceLineBreaks = (value: string) => {
    const punctuations = new Set(['。', '！', '？', '；', '!', '?', ';']);
    const closers = new Set(['”', '’', '」', '』', '】', '）', ')', '》', '〉']);
    const chars = Array.from(value.replace(/\r/g, ''));
    let result = '';

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      result += ch;
      if (!punctuations.has(ch)) continue;

      let j = i + 1;
      while (j < chars.length && closers.has(chars[j])) {
        result += chars[j];
        i = j;
        j += 1;
      }

      // Keep highlight syntax intact: avoid inserting newline between punctuation and nearby "==".
      let k = j;
      while (k < chars.length && (chars[k] === ' ' || chars[k] === '\t')) {
        k += 1;
      }
      if (k + 1 < chars.length && chars[k] === '=' && chars[k + 1] === '=') {
        while (j < k) {
          result += chars[j];
          i = j;
          j += 1;
        }
        result += '==';
        i = k + 1;
        j = k + 2;
        while (j + 1 < chars.length && chars[j] === '=' && chars[j + 1] === '=') {
          result += '==';
          i = j + 1;
          j += 2;
        }
      }

      if (j < chars.length && chars[j] !== '\n') {
        result += '\n';
      }
    }

    return result;
  };

  const normalizeHighlightSyntax = (value: string) => {
    let text = value.replace(/\r/g, '');

    // Balance delimiters: if odd number of "==", drop the last dangling token.
    const tokenMatches = Array.from(text.matchAll(/==/g));
    if (tokenMatches.length % 2 === 1) {
      const last = tokenMatches[tokenMatches.length - 1];
      const idx = last.index ?? -1;
      if (idx >= 0) {
        text = `${text.slice(0, idx)}${text.slice(idx + 2)}`;
      }
    }

    // Split multiline highlights into per-line highlights so renderer can parse them reliably.
    text = text.replace(/==([\s\S]*?)==/g, (_, inner: string) => {
      if (!inner.includes('\n')) return `==${inner}==`;
      return inner
        .split('\n')
        .map((part) => {
          const trimmed = part.trim();
          return trimmed ? `==${trimmed}==` : '';
        })
        .join('\n');
    });

    return text;
  };

  const applySentenceLineBreaksSafely = (value: string) => {
    const normalized = normalizeHighlightSyntax(value);
    const parts = normalized.split(/(==[^=\n]*==)/g);
    return parts
      .map((part) => (/^==[^=\n]*==$/.test(part) ? part : applySentenceLineBreaks(part)))
      .join('');
  };

  const preferHighlightsOverQuotes = (value: string) => {
    let quoteCount = 0;
    return value
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('> ')) return line;
        quoteCount += 1;
        if (quoteCount <= 1) return line;
        const quoteContent = trimmed.replace(/^>\s*/, '').trim();
        return quoteContent ? `==${quoteContent}==` : '';
      })
      .join('\n');
  };

  const enhanceHighlightPhrases = (value: string) => {
    // Avoid overly fragmented highlights like 2-3 characters.
    let updated = value.replace(/==([^=\n]{1,3})==/g, '$1');
    const lines = updated.split('\n');
    const emotionHints = ['别怕', '放心', '正常', '真诚', '勇敢', '坦诚', '不完美', '我想告诉你', '我想说', '我会', '我决定', '必杀技'];
    const existingHighlights = (updated.match(/==[^=\n]+==/g) || []).length;
    let autoBudget = Math.max(0, 4 - existingHighlights);

    updated = lines.map((line) => {
      if (autoBudget <= 0) return line;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('# ') || trimmed.startsWith('> ') || /==[^=\n]+==/.test(trimmed)) return line;

      const content = trimmed.replace(/^[\-*]\s*/, '');
      const len = content.replace(/\s/g, '').length;
      const sentenceLike = /[。！？!?]$/.test(content);
      const hasEmotion = emotionHints.some((hint) => content.includes(hint));
      const hasIntent = /我(想|会|要|希望|决定|相信|告诉你)/.test(content);

      if (sentenceLike && len >= 8 && len <= 30 && (hasEmotion || hasIntent)) {
        autoBudget -= 1;
        return `==${trimmed}==`;
      }
      return line;
    }).join('\n');

    return updated;
  };

  const optimizeText = async () => {
    if (!text.trim()) return;
    setIsOptimizing(true);
    try {
      const formatPrompt = `你是中文内容排版编辑。请只对下列正文做“排版标注”，禁止改写内容。

正文原文：
${text}

硬性规则（必须全部满足）：
1. 不得新增、删除、改写任何原文字符与标点。
2. 仅允许做三种排版标记：行首 "# "（标题）、行首 "> "（引用）、以及 "==关键短句或关键词=="（高亮）。
3. 可以通过换行把大段拆成更易读的短段落，尽量在句号、问号、感叹号、分号后换行。
4. “第一/第二/第三、1./2./3.、一是/二是/三是”等层次句，优先处理为标题。
5. 优先使用高亮而不是引用；全篇引用最多 1 条，其余重点内容请用高亮。高亮优先“短句级”而不是2-3字词级，例如“别怕，把背挺直了。/我想告诉你，这都很正常。/真诚才是必杀技。”这类完整短句更优先。
6. 不要新增 Emoji，不要新增解释，不要输出任何多余说明。

输出格式严格为：
[NEW_BODY]
<排版后的正文>`;

      const content = await callOpenRouterJson(formatPrompt, OPENROUTER_LAYOUT_MODEL);
      let newBody = (content.match(/\[NEW_BODY\]\s*([\s\S]*)/)?.[1] || '').trim();

      const sourceNormalized = normalizeFormattedBody(text);
      let resultNormalized = normalizeFormattedBody(newBody);

      if (!newBody || sourceNormalized !== resultNormalized) {
        const repairPrompt = `你上一次结果没有满足“原文字符与标点完全不变”的硬性约束。请修复。

原文：
${text}

你的上一次结果：
${newBody || '[空]'}

再次强调：
1. 原文字符和标点必须100%保留。
2. 你只能添加 "# "、"> "、"==" 和换行。
3. 不要输出任何解释。

输出格式严格为：
[NEW_BODY]
<修复后的正文>`;
        const repaired = await callOpenRouterJson(repairPrompt, OPENROUTER_LAYOUT_MODEL);
        newBody = (repaired.match(/\[NEW_BODY\]\s*([\s\S]*)/)?.[1] || '').trim();
        resultNormalized = normalizeFormattedBody(newBody);
      }

      if (!newBody || sourceNormalized !== resultNormalized) {
        alert('AI 排版结果包含内容改动，已取消应用。请重试。');
        return;
      }

      const quoteAdjusted = preferHighlightsOverQuotes(newBody);
      const highlightEnhanced = enhanceHighlightPhrases(quoteAdjusted);
      setText(applySentenceLineBreaksSafely(highlightEnhanced));
    } catch (err) {
      alert("AI 排版润色失败");
    } finally {
      setIsOptimizing(false);
    }
  };

const generateImageViaOpenRouter = async (prompt: string, canvasRatio: CanvasRatio) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('缺少 OpenRouter Key，请在 .env.local 配置 VITE_OPENROUTER_API_KEY');

  const aspect = canvasRatio === CanvasRatio.RATIO_1_1 ? '1:1' : canvasRatio === CanvasRatio.RATIO_9_16 ? '9:16' : '3:4';
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': 'Super Content Factory'
      },
      body: JSON.stringify({
        model: OPENROUTER_IMAGE_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${prompt}\n\nAspect Ratio: ${aspect}` }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`生成封面失败：${errorText || response.statusText}`);
    }

  const data: any = await response.json();
  const parts = data?.choices?.[0]?.message?.content;
  let imageUrl = '';

  if (Array.isArray(parts)) {
    const imagePart = parts.find((p: any) => p?.type === 'image_url' && p?.image_url?.url);
    if (imagePart?.image_url?.url) {
      imageUrl = imagePart.image_url.url;
    } else {
      const textBase64 = parts.map((p: any) => p?.text || '').join('\n');
      const base64Match = textBase64.match(/data:image\/[a-zA-Z0-9+]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match?.[0]) {
        imageUrl = base64Match[0];
      } else {
        const nakedBase64 = textBase64.match(/^[A-Za-z0-9+/=]{100,}$/m);
        if (nakedBase64?.[0]) imageUrl = `data:image/png;base64,${nakedBase64[0]}`;
      }
    }
  } else if (typeof parts === 'string') {
    const textBase64 = parts;
    const base64Match = textBase64.match(/data:image\/[a-zA-Z0-9+]+;base64,[A-Za-z0-9+/=]+/);
    if (base64Match?.[0]) {
      imageUrl = base64Match[0];
    } else {
      const nakedBase64 = textBase64.match(/^[A-Za-z0-9+/=]{100,}$/m);
      if (nakedBase64?.[0]) imageUrl = `data:image/png;base64,${nakedBase64[0]}`;
    }
  }

  // 更多回退：尝试从 b64_json 或整体字符串中提取
  if (!imageUrl) {
    const asString = JSON.stringify(data);
    const dataUriMatch = asString.match(/data:image\/[a-zA-Z0-9+]+;base64,[A-Za-z0-9+/=]+/);
    if (dataUriMatch?.[0]) {
      imageUrl = dataUriMatch[0];
    } else {
      const b64JsonMatch = asString.match(/\"b64_json\"\\s*:\\s*\"([^\"]+)\"/);
      if (b64JsonMatch?.[1]) {
        imageUrl = `data:image/png;base64,${b64JsonMatch[1]}`;
      }
    }
  }

  if (!imageUrl) {
    console.warn('OpenRouter image raw response:', data);
    throw new Error('OpenRouter 返回结果中没有图片数据');
  }
  return imageUrl.startsWith('data:') ? imageUrl : `data:image/png;base64,${imageUrl}`;
};

  const generateCover = async () => {
    if (!text && !title) return;
    setIsGeneratingCover(true);
    try {
      const textResponse = await callOpenRouterJson(
        `你是一位顶级视觉创意总监。请深度阅读以下文章，并返回严格的 JSON：
{
  "abstract": "一句 30 字内摘要",
  "visualConcept": "核心叙事概念",
  "keyElements": ["元素1","元素2","元素3"],
  "visualStyle": "realistic 或 flat-illustration 或 hybrid",
  "imagePrompt": "英文绘图提示词（含场景/人物/道具/光线描述，偏向人与人互动的构图）"
}

要求：
1. keyElements 需结合正文要素（如公考→考场/教学/答题等），3-6 个。
2. visualStyle 在写实与平面动画间切换或混合，且仅输出以上三种枚举值。
3. imagePrompt 要包含要素，强调故事感和光影深度，场景优先为【两到三人互动/交流/辅导/答题】构图，避免空场景，严禁出现文字/LOGO/字母。

文章标题：${title}
正文内容：${text.substring(0, 1000)}`
      );

      const data = parseJsonFromText(textResponse || '{}');
      const elements = Array.isArray(data.keyElements) ? data.keyElements.filter((e: string) => !!e).join(', ') : '';
      const styleHint = (data.visualStyle || '').toLowerCase();
      const stylePrompt = styleHint.includes('flat') ? 'Flat illustration with clean shapes and balanced color blocks' : styleHint.includes('hybrid') ? 'Semi-realistic with gentle illustrative accents' : 'Photorealistic with cinematic depth-of-field';
      const refStyle = 'Clean, bright workplace/classroom/interview composition; balanced framing; calm mood; no horror or gore.';
      const interactionBias = 'Prefer 2-3 people interacting/teaching/interviewing together rather than empty rooms.';
      const finalPrompt = `${stylePrompt}. Core elements: ${elements || 'main topic'}. ${data.imagePrompt}. ${refStyle} ${interactionBias} All humans have East Asian (Chinese) facial features. Rich cinematic lighting, emotional atmosphere, high detail, NO TEXT, NO LOGO, NO LETTERS.`;
      const base64Image = await generateImageViaOpenRouter(finalPrompt, ratio);

      setCoverData({
        title: title || '未命名标题',
        abstract: data.abstract,
        imageUrl: base64Image,
        imagePrompt: finalPrompt,
        // 保存上下文用于重绘
        originalContext: { title, text, previousConcept: data.visualConcept, previousElements: Array.isArray(data.keyElements) ? data.keyElements : [], previousStyle: data.visualStyle }
      } as any);
    } catch (err) {
      console.error(err);
      alert("AI 封面生成失败");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const regenerateCoverImage = async () => {
    if (!coverData) return;
    setIsRegeneratingImage(true);
    try {
      const context = (coverData as any).originalContext;
      
      // 用户点击重绘说明对上个方案不满意，要求重新思考视觉切入点
      const textResponse = await callOpenRouterJson(
        `用户不满意之前的视觉创意（之前的创意是：${context?.previousConcept || '未知'}，之前的要素：${(context?.previousElements || []).join('、') || '无'}）。
请你作为创意总监，跳出之前的框架，生成一个截然不同的新叙事场景，并返回严格 JSON：
{
  "visualConcept": "新的叙事概念",
  "keyElements": ["元素1","元素2","元素3"],
  "visualStyle": "realistic 或 flat-illustration 或 hybrid",
  "imagePrompt": "英文绘图提示词（含场景/人物/道具/光线描述，偏向人与人互动的构图）"
}

要求：
1. 依然与文章高度相关，具有代入感。
2. 避免重复使用上一次要素：${(context?.previousElements || []).join('、') || '无'}。
3. 3-6 个新要素；风格从枚举里选；提示词包含要素，强调【两到三人互动/交流/辅导/答题】的构图，避免空场景，严禁出现文字/LOGO/字母。

文章标题：${context?.title}
正文参考：${context?.text?.substring(0, 500)}`
      );

      const data = parseJsonFromText(textResponse || '{}');
      const elements = Array.isArray(data.keyElements) ? data.keyElements.filter((e: string) => !!e).join(', ') : '';
      const styleHint = (data.visualStyle || '').toLowerCase();
      const stylePrompt = styleHint.includes('flat') ? 'Flat illustration with clean shapes and balanced color blocks' : styleHint.includes('hybrid') ? 'Semi-realistic with gentle illustrative accents' : 'Photorealistic with cinematic depth-of-field';
      const refStyle = 'Clean, bright workplace/classroom/interview composition; balanced framing; calm mood; no horror or gore.';
      const interactionBias = 'Prefer 2-3 people interacting/teaching/interviewing together rather than empty rooms.';
      const finalPrompt = `${stylePrompt}. Core elements: ${elements || 'main topic'} (avoid previous scene elements). ${data.imagePrompt}. ${refStyle} ${interactionBias} All humans have East Asian (Chinese) facial features. Dramatic cinematic lighting, emotional narrative feel, high detail, NO TEXT, NO LOGO, NO LETTERS.`;
      const base64Image = await generateImageViaOpenRouter(finalPrompt, ratio);

      setCoverData({ 
        ...coverData, 
        imageUrl: base64Image, 
        imagePrompt: finalPrompt,
        originalContext: { ...context, previousConcept: data.visualConcept, previousElements: Array.isArray(data.keyElements) ? data.keyElements : [], previousStyle: data.visualStyle }
      } as any);
    } catch (err) {
      console.error(err);
      alert("图片重塑失败，请重试");
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const renderAllPagesToImages = useCallback(async (pixelRatio: number = 2) => {
    if (pages.length === 0 && !title) return [];
    const shouldRenderCover = template === CanvasTemplate.CLASSIC && !!(title || coverData);
    const rendered: { fileName: string; dataUrl: string }[] = [];
    const captureOptions = {
      pixelRatio,
      backgroundColor: currentTheme.bg,
      skipFonts: true,
      cacheBust: true,
      style: { transform: 'scale(1)', margin: '0', padding: '0' }
    };

    if (shouldRenderCover) {
      const coverEl = document.getElementById('page-cover');
      if (coverEl) {
        const dataUrl = await toPng(coverEl, captureOptions);
        rendered.push({ fileName: 'xhs_page_1_cover.png', dataUrl });
      }
    }

    for (let i = 0; i < pages.length; i++) {
      const element = document.getElementById(`page-${i}`);
      if (element) {
        const dataUrl = await toPng(element, captureOptions);
        rendered.push({ fileName: `xhs_page_${shouldRenderCover ? i + 2 : i + 1}.png`, dataUrl });
      }
    }
    return rendered;
  }, [pages, title, coverData, currentTheme.bg, template]);

  const exportAll = async () => {
    setIsProcessing(true);
    try {
      const renderedImages = await renderAllPagesToImages();
      if (renderedImages.length === 0) return;
      const zip = new JSZip();
      renderedImages.forEach(img => {
        zip.file(img.fileName, img.dataUrl.split(',')[1], { base64: true });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `小红书图文_${new Date().getTime()}.zip`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("导出失败");
    } finally {
      setIsProcessing(false);
    }
  };
  
  useEffect(() => {
    const handleDownload = () => exportAll();
    window.addEventListener('xhs-longimage-download', handleDownload);
    return () => window.removeEventListener('xhs-longimage-download', handleDownload);
  }, [exportAll]);

  useEffect(() => {
    const handleSave = async (evt: Event) => {
      const event = evt as CustomEvent<{ onSave?: (payload: { title?: string; text?: string; images: string[]; coverImage?: string }) => void; onError?: (msg?: string) => void }>;
      try {
        // 使用默认高清渲染，保证保存的图片清晰度（与导出一致）
        const renderedImages = await renderAllPagesToImages(2);
        if (renderedImages.length === 0) {
          event.detail?.onError?.('暂无可保存的图片');
          return;
        }
        const images = renderedImages.map(img => img.dataUrl);
        event.detail?.onSave?.({
          title,
          text,
          images,
          coverImage: shouldShowCover && coverData?.imageUrl ? coverData.imageUrl : images[0],
        });
      } catch (error) {
        console.error(error);
        event.detail?.onError?.('保存图片失败，请重试');
      }
    };

    window.addEventListener('xhs-longimage-save', handleSave as EventListener);
    return () => window.removeEventListener('xhs-longimage-save', handleSave as EventListener);
  }, [renderAllPagesToImages, title, text, coverData, shouldShowCover]);

  const PageDecoration = ({ pageNum }: { pageNum: string }) => {
    return (
      <>
        {currentTemplate.headerStyle !== 'none' && (
          <header className="h-16 flex items-center px-[100px] justify-between">
            {currentTemplate.headerStyle === 'line' && <div className="h-0.5 flex-1 bg-current opacity-10" style={{ color: currentTheme.text }} />}
            {currentTemplate.headerStyle === 'dot' && <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><div className="w-2 h-2 rounded-full bg-red-500/30" /></div>}
            <span className="ml-4 text-[10px] font-black tracking-widest uppercase opacity-30" style={{ color: currentTheme.text }}>
              {title || 'PRODUCTION TOOL'}
            </span>
          </header>
        )}
        {currentTemplate.hasBorder && (
          <div className="absolute inset-8 pointer-events-none border-4 opacity-10" style={{ borderColor: currentTheme.text }} />
        )}
        <footer className={`h-24 px-[100px] flex items-center border-t-2 ${currentTemplate.footerStyle === 'center' ? 'justify-center' : 'justify-between'}`} style={{ borderColor: currentTheme.footerPage }}>
          {currentTemplate.footerStyle === 'side' && (
            <div className="text-[14px] font-bold tracking-[0.2em] uppercase truncate max-w-[70%]" style={{ color: currentTheme.quote }}>
              {title || 'CONTENT ARCHITECTURE'}
            </div>
          )}
          <div className={`${currentTemplate.footerStyle === 'center' ? 'text-[24px]' : 'text-[56px]'} font-black leading-none opacity-20 flex-shrink-0`} style={{ color: currentTheme.text }}>
            {pageNum}
          </div>
        </footer>
      </>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-[#F2F4F7] text-gray-900 overflow-hidden" style={{ fontFamily: SONG_FONT_STACK }}>
      <aside className="h-full w-full md:w-[420px] bg-white border-r border-gray-200 px-5 pt-2 pb-4 flex flex-col gap-3 overflow-y-auto z-20 shadow-xl">
        <section className="space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-4 focus:ring-red-500/5 outline-none text-base font-bold transition-all placeholder:text-gray-300"
              placeholder="请输入引人入胜的标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 tracking-[0.2em]">
              <FileText className="w-3 h-3 text-red-500" /> 正文排版内容
            </label>

            <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-100 rounded-t-2xl">
              <button onClick={() => handleFormat('title')} className="flex-1 py-2 text-[10px] font-black text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all flex items-center justify-center gap-1 uppercase"><Heading1 className="w-3 h-3"/>内文标题</button>
              <button onClick={() => handleFormat('highlight')} className="flex-1 py-2 text-[10px] font-black text-gray-400 hover:text-yellow-600 hover:bg-white rounded-lg transition-all flex items-center justify-center gap-1 uppercase"><Highlighter className="w-3 h-3"/>高亮</button>
              <button onClick={() => handleFormat('quote')} className="flex-1 py-2 text-[10px] font-black text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-all flex items-center justify-center gap-1 uppercase"><Quote className="w-3 h-3"/>引用</button>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full h-44 p-5 border border-gray-100 bg-gray-50 rounded-b-2xl focus:ring-4 focus:ring-red-500/5 outline-none text-sm font-medium transition-all"
              placeholder="在此输入您的长文章内容..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={optimizeText}
                disabled={isOptimizing || (!text && !title)}
                className="py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-30 uppercase tracking-widest"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                AI 排版润色
              </button>
              <button
                onClick={generateCover}
                disabled={isGeneratingCover || (!text && !title)}
                className="py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-30 shadow-lg shadow-indigo-100 uppercase tracking-widest"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isGeneratingCover ? 'animate-spin' : ''}`} />
                生成 AI 封面
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"><Layout className="w-3 h-3" /> 排版模板</div>
            <div className="flex gap-2">
              {[CanvasTemplate.CLASSIC, CanvasTemplate.MINIMAL, CanvasTemplate.MAGAZINE].map((temp) => (
                <button 
                  key={temp} 
                  onClick={() => setTemplate(temp)} 
                  className={`flex-1 py-1.5 px-3 text-[10px] rounded-xl border-2 font-black uppercase transition-all ${template === temp ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                >
                  {TEMPLATE_MAP[temp].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"><Palette className="w-3 h-3" /> 设计配色</div>
            <div className="flex items-center gap-2">
              {(Object.keys(THEME_MAP) as CanvasTheme[]).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setTheme(t)} 
                  title={THEME_MAP[t].label}
                  className={`relative w-7 h-7 rounded-full border-2 transition-all p-0 ${theme === t ? 'border-red-500 scale-105 shadow-md ring-2 ring-red-500/10' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="w-full h-full rounded-full border border-black/5" style={{ backgroundColor: THEME_MAP[t].bg }} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"><Settings2 className="w-3 h-3" /> 尺寸与字号</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(RATIO_MAP) as CanvasRatio[]).map((r) => (
                <button key={r} onClick={() => setRatio(r)} className={`py-1.5 px-3 text-[10px] rounded-xl border-2 font-black uppercase ${ratio === r ? 'border-red-500 bg-red-50 text-red-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                  {RATIO_MAP[r].label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">排版字号</span><span className="text-sm font-black text-red-500">{fontSize}PX</span></div>
              <input type="range" min="24" max="60" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
          </div>

        </section>
      </aside>

      <main className="flex-1 relative flex flex-col items-center justify-start bg-[#F8F9FB] overflow-hidden p-6">
        {!shouldShowCover && pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center opacity-20 max-w-sm">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6"><TypeIcon className="w-12 h-12 text-gray-400" /></div>
            <h3 className="text-xl font-black mb-2">排版大师为您服务</h3>
            <p className="text-xs font-medium">在左侧输入内容，我们将为您自动生成符合小红书风格的多页文字卡片。</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-start p-6 select-none overflow-hidden" style={{ perspective: '1200px' }}>
            {totalPreviewPages > 1 && (
              <>
                <button 
                  onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPreviewIndex === 0}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/95 backdrop-blur-xl rounded-full shadow-xl border border-gray-100 text-gray-500 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setCurrentPreviewIndex(prev => Math.min(totalPreviewPages - 1, prev + 1))}
                  disabled={currentPreviewIndex === totalPreviewPages - 1}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/95 backdrop-blur-xl rounded-full shadow-xl border border-gray-100 text-gray-500 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              <div 
                className="flex h-full will-change-transform"
                style={{ 
                  transform: `translateX(-${currentPreviewIndex * 100}%)`,
                  width: `${totalPreviewPages * 100}%`,
                  transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {shouldShowCover && (
                  <div className="w-full flex-shrink-0 flex items-center justify-center h-full">
                    <div 
                      className="flex flex-col items-center gap-6 will-change-[transform,opacity]"
                      style={{ 
                        transform: currentPreviewIndex === 0 ? 'scale(1)' : 'scale(0.9)',
                        opacity: currentPreviewIndex === 0 ? 1 : 0.3,
                        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
                      }}
                    >
                      <span className="text-[10px] font-black text-red-500 tracking-[0.4em] uppercase bg-red-50 px-4 py-1.5 rounded-full shadow-sm">Cover Layout</span>
                      <div 
                        className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden rounded-sm bg-white"
                        style={{ width: `${RATIO_MAP[ratio].width * 0.45}px`, height: `${RATIO_MAP[ratio].height * 0.45}px` }}
                      >
                        <div id="page-cover" style={{ width: `${RATIO_MAP[ratio].width}px`, height: `${RATIO_MAP[ratio].height}px`, backgroundColor: currentTheme.bg, transform: 'scale(0.45)', transformOrigin: 'top left', display: 'flex', flexDirection: 'column', fontFamily: SONG_FONT_STACK, position: 'relative' }}>
                          <div className="flex flex-col h-full w-full">
                            <div 
                              className={`h-[42%] w-full overflow-hidden relative border-b-8 border-black/5 bg-gray-50 flex items-center justify-center group cursor-pointer transition-all ${isRegeneratingImage ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={regenerateCoverImage}
                            >
                              {coverData?.imageUrl ? (
                                <img src={coverData.imageUrl} alt="AI Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              ) : (
                                <div className="text-gray-200 flex flex-col items-center gap-4">
                                  <ImageIcon className="w-24 h-24" />
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Waiting for Image...</p>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="flex flex-col items-center gap-2">
                                  <RefreshCw className={`w-10 h-10 text-white ${isRegeneratingImage ? 'animate-spin' : ''}`} />
                                  <span className="text-white text-xs font-black uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">换个创意方向</span>
                                </div>
                              </div>
                              {isRegeneratingImage && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                  <div className="w-12 h-12 border-[6px] border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                            <div className="h-[58%] w-full px-[100px] py-[80px] flex flex-col justify-start overflow-hidden">
                              <h1 style={{ fontSize: `${fontSize * 2.3}px`, lineHeight: 1.1, fontWeight: 900, color: currentTheme.title, marginBottom: '60px', textAlign: 'left', wordBreak: 'break-all', fontFamily: SONG_FONT_STACK }}>
                                {title || coverData?.title || '未命名标题'}
                              </h1>
                              <div style={{ maxHeight: '400px', overflow: 'hidden' }}>
                                <blockquote style={{ 
                                  fontSize: `${fontSize * 0.95}px`,
                                  color: currentTheme.quote, 
                                  borderLeft: `16px solid ${currentTheme.quoteBorder}`, 
                                  paddingLeft: '44px', 
                                  lineHeight: 1.9,
                                  fontStyle: 'normal',
                                  fontFamily: SONG_FONT_STACK,
                                  fontWeight: 600
                                }}>
                                  {coverData?.abstract || '等待生成摘要...'}
                                </blockquote>
                              </div>
                            </div>
                          </div>
                          <PageDecoration pageNum="01" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {pages.map((page, index) => {
                  const slideIndex = shouldShowCover ? index + 1 : index;
                  const isActive = currentPreviewIndex === slideIndex;
                  const pageDisplayNum = (shouldShowCover ? 2 : 1) + index;
                  const pageNumStr = pageDisplayNum < 10 ? `0${pageDisplayNum}` : `${pageDisplayNum}`;
                  
                  return (
                    <div key={index} className="w-full flex-shrink-0 flex items-center justify-center h-full">
                      <div 
                        className="flex flex-col items-center gap-6 will-change-[transform,opacity]"
                        style={{ 
                          transform: isActive ? 'scale(1)' : 'scale(0.9)',
                          opacity: isActive ? 1 : 0.3,
                          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
                        }}
                      >
                        <div 
                          className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden rounded-sm bg-white"
                          style={{ width: `${RATIO_MAP[ratio].width * 0.45}px`, height: `${RATIO_MAP[ratio].height * 0.45}px` }}
                        >
                          <div id={`page-${index}`} style={{ width: `${RATIO_MAP[ratio].width}px`, height: `${RATIO_MAP[ratio].height}px`, backgroundColor: currentTheme.bg, transform: 'scale(0.45)', transformOrigin: 'top left', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div className="flex-1 px-[100px] py-[100px]">
                              {isMinimalTemplate && index === 0 && minimalInlineTitle && (
                                <div style={{ marginBottom: '52px' }}>
                                  <div style={{ height: '2px', width: '100%', background: minimalTopLineColor, borderRadius: '9999px', marginBottom: '34px' }} />
                                  <h1 style={{ fontSize: `${fontSize * 2.3}px`, lineHeight: 1.1, fontWeight: 900, color: currentTheme.title, margin: 0, textAlign: 'left', wordBreak: 'break-all', fontFamily: SONG_FONT_STACK }}>
                                    {Array.from(minimalInlineTitle).map((char, charIdx) => {
                                      if (char === '\n') return <br key={`minimal-title-br-${charIdx}`} />;
                                      if (char === ' ') {
                                        return <span key={`minimal-title-space-${charIdx}`} style={{ display: 'inline-block', width: '0.35em' }} />;
                                      }
                                      return (
                                        <span
                                          key={`minimal-title-char-${charIdx}`}
                                          style={{
                                            display: 'inline-block',
                                            borderBottom: `9px solid ${minimalCharLineColor}`,
                                            paddingBottom: '0.05em',
                                            marginBottom: '0.08em'
                                          }}
                                        >
                                          {char}
                                        </span>
                                      );
                                    })}
                                  </h1>
                                </div>
                              )}
                              {page.blocks.map((block, bIdx) => (
                                <div key={bIdx} style={{ 
                                  fontSize: `${fontSize * (block.type === 'title' ? 1.4 : 1)}px`,
                                  fontWeight: block.type === 'title' ? 900 : 600,
                                  lineHeight: block.type === 'title' ? 1.3 : BODY_LINE_HEIGHT,
                                  marginBottom: `${BLOCK_MARGIN_EM}em`,
                                  color: block.type === 'title' ? currentTheme.title : block.type === 'quote' ? currentTheme.quote : currentTheme.text,
                                  borderLeft: block.type === 'quote' ? `10px solid ${currentTheme.quoteBorder}` : 'none',
                                  paddingLeft: block.type === 'quote' ? '40px' : '0',
                                  textAlign: 'justify',
                                  fontFamily: SONG_FONT_STACK
                                }}>
                                  {renderRichText(block.text)}
                                </div>
                              ))}
                            </div>
                            <PageDecoration pageNum={pageNumStr} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 flex flex-col items-center gap-3">
              <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Preview Frame</span>
                <span className="text-sm font-black text-red-500 tabular-nums">{currentPreviewIndex + 1} <span className="text-gray-200">/</span> {totalPreviewPages}</span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: totalPreviewPages }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPreviewIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${currentPreviewIndex === i ? 'w-10 bg-red-500 shadow-lg shadow-red-200' : 'w-2.5 bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <div ref={measureRef} style={{ position: 'absolute', visibility: 'hidden', top: '-9999px', height: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }} />
    </div>
  );
}


