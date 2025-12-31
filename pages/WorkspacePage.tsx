import React, { useState, useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// React 19 移除了默认导出的 findDOMNode，react-quill 仍在调用它，这里做一次兼容填补。
// 仅用于获取编辑区域的实际 DOM 节点，不涉及生命周期。
(ReactDOM as any).findDOMNode = (ReactDOM as any).findDOMNode || ((inst: any) => {
  if (!inst) return null;
  if ((inst as any).current) return (inst as any).current;
  if ((inst as any).nodeType) return inst;
  return null;
});
// 兼容 CommonJS default 引用（react-quill 内部用到 react-dom 的 default）
if (!(ReactDOM as any).default) {
  (ReactDOM as any).default = {
    ...ReactDOM,
    findDOMNode: (ReactDOM as any).findDOMNode,
  };
} else if (!(ReactDOM as any).default.findDOMNode) {
  (ReactDOM as any).default.findDOMNode = (ReactDOM as any).findDOMNode;
}
import { Button } from '../components/Button';
import { 
  SearchIcon, GlobeIcon, PdfIcon, FileTextIcon, SparklesIcon, 
  LogoIcon, HomeIcon, SettingsIcon, PlusIcon, MessageSquareIcon, 
  DatabaseIcon, DiscordIcon, LinkIcon, ArrowRightIcon, ChevronDownIcon,
  SidebarIcon, GridIcon, ListIcon, DownloadIcon, AlertCircleIcon,
  RefreshCwIcon, ThumbsUpIcon, ThumbsDownIcon, PaperclipIcon, PenToolIcon, PlayCircleIcon,
  MoreHorizontalIcon, CheckSquareIcon, SquareIcon, MicIcon, ImageIcon, LayoutIcon,
  ChevronLeftIcon, ChevronRightIcon, EditIcon, CopyIcon, TrashIcon, ShareIcon, FolderIcon,
  BrainIcon, SaveIcon, DeviceIcon, LockIcon,
  SunIcon, CloudIcon, ZapIcon, UmbrellaIcon, TreeIcon, HeartIcon, MusicIcon,
  MapPinIcon, CalendarIcon, BriefcaseIcon, SmileIcon, GiftIcon, FlagIcon, BookmarkIcon,
  CheckIcon, FolderPlusIcon, UploadCloudIcon, ExternalLinkIcon, StarIcon, FileInputIcon, XIcon,
  QuoteIcon, WeChatIcon, XiaohongshuIcon, YouTubeIcon, DouyinIcon, BilibiliIcon
} from '../components/Icons';
import { Link } from 'react-router-dom';
import XhsLongImageTool from './XhsLongImageTool';

// Quill toolbar configuration for richer note editing
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean']
  ]
};

const QUILL_FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'align',
  'link', 'image'
];

// --- SHARED TYPES & MOCK DATA (For Editor) ---

type SourceType = 'Web' | 'PDF' | 'Note' | 'Video' | 'Image' | 'xiaohongshu' | 'link' | 'folder' | 'text' | 'image' | 'video' | 'pdf' | 'article';
type LongFormAspect = '3:4' | '16:9' | '1:1';

interface Material {
  id: string;
  title: string;
  type: SourceType;
  date: string;
  content: string;
  sourceUrl?: string;
  imageUrl?: string;
  author?: string; // Added for article metadata
  mediaUrl?: string; // Added for direct media playback (mp4 etc)
  images?: string[]; // Added for multiple images support
}

const MOCK_MATERIALS: Material[] = [
  {
    id: 'c1', 
    title: 'Three things to win at the starting line after the exam',
    type: 'Note',
    date: '17 hours ago',
    content: `Attention during the exam:

1. Don't rush to check answers after the exam. It's done.
2. Focus on rest and mental recovery.
3. Prepare for the next subject immediately.`
  },
  {
    id: 'c2', 
    title: 'The porn industry is being driven to the edge by AI',
    type: 'Web',
    date: '17 hours ago',
    content: `A deep dive into how generative AI is disrupting traditional industries...`
  },
  {
    id: '1',
    title: 'Ants officially join the AI super entrance war',
    type: 'Note',
    date: 'Nov 18, 2025',
    content: `Yesterday, after a thousand calls.

Today, a brand new AI assistant, Zhixiaobao, officially announced its entry into the battlefield.

From Ant Group, yes, the same Ant that makes Alipay.

The main interface is simple and clean. It focuses on life services and solving practical problems. Unlike other AI that focuses on creative writing or coding, this one is grounded in daily needs.`
  },
  {
    id: '3',
    title: 'Douyin Selected Computer Version',
    type: 'Video',
    date: 'Yesterday',
    content: `Platform overview and feature set for the desktop version of Douyin...`
  },
  {
    id: 'c4',
    title: 'Steve Jobs\' Advice | Best Speech History (HQ)',
    type: 'Video',
    date: 'Yesterday',
    content: `Stay hungry, stay foolish. The connecting dots speech...`,
    sourceUrl: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc'
  },
  {
    id: 'c5',
    title: 'How to extract copywriting using AI',
    type: 'Web',
    date: 'Yesterday',
    content: `Yes, but it depends on the situation. Most AI tools can help you...`
  },
  {
    id: 'i3',
    title: 'Summarize into pure text',
    type: 'Note',
    date: '16 hours ago',
    content: 'Here is the complete pure text version of the content you provided...'
  },
  {
    id: 'i4',
    title: 'Quote: Feeling like I failed',
    type: 'Note',
    date: '16 hours ago',
    content: '"Feeling like I failed the previous generation of entrepreneurs," he even wanted to leave Silicon Valley.'
  }
];

// --- WORKS & TEMPLATES MOCK DATA ---

interface Work {
  id: string;
  title: string;
  type: 'Doc' | 'Slide' | 'Page' | SourceType;
  date: string;
  content?: string;
  preview?: string;
  imageUrl?: string;
  mediaUrl?: string;
  images?: string[];
  sourceUrl?: string;
  publishedTo?: string[];
}

const MOCK_WORKS: Work[] = [
  { id: 'w1', title: 'Steve Jobs Graduation Speech: 3 Counter-Intuitive Life Principles', type: 'Doc', date: '16 hours ago' },
  { id: 'w2', title: 'Stay Hungry, Stay Foolish — Steve Jobs Stanford Speech', type: 'Doc', date: '16 hours ago' },
  { id: 'w3', title: 'Three things to win at the starting line after the exam', type: 'Slide', date: 'Yesterday' },
  { 
    id: 'w4', 
    title: 'New page', 
    type: 'Page', 
    date: 'Yesterday',
    content: `那顿饭之后，我开始认真面对“衰老”

--日更公众号的第88天--
--晚10点半睡，早5点起的第82天--

最近好几次，吃晚饭稍微吃快了一点，多了一点，整个晚上都难受，胃胀，消化不良，也睡不好。

以前很少会有这样的感觉，几次以后我突然意识到，我是不是老了？

之前之前听别人说，人过了30就开始走下坡路，现在我第一次真实体会到了这种感觉。

我仔细回想，不只是消化能力减弱了，...`
  },
  { id: 'w5', title: 'Welcome to Super Content Factory', type: 'Page', date: 'Yesterday' },
];

const WECHAT_ACCOUNTS = [
  { id: 'wx-1', name: 'Daily Tech Studio', wechatAppid: 'wx-1' },
  { id: 'wx-2', name: 'Growth Notes', wechatAppid: 'wx-2' },
  { id: 'wx-3', name: 'Product Radar', wechatAppid: 'wx-3' },
];

interface WechatAccount {
  name: string;
  wechatAppid: string;
  username: string;
  avatar?: string;
  type?: string;
  verified?: boolean;
  status?: string;
}

// 在开发环境走本地代理，避免浏览器直连跨域；生产仍直连真实域名
const WECHAT_REMOTE_BASE = 'https://wx.limyai.com/api/openapi';
const WECHAT_OPENAPI_BASE =
  (import.meta as any)?.env?.DEV ? '/wechat-openapi' : WECHAT_REMOTE_BASE;
const WECHAT_OPENAPI_KEY = (import.meta as any)?.env?.VITE_WECHAT_OPENAPI_KEY || (import.meta as any)?.env?.VITE_WECHAT_API_KEY || '';
const WECHAT_PROXY_URL = (import.meta as any)?.env?.VITE_WECHAT_PROXY_URL || '';

const XHS_PUBLISH_BASE = 'https://note.limyai.com/api/openapi';
const XHS_PUBLISH_API_KEY = (import.meta as any)?.env?.VITE_XHS_PUBLISH_API_KEY || '';

const normalizeToRemote = (url: string) => {
  if (url.startsWith('http')) return url;
  // 将 /wechat-openapi/xx 还原为真实域名路径，避免代理链路二次拼接前缀
  return `${WECHAT_REMOTE_BASE}${url.replace(/^\/wechat-openapi/, '')}`;
};

const fetchWithProxyFallback = async (url: string, options: RequestInit) => {
  const remoteUrl = normalizeToRemote(url);
  // 1) 先按原始 URL 请求（dev 走 Vite 代理）
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
    // 2) 若非 2xx，再直接请求真实域名（绕过 dev 代理 502 的情况）
    if (remoteUrl !== url) {
      const direct = await fetch(remoteUrl, options);
      if (direct.ok) return direct;
      // 3) 若配置了外部代理，再尝试代理真实域名
      if (WECHAT_PROXY_URL) {
        const proxied = `${WECHAT_PROXY_URL}${encodeURIComponent(remoteUrl)}`;
        return await fetch(proxied, options);
      }
      return direct;
    }
    // 4) 没有额外路由可试，直接返回
    return res;
  } catch (err) {
    // 捕获网络错误，尝试外部代理
    if (!WECHAT_PROXY_URL) throw err;
    const proxied = `${WECHAT_PROXY_URL}${encodeURIComponent(remoteUrl)}`;
    return await fetch(proxied, options);
  }
};

const postWechat = async (path: string, payload: any) => {
  if (!WECHAT_OPENAPI_KEY) {
    throw new Error('缺少微信开放平台 API Key');
  }

  const url = `${WECHAT_OPENAPI_BASE}${path}`;
  const res = await fetchWithProxyFallback(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': WECHAT_OPENAPI_KEY,
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const message = data?.error || data?.message || res.statusText || '请求失败';
    const code = data?.code;
    throw new Error(code ? `${code}: ${message}` : message);
  }
  return data;
};

const fetchWechatAccounts = async (): Promise<WechatAccount[]> => {
  try {
    const data = await postWechat('/wechat-accounts', {});
    return data?.data?.accounts || [];
  } catch (err) {
    // 开发环境兜底：接口跨域/502 时返回空数组，避免阻塞 UI（生产仍抛错）
    if ((import.meta as any)?.env?.DEV) {
      console.warn('fetchWechatAccounts fallback (dev only):', err);
      return [];
    }
    throw err;
  }
};

type PublishXhsPayload = {
  title?: string;
  content?: string;
  coverImage: string;
  images?: string[];
  tags?: string[];
  noteId?: string;
};

const publishXhsNote = async (payload: PublishXhsPayload, idempotencyKey?: string) => {
  if (!XHS_PUBLISH_API_KEY) {
    throw new Error('缺少小红书发布 API Key');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': XHS_PUBLISH_API_KEY,
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${XHS_PUBLISH_BASE}/publish_note`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const message = data?.error || data?.message || res.statusText || '请求失败';
    const code = data?.code;
    throw new Error(code ? `${code}: ${message}` : message);
  }
  return data;
};

const extractImagesFromContent = (content?: string): string[] => {
  if (!content) return [];
  const images = new Set<string>();

  const mdImgRegex = /!\[[^\]]*]\(([^)]+)\)/g;
  let match;
  while ((match = mdImgRegex.exec(content)) !== null) {
    if (match[1]) images.add(match[1]);
  }

  const htmlImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImgRegex.exec(content)) !== null) {
    if (match[1]) images.add(match[1]);
  }

  return Array.from(images);
};

const stripMarkdownAndHtml = (input?: string): string => {
  if (!input) return '';
  let text = input;
  // Remove markdown image syntax
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, '');
  // Convert markdown links to plain text
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // Handle basic HTML line breaks/paragraphs/headings
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  // Strip other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Remove markdown headings/quotes/lists/code fences
  text = text.replace(/(^|\n)[>#]+\s*/g, '\n');
  text = text.replace(/(^|\n)\s*[-*+]\s+/g, '\n');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]*)`/g, '$1');
  // Normalize whitespace
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return `xhs-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type PublishWechatPayload = {
  wechatAppid: string;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  author?: string;
  contentFormat?: 'markdown' | 'html';
  articleType?: 'news' | 'newspic';
};

const publishWechatArticle = async (payload: PublishWechatPayload) => {
  return await postWechat('/wechat-publish', payload);
};

type PublishInfo = 
  | { platform: 'wechat'; wechatAppid: string; articleType: 'news' | 'newspic'; truncated?: boolean }
  | { platform: 'xiaohongshu'; publishUrl?: string; qrImageUrl?: string; noteId?: string };

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tag: string;
  defaultPrompt?: string;
  accent?: string;
}

const CREATION_TEMPLATES: Template[] = [
  { 
    id: 't1', 
    title: 'Briefing digest', 
    description: 'Overview of selected materials featuring key insights and highlights.', 
    icon: <FileTextIcon className="w-5 h-5 text-blue-600" />,
    color: 'border-l-4 border-l-blue-400',
    tag: 'Page',
    accent: 'bg-blue-50 text-blue-700',
    defaultPrompt: 'Summarize selected materials into a concise briefing with key insights and highlights.'
  },
  { 
    id: 't2', 
    title: 'Blog post', 
    description: 'Insight-driven blog article highlighting surprising or counter-intuitive points.', 
    icon: <PenToolIcon className="w-5 h-5 text-purple-600" />,
    color: 'border-l-4 border-l-purple-400',
    tag: 'Page',
    accent: 'bg-purple-50 text-purple-700',
    defaultPrompt: 'Write a blog post emphasizing surprising, counter-intuitive insights with engaging storytelling.'
  },
  { 
    id: 't3', 
    title: 'Research guide', 
    description: 'Generate an insightful research guide based on the selected materials.', 
    icon: <DatabaseIcon className="w-5 h-5 text-indigo-600" />,
    color: 'border-l-4 border-l-indigo-400',
    tag: 'Page',
    accent: 'bg-indigo-50 text-indigo-700',
    defaultPrompt: 'Create a structured research guide with objectives, scope, key sources, and next steps.'
  },
  { 
    id: 't-longform-image', 
    title: '长图文生成', 
    description: '根据选中资料生成长图文，内置 3:4 / 16:9 / 1:1 默认尺寸，模板位预留待接入。', 
    icon: <LayoutIcon className="w-5 h-5 text-emerald-600" />,
    color: 'border-l-4 border-l-emerald-400',
    tag: 'Image',
    accent: 'bg-emerald-50 text-emerald-700',
    defaultPrompt: '生成一组长图文，突出关键信息、段落摘要和视觉要点，可选 3:4 / 16:9 / 1:1 尺寸。'
  }
];

const CHAT_HISTORY = [
  {
    role: 'user',
    content: 'I\'ll create a series of doodle-style images to explain the content about internet celebrity account violations. Let me generate up to 5 informative slides in a consistent hand-drawn style.'
  },
  {
    role: 'system',
    type: 'error',
    content: 'Due to parent message error, tool execution stopped.'
  },
  {
    role: 'system',
    type: 'warning',
    content: 'Your current payment plan quota has been reached (generated 2 times). To continue, please Upgrade Plan.'
  },
  {
    role: 'system',
    type: 'error',
    content: 'Due to parent message error, tool execution stopped.'
  },
  {
    role: 'system',
    type: 'error',
    content: 'Due to parent message error, tool execution stopped.'
  },
   {
    role: 'system',
    type: 'warning',
    content: 'You have reached the daily 200 usage limit. To continue, please Upgrade Plan.'
  },
  {
    role: 'assistant',
    content: 'Ants Officially Join AI... Describe a task...' 
  }
];

// --- SHORTCUT COMMANDS ---
type ShortcutCommand = {
  id: string;
  name: string;
  prompt: string;
  description?: string;
  agentMode?: 'agent' | 'ask' | 'write' | 'search' | 'image';
  modelId?: string;
  imageModelId?: string;
  icon?: 'text' | 'sparkles' | 'smile' | 'globe' | 'mail' | 'check' | 'idea';
};

const SHORTCUT_STORAGE_KEY = 'scf-shortcuts-v1';

const DEFAULT_SHORTCUT_COMMANDS: ShortcutCommand[] = [
  { id: 'cmd1', name: 'Summarize', icon: 'text', prompt: 'Please summarize the following content concisely:', agentMode: 'ask', modelId: 'gpt-4o' },
  { id: 'cmd2', name: 'Key Takeaways', icon: 'sparkles', prompt: 'Extract the key takeaways and insights from this:', agentMode: 'ask', modelId: 'gpt-4o' },
  { id: 'cmd3', name: 'Explain Simple', icon: 'smile', prompt: 'Explain the concepts here in simple terms:', agentMode: 'ask', modelId: 'gpt-4o' },
  { id: 'cmd4', name: 'Translate to CN', icon: 'globe', prompt: 'Translate the following content into professional Chinese:', agentMode: 'ask', modelId: 'gemini-2.5-flash' },
  { id: 'cmd5', name: 'Draft Email', icon: 'mail', prompt: 'Draft a professional email based on this information:', agentMode: 'write', modelId: 'gpt-4o' },
  { id: 'cmd6', name: 'Action Items', icon: 'check', prompt: 'Create a checklist of actionable items from this:', agentMode: 'write', modelId: 'gpt-4o' },
];

const renderShortcutIcon = (icon?: ShortcutCommand['icon']) => {
  switch (icon) {
    case 'text': return <FileTextIcon className="w-3 h-3 text-blue-500" />;
    case 'sparkles': return <SparklesIcon className="w-3 h-3 text-yellow-500" />;
    case 'smile': return <SmileIcon className="w-3 h-3 text-green-500" />;
    case 'globe': return <GlobeIcon className="w-3 h-3 text-purple-500" />;
    case 'mail': return <MessageSquareIcon className="w-3 h-3 text-gray-500" />;
    case 'check': return <CheckSquareIcon className="w-3 h-3 text-teal-500" />;
    default: return <SparklesIcon className="w-3 h-3 text-amber-500" />;
  }
};

// --- DASHBOARD TYPES & DATA ---

interface ProjectItem {
  id: string;
  type: SourceType;
  title?: string;
  preview?: string;
  imageUrl?: string;
  source?: string;
  timeAgo: string;
  content?: string; 
  sourceUrl?: string;
  author?: string; // Stored author
  file?: File; 
  mediaUrl?: string; // Raw media URL for direct playback
  images?: string[]; // Added for multiple images support
}

interface Project {
  id: string;
  name: string;
  itemCount: number;
  lastUpdated: string;
  icon: React.ReactNode;
  items: ProjectItem[];
}

// Initial Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'test',
    name: 'test',
    itemCount: 4,
    lastUpdated: '16 hours ago',
    icon: <MessageSquareIcon className="w-5 h-5" />,
    items: [
      {
        id: 'i1',
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
        timeAgo: '16 hours ago'
      },
      {
        id: 'i2',
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1529139574466-a302d2d3f529?w=400&q=80',
        timeAgo: '16 hours ago'
      },
      {
        id: 'i3',
        type: 'text',
        title: 'Summarize into pure text',
        preview: 'Here is the complete pure text version of the content you provided...',
        timeAgo: '16 hours ago'
      },
      {
        id: 'i4',
        type: 'text',
        title: 'Quote',
        preview: '"Feeling like I failed the previous generation of entrepreneurs," he even wanted to leave Silicon Valley.',
        timeAgo: '16 hours ago'
      }
    ]
  },
  {
    id: 'chaos',
    name: 'Chaos',
    itemCount: 16,
    lastUpdated: '16 hours ago',
    icon: <DatabaseIcon className="w-5 h-5" />,
    items: [
      {
        id: 'c1',
        type: 'text',
        title: 'Three things to win at the starting line',
        preview: 'After the exam, do not check answers immediately. Slow down, do not rush...',
        timeAgo: '17 hours ago'
      },
      {
        id: 'c2',
        type: 'text',
        title: 'The porn industry is being driven to the edge by AI',
        preview: 'Below is a summary of the provided content regarding the impact of AI on...',
        timeAgo: '17 hours ago'
      },
      {
        id: 'c3',
        type: 'link',
        title: 'Douyin Selected Computer Version',
        source: 'douyin.com',
        imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&q=80',
        timeAgo: 'Yesterday',
        sourceUrl: 'https://www.douyin.com'
      },
      {
        id: 'c4',
        type: 'video',
        title: 'Steve Jobs\' Advice',
        source: 'Best Speech History',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&q=80',
        timeAgo: 'Yesterday',
        sourceUrl: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc'
      },
      {
        id: 'c5',
        type: 'text',
        title: 'AI Copywriting Method',
        preview: 'Yes, but it depends on the situation. Most AI tools can help you...',
        timeAgo: 'Yesterday'
      }
    ]
  }
];

// --- MODEL DATA ---
interface ModelOption {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'anthropic' | 'xai' | 'deepseek' | 'moonshot' | 'minimax' | 'other';
  tags?: { label: string; color: string }[];
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'openai', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'openai', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', tags: [{ label: 'Limited Free', color: 'bg-green-100 text-green-600' }] },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'google', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'claude-sonnet-4.5-thinking', name: 'Claude Sonnet 4.5', provider: 'anthropic', tags: [{ label: 'Thinking', color: 'bg-gray-100 text-gray-600' }] },
  { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'anthropic', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xai', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'grok-4-fast', name: 'Grok 4 Fast', provider: 'xai' },
  { id: 'grok-4-pro', name: 'Grok 4', provider: 'xai', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'deepseek' },
  { id: 'deepseek-v3.2-thinking', name: 'DeepSeek V3.2', provider: 'deepseek', tags: [{ label: 'Thinking', color: 'bg-gray-100 text-gray-600' }] },
  { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', provider: 'moonshot' },
  { id: 'minimax-m2', name: 'MiniMax M2', provider: 'minimax' },
];

const IMAGE_MODEL_OPTIONS: ModelOption[] = [
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'other' },
  { id: 'jimeng-4.0', name: '即梦 4.0', provider: 'other', tags: [{ label: 'Limited Free', color: 'bg-green-100 text-green-600' }] },
  { id: 'flux-1.1', name: 'Flux 1.1', provider: 'other', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
  { id: 'midjourney-v6', name: 'Midjourney V6', provider: 'other', tags: [{ label: 'Pro', color: 'bg-blue-100 text-blue-600' }] },
];

const IMAGE_STYLES = [
  { id: 'ghibli', label: '吉卜力', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&q=80' },
  { id: 'pixar', label: '皮克斯', img: 'https://images.unsplash.com/photo-1633469924738-52101af51d87?w=150&q=80' },
  { id: 'cartoon', label: '卡通', img: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=150&q=80' },
  { id: 'pixel', label: '像素', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&q=80' },
];

const LONGFORM_ASPECTS: { id: LongFormAspect; label: string; hint: string }[] = [
  { id: '3:4', label: '3:4', hint: '竖版' },
  { id: '16:9', label: '16:9', hint: '横版' },
  { id: '1:1', label: '1:1', hint: '正方形' },
];

const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="text-sm text-gray-800 leading-relaxed break-words space-y-2">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0" {...props} />,
        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-600 underline break-words" target="_blank" rel="noopener noreferrer" {...props} />,
        code({ inline, className, children, ...props }) {
          if (inline) {
            return <code className="bg-gray-100 px-1 py-0.5 rounded text-[13px]" {...props}>{children}</code>;
          }
          return (
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs" {...props}>
              <code>{children}</code>
            </pre>
          );
        },
        blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-gray-200 pl-3 text-gray-700 italic mb-2 last:mb-0" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />
      }}
    >
      {content || ''}
    </ReactMarkdown>
  </div>
);

const getModelIcon = (provider: string) => {
    switch (provider) {
        case 'openai': return <SparklesIcon className="w-4 h-4 text-green-600" />;
        case 'google': return <SparklesIcon className="w-4 h-4 text-blue-500" />;
        case 'anthropic': return <StarIcon className="w-4 h-4 text-orange-500" />;
        case 'xai': return <ZapIcon className="w-4 h-4 text-gray-900" />;
        case 'deepseek': return <GlobeIcon className="w-4 h-4 text-blue-600" />;
        case 'moonshot': return <div className="w-4 h-4 font-bold text-[10px] flex items-center justify-center bg-black text-white rounded-full">K</div>;
        case 'minimax': return <MusicIcon className="w-4 h-4 text-pink-500" />;
        case 'other': return <ImageIcon className="w-4 h-4 text-purple-600" />;
        default: return <BrainIcon className="w-4 h-4 text-gray-500" />;
    }
};

// --- OpenRouter Helpers for Gemini ---
const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_SITE_URL = import.meta.env.VITE_OPENROUTER_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
// Default to a currently-listed Gemini model on OpenRouter to avoid 400s from deprecated IDs
const OPENROUTER_FALLBACK_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-flash';

// 1) 内置少量常用映射；2) 支持通过 env 为任意模型覆盖：VITE_OPENROUTER_MODEL_MAP__<MODEL_ID_IN_UPPERCASE_WITH_UNDERSCORES>
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gemini-2.5-pro': 'google/gemini-2.5-pro',
  // 如果你有 Gemini 3 Pro 权限，在 .env.local 设置 VITE_OPENROUTER_GEMINI3_ID 或 VITE_OPENROUTER_MODEL_MAP__GEMINI_3_PRO
  'gemini-3-pro': import.meta.env.VITE_OPENROUTER_GEMINI3_ID || 'google/gemini-3-pro-preview',
  // OpenAI
  'gpt-4o': 'openai/gpt-4o',
  'gpt-5': 'openai/gpt-5',
  'gpt-5.1': 'openai/gpt-5.1',
  'gpt-5.2': 'openai/gpt-5.2',
  // Anthropic
  'claude-sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  'claude-sonnet-4.5-thinking': 'anthropic/claude-sonnet-4.5:thinking',
  'claude-sonnet-3.7-thinking': 'anthropic/claude-3.7-sonnet:thinking',
  'claude-opus-4.5': 'anthropic/claude-opus-4.5'
};

const envOverrideKey = (id: string) => `VITE_OPENROUTER_MODEL_MAP__${id.replace(/[-.]/g, '_').toUpperCase()}`;

const resolveOpenRouterModel = (selectedModelId: string) => {
  if (!selectedModelId) return OPENROUTER_FALLBACK_MODEL;
  const envOverride = import.meta.env[envOverrideKey(selectedModelId)];
  if (envOverride) return envOverride;
  if (OPENROUTER_MODEL_MAP[selectedModelId]) return OPENROUTER_MODEL_MAP[selectedModelId];
  return selectedModelId; // assume caller already passed a valid OpenRouter model id
};

const callOpenRouterChat = async (
  messages: { role: string; content: string }[],
  modelId: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 OpenRouter Key，请在 .env.local 设置 VITE_OPENROUTER_API_KEY');
  }

  const resolvedModel = resolveOpenRouterModel(modelId);
  const finalModel = resolvedModel && resolvedModel.includes('/') ? resolvedModel : OPENROUTER_FALLBACK_MODEL;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      // OpenRouter 推荐的标识头，方便在仪表盘里看到来源
      'HTTP-Referer': OPENROUTER_SITE_URL,
      'X-Title': 'Super Content Factory'
    },
    body: JSON.stringify({
      model: finalModel || OPENROUTER_FALLBACK_MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter 接口错误 ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter 没有返回内容');
  }
  return content.trim();
};

// --- REAL BACKEND API IMPLEMENTATION ---
// Normalize WeChat HTML so images show up (WeChat puts real URLs in data-src)
const cleanWeChatHtml = (html: string) => {
  if (!html) return html;
  let processed = html;
  // data-src -> src and add https when protocol is missing
  processed = processed.replace(/data-src="(\/\/[^"]+)"/g, (_m, url) => `src="https:${url}"`);
  processed = processed.replace(/data-src='(\/\/[^']+)'/g, (_m, url) => `src="https:${url}"`);
  processed = processed.replace(/data-src="(https?:[^"]+)"/g, 'src="$1"');
  processed = processed.replace(/data-src='(https?:[^']+)'/g, 'src="$1"');
  // Also fix src that still use protocol-relative
  processed = processed.replace(/src="(\/\/[^"]+)"/g, (_m, url) => `src="https:${url}"`);
  processed = processed.replace(/src='(\/\/[^']+)'/g, (_m, url) => `src="https:${url}"`);
  // Add referrerpolicy to avoid hotlink placeholder
  processed = processed.replace(/<img(?![^>]*referrerpolicy)/g, '<img referrerpolicy="no-referrer"');
  // Drop the first image (often the WeChat hotlink warning placeholder)
  let removed = false;
  processed = processed.replace(/<p[^>]*>\s*<img[^>]*>\s*<\/p>/i, (m) => {
    if (removed) return m;
    removed = true;
    return '';
  });
  if (!removed) {
    processed = processed.replace(/<img[^>]*>/i, (m) => {
      if (removed) return m;
      removed = true;
      return '';
    });
  }
  return processed;
};

const scrapeUrlContent = async (inputUrl: string): Promise<{ title: string; content: string; author: string; type: SourceType; imageUrl?: string; sourceUrl?: string; date?: string; mediaUrl?: string; images?: string[] }> => {
  let url = inputUrl.trim();
  if (!url) throw new Error("Empty URL");
  
  // Normalize URL
  if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
  }
  
  let hostname = "";
  try {
      hostname = new URL(url).hostname;
  } catch (e) {
      console.error("Invalid URL format:", url);
      return {
          title: "Invalid URL",
          content: url,
          author: "Unknown",
          type: 'link',
          sourceUrl: url,
          date: 'Just now'
      };
  }

  const WECHAT_API_URL = import.meta.env.VITE_WECHAT_API_URL || "http://data.wxrank.com/weixin/artinfo";
  const WECHAT_PROXY_URL = import.meta.env.VITE_WECHAT_PROXY_URL || "";
  const WECHAT_API_KEY = import.meta.env.VITE_WECHAT_API_KEY || "";
  const MEOW_API_URL = import.meta.env.VITE_MEOW_API_URL || "https://api.meowload.net/openapi/extract/post";
  const MEOW_API_KEY = import.meta.env.VITE_MEOW_API_KEY || "";
  
  // 1. WeChat API - PRIORITY 1
  if (url.includes('mp.weixin.qq.com')) {
      try {
         const targetUrl = WECHAT_API_URL;
         // Use a CORS proxy to bypass Mixed Content (http vs https) and CORS headers restrictions
         const proxyUrl = WECHAT_PROXY_URL ? `${WECHAT_PROXY_URL}${targetUrl}` : targetUrl;

         const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               key: WECHAT_API_KEY,
               url: url
            })
         });

         if (!response.ok) {
           throw new Error(`API error: ${response.status}`);
         }

         const resJson = await response.json();
         if (resJson.data) {
             const data = resJson.data;
             const cleanedHtml = data.html ? cleanWeChatHtml(data.html) : '';
             return {
                title: data.title,
                author: data.author || data.name || data.user_name || "WeChat Official Account",
                content: cleanedHtml || data.text || "", // Use cleaned HTML so images load
                imageUrl: data.msg_cdn_url,
                type: 'article',
                date: data.pub_time?.split(' ')[0] || 'Today',
                sourceUrl: data.article_url || url
             };
         } else {
             console.warn("WeChat API response empty or invalid", resJson);
         }
      } catch (error) {
         console.error("WeChat API fetch failed", error);
         // Fallback is handled at the end
      }
  }

  // 2. MeowLoad API for General Extraction (Video/Images) - PRIORITY 2
  // For non-WeChat links, prioritize MeowLoad to get rich media info
  if (!url.includes('mp.weixin.qq.com')) {
      try {
          const response = await fetch(MEOW_API_URL, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': MEOW_API_KEY,
                  'accept-language': 'zh'
              },
              body: JSON.stringify({ url })
          });

          if (response.ok) {
              const data = await response.json();
              // Extract primary media info
              const medias = data.medias || [];
              const mainMedia = medias.length > 0 ? medias[0] : null;

              // Extract all images for carousel
              const images = medias
                  .filter((m: any) => m.media_type === 'image')
                  .map((m: any) => m.resource_url);
              
              let extractedType: SourceType = 'link';
              if (mainMedia) {
                  if (mainMedia.media_type === 'video') extractedType = 'video';
                  else if (mainMedia.media_type === 'image') extractedType = 'image';
                  else if (mainMedia.media_type === 'audio') extractedType = 'video'; // Audio treated as video player for now
              }

              return {
                  title: data.text ? (data.text.length > 60 ? data.text.substring(0, 60) + '...' : data.text) : (data.text || "Untitled Extracted Content"),
                  content: data.text || "",
                  author: hostname.replace('www.', ''),
                  type: extractedType,
                  imageUrl: mainMedia?.preview_url || (extractedType === 'image' ? mainMedia?.resource_url : undefined),
                  sourceUrl: url,
                  mediaUrl: mainMedia?.resource_url, // Save direct resource URL for playback
                  date: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Just now',
                  images: images.length > 0 ? images : undefined // Return all extracted images
              };
          } else {
              console.warn("MeowLoad API returned non-200", response.status);
          }
      } catch (e) {
          console.error("MeowLoad API failed", e);
      }
  }

  // 3. Client-Side Fallbacks / Fast Paths
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return {
        title: 'YouTube Video',
        author: 'YouTube',
        type: 'video',
        content: url,
        sourceUrl: url,
        date: 'Just now',
        imageUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined
      };
  }
  if (url.includes('bilibili.com')) {
      return {
        title: 'Bilibili Video',
        author: 'Bilibili',
        type: 'video',
        content: url,
        sourceUrl: url,
        date: 'Just now'
      };
  }
  if (url.includes('douyin.com')) {
      return {
        title: 'Douyin Video',
        author: 'Douyin',
        type: 'video',
        content: url,
        sourceUrl: url,
        date: 'Just now'
      };
  }
  if (url.includes('xiaohongshu.com')) {
      return {
          title: 'Xiaohongshu Post',
          author: 'Xiaohongshu',
          type: 'xiaohongshu',
          content: url,
          sourceUrl: url,
          date: 'Just now'
      };
  }

  // 4. Default Fallback
  return {
    title: url,
    author: hostname.replace('www.', ''),
    type: 'link',
    content: url,
    sourceUrl: url,
    date: 'Just now'
  };
};

// --- NEW PROJECT MODAL CONFIG ---
// ... (CreateProjectModal code remains same, omitted for brevity but preserved in final structure if needed, assumming context exists) ...
// (Since we are updating the file, we must include dependencies. I will rely on the existing imports.)

const PROJECT_COLORS = [
  'text-gray-900', 'text-gray-500', 'text-blue-500', 'text-teal-500', 
  'text-green-500', 'text-purple-500', 'text-pink-500', 'text-red-500', 
  'text-orange-500', 'text-yellow-500', 'text-amber-700'
];

const BG_COLORS_MAP: Record<string, string> = {
  'text-gray-900': 'bg-gray-900',
  'text-gray-500': 'bg-gray-500',
  'text-blue-500': 'bg-blue-500',
  'text-teal-500': 'bg-teal-500',
  'text-green-500': 'bg-green-500',
  'text-purple-500': 'bg-purple-500',
  'text-pink-500': 'bg-pink-500',
  'text-red-500': 'bg-red-500',
  'text-orange-500': 'bg-orange-500',
  'text-yellow-500': 'bg-yellow-500',
  'text-amber-700': 'bg-amber-700',
};

const PICKER_ICONS = [
  SunIcon, CloudIcon, TreeIcon, HeartIcon, ZapIcon, UmbrellaIcon,
  MessageSquareIcon, DatabaseIcon, BrainIcon, SparklesIcon, LayoutIcon, 
  FileTextIcon, GlobeIcon, PenToolIcon, MicIcon, ImageIcon, 
  PlayCircleIcon, FolderIcon, HomeIcon, SettingsIcon, LinkIcon, GridIcon,
  DeviceIcon, SaveIcon, ShareIcon, LockIcon, MusicIcon, MapPinIcon,
  CalendarIcon, BriefcaseIcon, SmileIcon, GiftIcon, FlagIcon, BookmarkIcon
];


const CreateProjectModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onCreate: (name: string, icon: React.ReactNode) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [SelectedIcon, setSelectedIcon] = useState(() => PICKER_ICONS[0]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedColor(PROJECT_COLORS[0]);
      setSelectedIcon(() => PICKER_ICONS[0]);
      setShowPicker(false);
    }
  }, [isOpen]);

  // Click outside to close picker logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
       {/* Backdrop */}
       <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
       
       {/* Modal Content */}
       <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[900px] h-[550px] flex overflow-hidden z-10 animate-in zoom-in-95 duration-200 relative">
          
          {/* Close Button */}
          <button 
             onClick={onClose}
             className="absolute top-6 right-6 z-20 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          {/* Left Panel - Form */}
          <div className="w-[360px] flex-shrink-0 p-10 flex flex-col justify-center bg-white relative">
             
             {/* Icon Preview / Trigger */}
             <div className="relative self-start mb-10 group" ref={pickerContainerRef}>
                 <button 
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-24 h-24 rounded-3xl flex items-center justify-center bg-gray-50 border-2 border-transparent hover:border-gray-200 transition-all shadow-sm group-hover:shadow-md"
                 >
                    <SelectedIcon className={`w-10 h-10 ${selectedColor}`} />
                 </button>
                 
                 {/* Mini Edit Badge */}
                 <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-gray-100 text-gray-400 pointer-events-none">
                    <EditIcon className="w-3 h-3" />
                 </div>

                 {/* Icon/Color Picker Popover */}
                 {showPicker && (
                    <div className="absolute top-full left-0 mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[340px] z-50 animate-in slide-in-from-top-2 duration-200">
                        {/* Colors */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {PROJECT_COLORS.map(c => (
                              <button 
                                key={c}
                                className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform hover:scale-110 ${BG_COLORS_MAP[c]} ${selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`} 
                                onClick={() => setSelectedColor(c)} 
                              />
                            ))}
                        </div>
                        <div className="h-px bg-gray-100 mb-4"></div>
                         {/* Icons Grid */}
                        <div className="grid grid-cols-6 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                            {PICKER_ICONS.map((Icon, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setSelectedIcon(() => Icon)}
                                className={`p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors ${SelectedIcon === Icon ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
                              >
                                <Icon className="w-5 h-5" />
                              </button>
                            ))}
                        </div>
                    </div>
                 )}
             </div>

             {/* Input */}
             <div className="mb-10 w-full">
                 <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Project Name</label>
                 <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full text-2xl font-bold text-gray-900 border-b-2 border-gray-100 py-2 focus:outline-none focus:border-gray-900 transition-colors placeholder:text-gray-300 bg-transparent"
                    autoFocus
                 />
             </div>

             {/* Submit */}
             <Button
                disabled={!name.trim()}
                onClick={() => onCreate(name, <SelectedIcon className={`w-5 h-5 ${selectedColor}`} />)}
                className="w-full rounded-full py-4 text-base font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-200 transition-all hover:-translate-y-0.5"
             >
                Create Project
             </Button>
          </div>

          {/* Right Panel - Illustration */}
          <div className="flex-1 bg-[#F3F5F7] relative flex flex-col items-center justify-center overflow-hidden">
             <div className="text-center z-10 transform translate-y-6">
                 <h2 className="text-2xl font-bold text-blue-900/30 mb-8 tracking-tight">Organize & Create with AI</h2>
                 {/* CSS Only Window Mockup */}
                 <div className="bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-200/60 p-1 w-[380px] h-[280px] transform -rotate-3 hover:rotate-0 transition-all duration-700 ease-out mx-auto relative">
                    <div className="h-full w-full bg-white rounded-lg overflow-hidden flex flex-col">
                       {/* Header */}
                       <div className="h-8 border-b border-gray-100 flex items-center px-3 gap-1.5 bg-gray-50/50">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                       </div>
                       {/* Body */}
                       <div className="flex-1 flex p-4 gap-4">
                          <div className="w-16 flex flex-col gap-2">
                             <div className="h-16 w-full bg-blue-50 rounded-lg"></div>
                             <div className="h-8 w-full bg-gray-50 rounded-lg"></div>
                          </div>
                          <div className="flex-1 space-y-3">
                             <div className="h-6 w-3/4 bg-gray-100 rounded"></div>
                             <div className="space-y-2">
                                <div className="h-2 w-full bg-gray-50 rounded"></div>
                                <div className="h-2 w-full bg-gray-50 rounded"></div>
                                <div className="h-2 w-5/6 bg-gray-50 rounded"></div>
                             </div>
                             <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-2">
                                <div className="w-6 h-6 rounded bg-blue-200/50"></div>
                                <div className="flex-1 h-6 bg-blue-100/30 rounded"></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
             </div>
             
             {/* Background Decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-blue-100/30 to-purple-100/30 blur-3xl rounded-full -z-0 pointer-events-none"></div>
          </div>
       </div>
    </div>
  );
};


// --- HELPER COMPONENTS ---

const getIconForType = (type: ProjectItem['type'] | SourceType) => {
  switch (type) {
    case 'Web': case 'link': case 'article': return <GlobeIcon className="w-4 h-4 text-blue-500" />;
    case 'PDF': case 'pdf': return <PdfIcon className="w-4 h-4 text-red-500" />;
    case 'Note': case 'text': return <FileTextIcon className="w-4 h-4 text-green-500" />;
    case 'Video': case 'video': return <PlayCircleIcon className="w-4 h-4 text-purple-500" />;
    case 'Image': case 'image': return <ImageIcon className="w-4 h-4 text-orange-500" />;
    case 'xiaohongshu': return <XiaohongshuIcon className="w-4 h-4 text-red-500" />;
    default: return <FileTextIcon className="w-4 h-4" />;
  }
};

const getSourceIcon = (url: string | undefined, type: ProjectItem['type'] | SourceType) => {
  if (!url) return getIconForType(type);
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('weixin')) return <WeChatIcon className="w-4 h-4 text-[#07C160]" />;
  if (lowerUrl.includes('xiaohongshu')) return <XiaohongshuIcon className="w-4 h-4 text-[#FF2442]" />;
  if (lowerUrl.includes('youtube')) return <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />;
  if (lowerUrl.includes('douyin')) return <DouyinIcon className="w-4 h-4 text-black" />;
  if (lowerUrl.includes('bilibili')) return <BilibiliIcon className="w-4 h-4 text-[#00AEEC]" />;
  
  return getIconForType(type);
}

const getHostname = (url?: string) => {
    if (!url) return '';
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
};

const getIconForWork = (type: string) => {
    switch (type) {
      case 'Doc': return <FileTextIcon className="w-5 h-5 text-gray-500" />;
      case 'Slide': return <ImageIcon className="w-5 h-5 text-gray-500" />;
      case 'Page': return <LayoutIcon className="w-5 h-5 text-gray-500" />;
      case 'image': case 'Image': return <ImageIcon className="w-5 h-5 text-gray-500" />;
      case 'video': case 'Video': return <PlayCircleIcon className="w-5 h-5 text-gray-500" />;
      case 'pdf': case 'PDF': return <PdfIcon className="w-5 h-5 text-gray-500" />;
      case 'text': case 'Note': return <FileTextIcon className="w-5 h-5 text-gray-500" />;
      default: return <FileTextIcon className="w-5 h-5" />;
    }
};

const AddLinkModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (url: string) => Promise<void> }> = ({ isOpen, onClose, onAdd }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const normalizeInput = (val: string) => {
        const match = val.match(/https?:\/\/\S+/);
        if (match && match[0]) {
            // Cut off at whitespace to avoid trailing share text
            return match[0].split(/\s/)[0];
        }
        return val.trim();
    };

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!url.trim()) return;
        setLoading(true);
        await onAdd(url);
        setLoading(false);
        setUrl('');
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-4">Add Link</h3>
                <input 
                    type="text" 
                    placeholder="Paste URL here (WeChat, YouTube, Web, XHS)..." 
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-black focus:outline-none"
                    value={url}
                    onChange={e => setUrl(normalizeInput(e.target.value))}
                    autoFocus
                    disabled={loading}
                />
                
                {/* Loading Indicator */}
                {loading && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                        <span>Smart fetching content from backend...</span>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button 
                        disabled={!url.trim() || loading}
                        onClick={handleSubmit}
                    >
                        {loading ? 'Adding...' : 'Confirm Add'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ... RenameModal and MoveToModal ...

const RenameModal: React.FC<{ isOpen: boolean; onClose: () => void; onRename: (newName: string) => void; initialName: string }> = ({ isOpen, onClose, onRename, initialName }) => {
  const [name, setName] = useState(initialName);
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95">
              <h3 className="text-lg font-bold mb-4">Rename Item</h3>
              <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-black focus:outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
              />
              <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={onClose}>Cancel</Button>
                  <Button 
                      disabled={!name.trim()}
                      onClick={() => { onRename(name); }}
                  >
                      Save
                  </Button>
              </div>
          </div>
      </div>
  );
};

const MoveToModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onMove: (targetId: string, isProject: boolean) => void;
  projects: Project[];
  currentProject: Project;
}> = ({ isOpen, onClose, onMove, projects, currentProject }) => {
  const [tab, setTab] = useState<'projects' | 'groups'>('projects');
  
  if (!isOpen) return null;

  // Filter projects to exclude current one if needed, or show all
  const otherProjects = projects.filter(p => p.id !== currentProject.id);
  const groupsInCurrentProject = currentProject.items.filter(i => i.type === 'folder');

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-gray-100">
               <h3 className="text-lg font-bold">Move to...</h3>
            </div>
            
            <div className="flex border-b border-gray-100">
               <button 
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'projects' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => setTab('projects')}
               >
                  Projects
               </button>
               <button 
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'groups' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => setTab('groups')}
               >
                  Groups
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
               {tab === 'projects' ? (
                  otherProjects.length > 0 ? (
                    otherProjects.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => onMove(p.id, true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                         <span className="text-gray-500">{p.icon}</span>
                         <span className="font-medium text-gray-700">{p.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">No other projects available.</div>
                  )
               ) : (
                  groupsInCurrentProject.length > 0 ? (
                    groupsInCurrentProject.map(g => (
                      <button 
                        key={g.id}
                        onClick={() => onMove(g.id, false)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                         <FolderIcon className="w-5 h-5 text-gray-400" />
                         <span className="font-medium text-gray-700">{g.title}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">No groups in this project.</div>
                  )
               )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
        </div>
    </div>
  );
};

const PublishModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  work: Work | null;
  onPublished?: (info: PublishInfo) => void;
}> = ({ isOpen, onClose, work, onPublished }) => {
  const [platform, setPlatform] = useState<'wechat' | 'xiaohongshu'>('wechat');
  const [wechatType, setWechatType] = useState<'article' | 'greenbook'>('article');
  const [accountId, setAccountId] = useState(WECHAT_ACCOUNTS[0]?.wechatAppid || '');
  const [title, setTitle] = useState(work?.title || '');
  const [coverUrl, setCoverUrl] = useState(work?.imageUrl || work?.images?.[0] || '');
  const [body, setBody] = useState(work?.content || '');
  const [imageInput, setImageInput] = useState('');
  const [images, setImages] = useState<string[]>(work?.images || (work?.imageUrl ? [work.imageUrl] : []));
  const [tagsInput, setTagsInput] = useState('');
  const [noteId, setNoteId] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<WechatAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTitle(work?.title || '');
    setCoverUrl(work?.imageUrl || work?.images?.[0] || '');
    setBody(work?.content || '');
    setImages(work?.images || (work?.imageUrl ? [work.imageUrl] : []));
    setTagsInput('');
    setNoteId('');
    setIdempotencyKey(generateIdempotencyKey());
  }, [work?.id, work?.title, work?.imageUrl, work?.images, work?.content]);

  useEffect(() => {
    if (!isOpen || platform !== 'wechat') return;
    if (accounts.length > 0 || accountsLoading) return;
    setAccountsLoading(true);
    setAccountsError(null);
    fetchWechatAccounts()
      .then(list => {
        setAccounts(list);
        if (list.length > 0) {
          setAccountId(list[0].wechatAppid);
        }
      })
      .catch((err: any) => {
        setAccountsError(err?.message || '获取公众号列表失败');
      })
      .finally(() => setAccountsLoading(false));
  }, [isOpen, platform, accounts.length, accountsLoading]);

  if (!isOpen) return null;

  const handleAddImage = () => {
    const trimmed = imageInput.trim();
    if (!trimmed) return;
    setImages(prev => [...prev, trimmed]);
    setImageInput('');
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setNotice(null);

    const trimmedTitle = (title || '').trim();
    const trimmedBody = (body || '').trim();
    const baseContent = trimmedBody || (work?.content || '');
    const extractedImages = extractImagesFromContent(baseContent);
    const mergedImages = Array.from(new Set([
      ...(images || []),
      ...(work?.images || []),
      ...(work?.imageUrl ? [work.imageUrl] : []),
      ...extractedImages,
    ].filter(Boolean)));
    const resolvedCover = (coverUrl || mergedImages[0] || '').trim();

    if (platform === 'wechat') {
      if (!accountId) {
        setSubmitError('请选择公众号');
        return;
      }

      if (!trimmedTitle) {
        setSubmitError('请填写标题');
        return;
      }

      const safeTitle = trimmedTitle.slice(0, 64);
      const wechatAppid = accountId;

      let finalBody = baseContent;
      let truncated = false;

      if (wechatType === 'greenbook') {
        if (!mergedImages || mergedImages.length === 0) {
          setSubmitError('小绿书至少需要1张图片');
          return;
        }
        if (finalBody.length > 1000) {
          finalBody = finalBody.slice(0, 1000);
          truncated = true;
        }
        // 确保图片出现在内容中
        const missingMd = mergedImages.filter(img => !finalBody.includes(img)).map(img => `![image](${img})`);
        if (missingMd.length > 0) {
          finalBody = `${finalBody ? `${finalBody}\n\n` : ''}${missingMd.join('\n')}`;
        }
      }

      const summary = finalBody ? finalBody.slice(0, 120) : undefined;
      const articleType: 'news' | 'newspic' = wechatType === 'greenbook' ? 'newspic' : 'news';

      let coverImageToUse: string | undefined = resolvedCover || undefined;
      if (coverImageToUse?.startsWith('data:')) {
        coverImageToUse = undefined;
        setNotice(prev => prev ? prev : '封面为 data URL，已忽略以避免过长导致发布失败');
      } else if (coverImageToUse && coverImageToUse.length > 240) {
        coverImageToUse = undefined;
        setNotice(prev => prev ? prev : '封面链接过长，已忽略以避免发布失败');
      }

      const payload: PublishWechatPayload = {
        wechatAppid,
        title: safeTitle,
        content: finalBody || (work?.content || ''),
        summary,
        coverImage: coverImageToUse,
        contentFormat: 'markdown',
        articleType,
      };

      setIsSubmitting(true);
      try {
        await publishWechatArticle(payload);
        if (truncated) {
          setNotice('正文超过1000字，已自动截断后发布');
        }
        alert('发布成功，已提交到公众号草稿箱');
        onPublished?.({ platform: 'wechat', wechatAppid, articleType, truncated });
        onClose();
      } catch (err: any) {
        const msg = err?.message || '发布失败，请稍后重试';
        setSubmitError(msg);
        alert(`发布失败：${msg}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // --- 小红书 ---
    const cleanedTitle = (trimmedTitle || work?.title || '').trim().slice(0, 64);
    const pureText = stripMarkdownAndHtml(baseContent);
    if (!cleanedTitle && !pureText) {
      setSubmitError('标题和正文至少填写一项');
      return;
    }
    if (!resolvedCover) {
      setSubmitError('请填写封面图');
      return;
    }

    const tags = tagsInput
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const imagesForPayload = resolvedCover ? (mergedImages.includes(resolvedCover) ? mergedImages : [resolvedCover, ...mergedImages]) : mergedImages;

    const payload: PublishXhsPayload = {
      title: cleanedTitle || undefined,
      content: pureText || undefined,
      coverImage: resolvedCover,
      images: imagesForPayload,
      tags: tags.length ? tags : undefined,
      noteId: noteId.trim() || undefined,
    };

    const finalIdempotency = idempotencyKey || generateIdempotencyKey();

    setIsSubmitting(true);
    try {
      const resp = await publishXhsNote(payload, finalIdempotency);
      const data = resp?.data || {};
      alert('发布成功，已生成扫码二维码');
      onPublished?.({ 
        platform: 'xiaohongshu', 
        publishUrl: data.publish_url, 
        qrImageUrl: data.xiaohongshu_qr_image_url, 
        noteId: data.note_id 
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message || '发布失败，请稍后重试';
      setSubmitError(msg);
      alert(`发布失败：${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disablePublish = isSubmitting || (platform === 'wechat' ? !title.trim() : (!title.trim() && !(body || '').trim()));

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 h-[640px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Publish</p>
            <h3 className="text-lg font-bold text-gray-900">Publish {work?.title || 'this work'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">选择发布平台</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPlatform('wechat')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${platform === 'wechat' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-800'}`}
              >
                <WeChatIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-semibold">公众号</div>
                  <div className="text-xs text-gray-400">文章 / 小绿书</div>
                </div>
              </button>
              <button
                onClick={() => setPlatform('xiaohongshu')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${platform === 'xiaohongshu' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-800'}`}
              >
                <XiaohongshuIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-semibold">小红书</div>
                  <div className="text-xs text-gray-400">图文/笔记</div>
                </div>
              </button>
            </div>
          </div>

          {platform === 'wechat' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">选择公众号</label>
                <div className="mt-2 relative">
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    disabled={accountsLoading || !!accountsError}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    {(accounts.length > 0 ? accounts : WECHAT_ACCOUNTS).map(acc => (
                      <option key={acc.wechatAppid || acc.id} value={acc.wechatAppid || acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                  {accountsLoading && <p className="text-[11px] text-gray-400 mt-1">加载公众号列表...</p>}
                  {accountsError && (
                    <div className="text-[11px] text-red-500 mt-1">
                      {accountsError} <button className="underline" onClick={() => { setAccounts([]); setAccountsLoading(false); setAccountsError(null); }}>重试</button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">发布形式</label>
                <div className="mt-2 flex items-center gap-2">
                  {[
                    { key: 'article', label: '文章' },
                    { key: 'greenbook', label: '小绿书' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setWechatType(opt.key as 'article' | 'greenbook')}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${wechatType === opt.key ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {platform === 'xiaohongshu' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                发布将扣除 1 积分；建议填写幂等键避免重复扣费，接口返回的发布链接会用于生成扫码二维码。
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">标签（可选，逗号分隔）</label>
                  <input
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="效率, 职场, 生活方式"
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">自定义 noteId（可选）</label>
                  <input
                    value={noteId}
                    onChange={e => setNoteId(e.target.value)}
                    placeholder="用于幂等、去重"
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Idempotency-Key（可选，推荐填写）</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={idempotencyKey}
                      onChange={e => setIdempotencyKey(e.target.value)}
                      placeholder="避免重复扣费的幂等键"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                    />
                    <Button variant="secondary" onClick={() => setIdempotencyKey(generateIdempotencyKey())}>重新生成</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">发布标题</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="请输入发布标题"
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">封面图（URL）</label>
              <input
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">正文图片（可选）</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={imageInput}
                  onChange={e => setImageInput(e.target.value)}
                  placeholder="图片链接"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                />
                <Button variant="secondary" onClick={handleAddImage}>添加</Button>
              </div>
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-700">
                      <span className="truncate max-w-[160px]">{img}</span>
                      <button onClick={() => handleRemoveImage(idx)} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">正文</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="请输入正文，将用于公众号或小红书发布"
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none resize-none"
            />
            <div className="text-xs text-gray-400 text-right mt-1">{(body || '').length} 字</div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-xs text-gray-500">
            {notice || (platform === 'wechat' ? '发布到公众号草稿箱（API已接入）。' : '发布到小红书并生成扫码二维码（每次扣除 1 积分）。')}
            {submitError && <span className="text-red-500 ml-2">{submitError}</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button onClick={handleSubmit} disabled={disablePublish}>{isSubmitting ? '发布中...' : '发布'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- CHAT REFERENCE PICKER ---

const PublishResultModal: React.FC<{ result: PublishInfo & { platform: 'xiaohongshu' }; onClose: () => void }> = ({ result, onClose }) => {
  const qrSrc = result.qrImageUrl || (result.publishUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(result.publishUrl)}` : '');

  const handleCopy = () => {
    if (result.publishUrl && navigator?.clipboard) {
      navigator.clipboard.writeText(result.publishUrl).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">发布成功 · 小红书</p>
            <h3 className="text-lg font-bold text-gray-900">扫码在手机端查看</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        {qrSrc ? (
          <div className="w-full flex justify-center">
            <img src={qrSrc} alt="Xiaohongshu QR" className="w-56 h-56 object-contain rounded-xl border border-gray-100 shadow-sm bg-white" />
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-4">
            未返回二维码，您可以复制发布链接在手机端打开。
          </div>
        )}
        <div className="space-y-2">
          {result.publishUrl && (
            <div className="text-xs text-gray-500 break-all bg-gray-50 border border-gray-100 rounded-lg p-3">
              {result.publishUrl}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {result.publishUrl && (
              <Button variant="secondary" onClick={handleCopy}>复制链接</Button>
            )}
            <Button onClick={onClose}>关闭</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LocalFileItem {
  id: string;
  type: 'local-file';
  title: string;
  file: File;
}

interface TextSelectionItem {
  id: string;
  type: 'text-selection';
  title: string;
  content: string;
  preview: string;
}

interface ChatReferencePickerProps {
  projects: Project[];
  works: Work[];
  selectedIds: Set<string>;
  onToggle: (item: ProjectItem | Work | LocalFileItem | Material) => void;
  onClose: () => void;
}

const ChatReferencePicker: React.FC<ChatReferencePickerProps> = ({ projects, works, selectedIds, onToggle, onClose }) => {
  const [tab, setTab] = useState<'materials' | 'works' | 'local'>('materials');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localItem: LocalFileItem = {
         id: `local-${Date.now()}`,
         type: 'local-file',
         title: file.name,
         file: file
      };
      onToggle(localItem);
      // We don't close automatically for multiple selections, but for file upload maybe we want to keep it open?
      // User can close manually.
    }
  };

  return (
    <div 
       className="absolute bottom-full left-0 mb-3 w-[400px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom-2 zoom-in-95"
       onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <span className="font-semibold text-sm text-gray-700">Add Reference</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
             <XIcon className="w-4 h-4" />
          </button>
       </div>
       
       <div className="flex border-b border-gray-100">
          <button 
             onClick={() => setTab('materials')}
             className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'materials' ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
             Materials
          </button>
          <button 
             onClick={() => setTab('works')}
             className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'works' ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
             Works
          </button>
          <button 
             onClick={() => setTab('local')}
             className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'local' ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
             Local File
          </button>
       </div>

       <div className="flex-1 overflow-y-auto max-h-[300px] bg-white custom-scrollbar">
          {tab === 'materials' && (
             <div className="p-2 space-y-4">
                {projects.map(project => (
                   <div key={project.id}>
                      <div className="px-2 py-1 flex items-center gap-2 mb-1">
                         <span className="text-gray-400 scale-75">{project.icon}</span>
                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{project.name}</h4>
                      </div>
                      <div className="space-y-1">
                         {project.items.length > 0 ? project.items.map(item => {
                            const isSelected = selectedIds.has(item.id);
                            return (
                                <button 
                                   key={item.id}
                                   onClick={() => onToggle(item)}
                                   className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors group ${isSelected ? 'bg-blue-50/50' : ''}`}
                                >
                                   <div className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                                      {isSelected ? <CheckSquareIcon className="w-5 h-5" /> : <SquareIcon className="w-5 h-5" />}
                                   </div>

                                   {item.imageUrl ? (
                                      <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                         <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                      </div>
                                   ) : (
                                      <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                                         {getIconForType(item.type)}
                                      </div>
                                   )}
                                   <div className="min-w-0 flex-1">
                                      <div className={`font-medium text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{item.title || "Untitled"}</div>
                                      <div className="text-xs text-gray-400 truncate mt-0.5">
                                        {item.preview || item.content?.substring(0, 50) || "No preview"}
                                      </div>
                                   </div>
                                </button>
                            );
                         }) : <div className="px-2 text-xs text-gray-300 italic">No materials</div>}
                      </div>
                   </div>
                ))}
             </div>
          )}

          {tab === 'works' && (
             <div className="p-2 space-y-1">
                {works.map(work => {
                   const isSelected = selectedIds.has(work.id);
                   return (
                       <button 
                          key={work.id}
                          onClick={() => onToggle(work)}
                          className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                       >
                           <div className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                              {isSelected ? <CheckSquareIcon className="w-5 h-5" /> : <SquareIcon className="w-5 h-5" />}
                           </div>
                           <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                              {getIconForWork(work.type)}
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className={`font-medium text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{work.title}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{work.date}</div>
                           </div>
                       </button>
                   );
                })}
             </div>
          )}

          {tab === 'local' && (
             <div className="p-6 flex flex-col items-center justify-center text-center h-[200px]">
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                   <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <PaperclipIcon className="w-5 h-5 text-gray-400" />
                   </div>
                   <span className="text-sm font-medium text-gray-600">Click to upload file</span>
                   <span className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, IMG</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
             </div>
          )}
       </div>
    </div>
  );
};

// --- CONTENT RENDERER ---

const ContentRenderer: React.FC<{ item: ProjectItem | Material; isEditing: boolean; editContent: string; editTitle: string; onEditChange: (s: string) => void; onTitleChange: (s: string) => void }> = ({ item, isEditing, editContent, editTitle, onEditChange, onTitleChange }) => {
  // 1. PDF Handling
  if (item.type === 'pdf' || item.type === 'PDF' || (item as any).file?.type === 'application/pdf') {
     const url = (item as any).file ? URL.createObjectURL((item as any).file) : item.sourceUrl;
     return (
       <div className="w-full h-full bg-gray-100 flex flex-col">
          <embed src={url} type="application/pdf" className="w-full h-full" />
       </div>
     );
  }

  // 2. Video Handling (Embeds or Raw)
  if (item.type === 'video' || item.type === 'Video') {
     // Check for raw video file first
     const rawUrl = (item as any).mediaUrl || (item.sourceUrl?.endsWith('.mp4') ? item.sourceUrl : null);
     
     if (rawUrl) {
        return (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center">
             <video 
                src={rawUrl} 
                controls 
                className="max-w-full max-h-full"
                poster={item.imageUrl}
                autoPlay={false}
             />
             <div className="text-white mt-4 font-medium px-4 text-center">{item.title}</div>
          </div>
        );
     }

     // Embed Fallbacks
     const url = item.sourceUrl || item.content;
     if (url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('bilibili'))) {
        let embedUrl = url;
        // Simple Regex for transformation
        if (url?.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url?.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url?.includes('bilibili.com/video/')) {
            const bvid = url.split('video/')[1]?.split('/')[0]?.split('?')[0];
            embedUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0`;
        }

        return (
        <div className="w-full h-full bg-black flex items-center justify-center">
            <iframe 
                src={embedUrl} 
                className="w-full h-full" 
                allowFullScreen 
                frameBorder="0"
                title="Video Player"
            />
        </div>
        );
     }
  }

  // 3. Xiaohongshu
  if (item.type === 'xiaohongshu' || item.sourceUrl?.includes('xiaohongshu')) {
      const images = (item as any).images || (item.imageUrl ? [item.imageUrl] : []);
      const hasHtmlContent = typeof item.content === 'string' && item.content.includes('<');

      return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-bold">
                     {item.author ? item.author[0] : 'U'}
                  </div>
              </div>
              <span className="font-bold text-gray-900">{item.author || "Creator"}</span>
              <button className="ml-auto text-gray-900 font-medium text-sm border border-gray-200 px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">Follow</button>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{item.title}</h1>
              <div className="text-xs text-gray-400">
                Published on {(item as any).date || (item as any).timeAgo}
              </div>
            </div>

            <div className="text-gray-800 leading-relaxed text-base space-y-3">
              {hasHtmlContent ? (
                <article 
                  className="prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-img:rounded-xl prose-img:shadow-sm"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{item.content || "No content description available."}</p>
              )}
            </div>

            {images.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {images.map((img: string, idx: number) => (
                  <div key={idx} className="w-full bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={img} className="w-full h-auto object-contain" alt={`Image ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
  }

  // 4. Generic Link / Webpage (Iframe)
  // If we have scraped content (title, content, author), we prefer to show that in "Note" mode 
  // rather than a blocked iframe.
  // The 'link' type is now a fallback if scraping failed or if it is purely a tool link.
  if (item.type === 'link' || item.type === 'Web') {
     const displayUrl = item.sourceUrl || item.content;
     return (
        <div className="w-full h-full bg-gray-50 flex flex-col">
           <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 text-sm text-gray-500 shadow-sm z-10">
              <LockIcon className="w-3 h-3" />
              <input className="flex-1 bg-transparent outline-none text-gray-600" value={displayUrl} readOnly />
              <button onClick={() => window.open(displayUrl, '_blank')} className="cursor-pointer hover:text-gray-900 text-gray-500">
                 <ExternalLinkIcon className="w-4 h-4" />
              </button>
           </div>
           <iframe src={displayUrl} className="flex-1 w-full bg-white" title="Web Preview" />
        </div>
     )
  }
  
  // 5. Image 
  if (item.type === 'image' || item.type === 'Image') {
      return (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
              <img src={item.imageUrl || (item as any).content || (item as any).file && URL.createObjectURL((item as any).file)} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" alt={item.title} />
          </div>
      );
  }

  // 6. Default Text / Note / Article (Fetched Content)
  const isWideArticle = item.type === 'article' || item.sourceUrl?.includes('mp.weixin.qq.com') || (typeof item.content === 'string' && item.content.includes('<'));
  const containerClass = isEditing 
    ? "w-full mx-auto h-full flex flex-col p-8 lg:px-12 overflow-y-auto custom-scrollbar"
    : isWideArticle 
      ? "w-full h-full flex flex-col p-8 lg:px-12 overflow-y-auto custom-scrollbar"
      : "max-w-3xl mx-auto h-full flex flex-col p-8 lg:px-12 overflow-y-auto custom-scrollbar";
  const innerClass = isWideArticle ? "max-w-5xl mx-auto w-full" : "w-full";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
         {isEditing ? (
           <div className="w-full space-y-3">
             <style>{`
               .quill-editor .ql-toolbar {
                 border: none;
                 border-bottom: 1px solid #e5e7eb;
                 border-radius: 14px 14px 0 0;
                 background: #fafafa;
                 padding: 12px;
               }
               .quill-editor .ql-container {
                 border: 1px solid #e5e7eb;
                 border-top: 0;
                 border-radius: 0 0 14px 14px;
                 min-height: 420px;
                 background: #fff;
               }
               .quill-editor .ql-editor {
                 min-height: 360px;
                 padding: 18px 18px 32px;
                 font-size: 16px;
                 line-height: 1.65;
               }
               .quill-editor .ql-editor.ql-blank::before {
                 left: 18px;
                 color: #9ca3af;
               }
             `}</style>

             <input
               value={editTitle}
               onChange={(e) => onTitleChange(e.target.value)}
               placeholder="给笔记起个标题吧"
               className="w-full bg-white text-3xl font-bold text-gray-900 placeholder:text-gray-300 outline-none border border-gray-100 rounded-xl px-4 py-3 shadow-sm focus:border-gray-300"
             />

             <div className="quill-editor w-full">
               <ReactQuill
                  theme="snow"
                  value={editContent}
                  onChange={onEditChange}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder="开始记录你的笔记，支持字体颜色、列表、链接和图片"
               />
             </div>
           </div>
         ) : (
           <>
             <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
               {item.title}
             </h1>
             
             {/* Meta */}
             <div className="flex items-center gap-3 mb-8">
                {/* Source Logo */}
                {item.sourceUrl ? (
                   <div className="flex items-center gap-2">
                       {getSourceIcon(item.sourceUrl, item.type)}
                       <span className="text-xs font-bold text-gray-900">
                           {getHostname(item.sourceUrl)}
                       </span>
                   </div>
                ) : null}

                {item.author ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                         <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-[10px] text-white font-bold">{item.author[0]}</div>
                         <span className="text-xs font-medium text-gray-700">{item.author}</span>
                    </div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold">A</div>
                )}
                
                <div className="text-xs text-gray-500">
                   <p>{(item as any).date || (item as any).timeAgo}</p>
                </div>
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" className="ml-auto text-gray-400 hover:text-blue-500 flex items-center gap-1 text-xs">
                     <LinkIcon className="w-3 h-3"/> Original
                  </a>
                )}
             </div>
             
             {/* Cover Image */}
             {item.imageUrl && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
                   <img src={item.imageUrl} alt="Cover" className="w-full object-cover max-h-[400px]" />
                </div>
             )}

             {/* Body */}
             {item.type === 'article' || (typeof item.content === 'string' && item.content.includes('<')) ? (
                 <article 
                    className="prose prose-gray max-w-none prose-p:text-gray-700 prose-p:leading-loose prose-headings:font-bold prose-headings:text-gray-900 prose-img:rounded-xl prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                 />
             ) : (
                 <div className="prose prose-gray max-w-none prose-p:text-gray-700 prose-p:leading-loose prose-headings:font-bold prose-headings:text-gray-900">
                    <MarkdownMessage content={(item.content || editContent || '').toString()} />
                 </div>
             )}
           </>
         )}
      </div>
    </div>
  );
}

// ... (Rest of the file remains unchanged, including WorkPreviewView, ProjectDetailView, WorkspacePage) ...

const WorkPreviewView: React.FC<{ work: Work; onBack: () => void; onSelectText?: () => void; onPublished?: (workId: string, info: PublishInfo) => void }> = ({ work, onBack, onSelectText, onPublished }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const images = work.images || (work.imageUrl ? [work.imageUrl] : []);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishInfo | null>(null);

  return (
    <>
      <div className="flex flex-col h-full bg-white relative rounded-2xl overflow-hidden shadow-sm">
      {/* Work Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
               <HomeIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center text-gray-300 gap-2">
               <ChevronLeftIcon className="w-4 h-4" />
               <ChevronRightIcon className="w-4 h-4" />
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-500 text-sm cursor-pointer">
               <ImageIcon className="w-4 h-4" />
               <span>Add Cover</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-500 text-sm cursor-pointer">
               <SparklesIcon className="w-4 h-4" />
               <span>Generate Title</span>
            </div>
         </div>

         <div className="flex items-center gap-2 relative">
             <button 
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                onClick={() => setShowPublishModal(true)}
             >
               <ShareIcon className="w-5 h-5" />
             </button>
             <button 
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                onClick={() => setShowDropdown(!showDropdown)}
             >
               <MoreHorizontalIcon className="w-5 h-5" />
             </button>

             {/* Dropdown Menu */}
             {showDropdown && (
                <div className="absolute top-10 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2">
                   <div className="px-1 space-y-0.5">
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><EditIcon className="w-4 h-4"/> Rename</div>
                      </button>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><FolderIcon className="w-4 h-4"/> Move to</div>
                         <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><CopyIcon className="w-4 h-4"/> Duplicate</div>
                      </button>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><FileTextIcon className="w-4 h-4"/> Copy Official Account Format</div>
                         <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><DownloadIcon className="w-4 h-4"/> Export as</div>
                         <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><CopyIcon className="w-4 h-4"/> Copy as</div>
                         <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><FileTextIcon className="w-4 h-4"/> Convert to note</div>
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left">
                         <div className="flex items-center gap-3"><TrashIcon className="w-4 h-4"/> Delete</div>
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <div className="px-3 py-2 text-xs text-gray-400">
                         Word count: 464 words
                      </div>
                   </div>
                </div>
             )}
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar" onMouseUp={onSelectText}>
         <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{work.title}</h1>
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {images.map((img, idx) => (
                  <div key={idx} className="w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <img
                      src={img}
                      alt={`${work.title || 'Work'} image ${idx + 1}`}
                      className="w-full h-auto object-contain bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="prose prose-lg prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold">
               {work.content ? (
                 work.content.split('\n').map((para, i) => (
                    <p key={i} className={para.startsWith('--') ? 'text-gray-400 text-sm' : ''}>{para}</p>
                 ))
               ) : images.length === 0 ? (
                 <p className="text-gray-400 italic">No content available for this preview.</p>
               ) : null}
            </div>
         </div>
      </div>
    </div>
      <PublishModal 
        isOpen={showPublishModal} 
        onClose={() => setShowPublishModal(false)} 
        work={work} 
        onPublished={(info) => {
          if (info.platform === 'wechat') {
            onPublished?.(work.id, info);
          } else {
            setPublishResult(info);
            onPublished?.(work.id, info);
          }
        }}
      />
      {publishResult && publishResult.platform === 'xiaohongshu' && (
        <PublishResultModal 
          result={publishResult as PublishInfo & { platform: 'xiaohongshu' }} 
          onClose={() => setPublishResult(null)} 
        />
      )}
    </>
  );
};

const ProjectDetailView: React.FC<{ 
  project: Project;
  projects: Project[]; 
  works: Work[];
  initialMaterialId?: string;
  onBack: () => void;
  onSwitchProject: (p: Project) => void;
  onUpdateProject: (p: Project) => void;
  onUpdateWorks: React.Dispatch<React.SetStateAction<Work[]>>;
}> = ({ project, projects, works, initialMaterialId, onBack, onSwitchProject, onUpdateProject, onUpdateWorks }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | ProjectItem>(() => {
    if (initialMaterialId) {
       const found = MOCK_MATERIALS.find(m => m.id === initialMaterialId);
       const foundInProject = project.items.find(i => i.id === initialMaterialId);
       if (found) return found;
       if (foundInProject) return foundInProject;
    }
    return MOCK_MATERIALS[0];
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'materials' | 'works'>('materials');
  const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set()); 
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [worksListMode, setWorksListMode] = useState<'works' | 'materials'>('works');
  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());
  const [templatePrompts, setTemplatePrompts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    CREATION_TEMPLATES.forEach(t => {
      map[t.id] = t.defaultPrompt || t.description;
    });
    return map;
  });
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [showLongformTool, setShowLongformTool] = useState(false);
  const [longformContext, setLongformContext] = useState<{ ratio?: string; prompt?: string; selectedMaterialIds: string[]; selectedWorkIds: string[]; title?: string; text?: string }>({
    ratio: '3:4',
    prompt: '',
    selectedMaterialIds: [],
    selectedWorkIds: [],
    title: '',
    text: ''
  });
  const [isSavingLongformWork, setIsSavingLongformWork] = useState(false);

  // Chat History
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedReplyIndex, setCopiedReplyIndex] = useState<number | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Note / Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Dropdown & Modal State
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent Menu State
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [selectedAgentMode, setSelectedAgentMode] = useState('agent');
  const agentMenuRef = useRef<HTMLDivElement>(null);

  // Model Selector State
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [selectedImageModel, setSelectedImageModel] = useState('nano-banana-pro'); // Default Image Model
  const [showModelSelector, setShowModelSelector] = useState(false);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  // Image Config State (Size & Style)
  const [imageSize, setImageSize] = useState('Square'); // Horizontal, Square, Vertical
  const [imageStyle, setImageStyle] = useState('ghibli');
  const [showImageStyleSelector, setShowImageStyleSelector] = useState(false);
  const imageStyleSelectorRef = useRef<HTMLDivElement>(null);
  const [longFormAspect, setLongFormAspect] = useState<LongFormAspect>('3:4');

  // Material Context Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{isOpen: boolean, itemId: string | null}>({ isOpen: false, itemId: null });
  const [moveModal, setMoveModal] = useState<{isOpen: boolean, itemId: string | null}>({ isOpen: false, itemId: null });
  const menuRef = useRef<HTMLDivElement>(null);

  // Column resizing state
  const [leftColWidth, setLeftColWidth] = useState(288); // Default 288px (w-72)
  const [rightColWidth, setRightColWidth] = useState(480); // Default 480px (was 400px)
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Material Filter State
  const [filterType, setFilterType] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Chat References State
  const [chatReferences, setChatReferences] = useState<(ProjectItem | Work | LocalFileItem | Material | TextSelectionItem)[]>([]);
  const [showRefPicker, setShowRefPicker] = useState(false);
  const refPickerRef = useRef<HTMLButtonElement>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  function resetTemplateSelections() {
    setSelectedContextIds(new Set());
    setSelectedWorkIds(new Set());
    setSelectedWork(null);
    setChatReferences([]);
  }

  const handleCloseLongformTool = () => {
    setShowLongformTool(false);
    setSelectedTemplate(null);
    setWorksListMode('works');
    resetTemplateSelections();
    setIsSavingLongformWork(false);
  };

  // Shortcut Menu State
  const [showShortcutMenu, setShowShortcutMenu] = useState(false);
  const shortcutMenuRef = useRef<HTMLDivElement>(null);
  const shortcutAgentMenuRef = useRef<HTMLDivElement>(null);
  const shortcutModelSelectorRef = useRef<HTMLDivElement>(null);
  const shortcutImageStyleSelectorRef = useRef<HTMLDivElement>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutCommand[]>(DEFAULT_SHORTCUT_COMMANDS);
  const [activeShortcutId, setActiveShortcutId] = useState<string | null>(DEFAULT_SHORTCUT_COMMANDS[0]?.id || null);
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);
  const [showShortcutAgentMenu, setShowShortcutAgentMenu] = useState(false);
  const [showShortcutModelSelector, setShowShortcutModelSelector] = useState(false);
  const [showShortcutImageStyleSelector, setShowShortcutImageStyleSelector] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (showRefPicker) {
         const target = event.target as Node;
         const isClickInsideButton = refPickerRef.current && refPickerRef.current.contains(target);
         if (!isClickInsideButton) {
            setShowRefPicker(false);
         }
      }
      if (shortcutMenuRef.current && !shortcutMenuRef.current.contains(event.target as Node)) {
        setShowShortcutMenu(false);
      }
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node)) {
        setShowAgentMenu(false);
      }
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
      if (imageStyleSelectorRef.current && !imageStyleSelectorRef.current.contains(event.target as Node)) {
        setShowImageStyleSelector(false);
      }
    };
    if (showAddMenu || activeMenuId || showRefPicker || showShortcutMenu || showAgentMenu || showModelSelector || showImageStyleSelector) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAddMenu, activeMenuId, showRefPicker, showShortcutMenu, showAgentMenu, showModelSelector, showImageStyleSelector]);

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 600) {
           setLeftColWidth(newWidth);
        }
      }
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 300 && newWidth < 800) {
           setRightColWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Close shortcut overlay dropdowns on outside click
  useEffect(() => {
    if (!showShortcutOverlay) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showShortcutAgentMenu && shortcutAgentMenuRef.current && !shortcutAgentMenuRef.current.contains(target)) {
        setShowShortcutAgentMenu(false);
      }
      if (showShortcutModelSelector && shortcutModelSelectorRef.current && !shortcutModelSelectorRef.current.contains(target)) {
        setShowShortcutModelSelector(false);
      }
      if (showShortcutImageStyleSelector && shortcutImageStyleSelectorRef.current && !shortcutImageStyleSelectorRef.current.contains(target)) {
        setShowShortcutImageStyleSelector(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showShortcutOverlay, showShortcutAgentMenu, showShortcutModelSelector, showShortcutImageStyleSelector]);

  // Reset left list mode when re-entering works tab
  useEffect(() => {
    if (activeTab === 'works') {
      setWorksListMode('works');
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedTemplate?.id === 't-longform-image') {
      setLongFormAspect('3:4');
      setWorksListMode('works');
      setSelectedWorkIds(new Set());
      setChatReferences([]);
      setSelectedWork(null);
    }
  }, [selectedTemplate?.id]);

  useEffect(() => {
    if (editingTemplate) {
      setEditingPrompt(templatePrompts[editingTemplate.id] || editingTemplate.defaultPrompt || '');
    }
  }, [editingTemplate, templatePrompts]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Load & persist shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SHORTCUT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ShortcutCommand[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShortcuts(parsed);
          setActiveShortcutId(parsed[0]?.id || null);
        }
      } catch (err) {
        console.warn('Failed to parse shortcuts from storage', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(shortcuts));
    } catch (err) {
      console.warn('Failed to persist shortcuts', err);
    }
  }, [shortcuts]);

  // Sync edit content when selected material changes
  useEffect(() => {
    const projectItem = project.items.find(i => i.id === selectedMaterial.id);
    if (projectItem && projectItem.content !== undefined) {
        setEditContent(projectItem.content);
        setEditTitle(projectItem.title || '');
    } else {
        const mock = MOCK_MATERIALS.find(m => m.id === selectedMaterial.id);
        setEditContent(mock?.content || '');
        setEditTitle(mock?.title || '');
    }
  }, [selectedMaterial.id, project.items]);


  const toggleContextSelection = (id: string) => {
    const newSet = new Set(selectedContextIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContextIds(newSet);
  };

  const toggleWorkSelection = (work: Work) => {
    setSelectedWorkIds(prev => {
      const next = new Set(prev);
      if (next.has(work.id)) {
        next.delete(work.id);
      } else {
        next.add(work.id);
      }
      const refs = works.filter(w => next.has(w.id));
      setChatReferences(refs);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedContextIds.size === MOCK_MATERIALS.length) {
      setSelectedContextIds(new Set());
    } else {
      setSelectedContextIds(new Set(MOCK_MATERIALS.map(m => m.id)));
    }
  };

  const handleGenerateTemplate = () => {
    if (!selectedTemplate) return;
    if (selectedTemplate.id === 't-longform-image') {
      const selectedWorksArr = works.filter(w => selectedWorkIds.has(w.id));
      const projectMaterials = project.items.filter(i => selectedContextIds.has(i.id));
      const mockMaterials = MOCK_MATERIALS.filter(m => selectedContextIds.has(m.id));

      const primaryTitle = selectedWorksArr[0]?.title || projectMaterials[0]?.title || mockMaterials[0]?.title || '';
      const workBodies = selectedWorksArr.map(w => w.content || '').filter(Boolean);
      const materialBodies = [...projectMaterials, ...mockMaterials].map((m: any) => m.content || '').filter(Boolean);
      const combinedText = [...workBodies, ...materialBodies].filter(Boolean).join('\n\n');

      const state = {
        ratio: longFormAspect,
        prompt: templatePrompts[selectedTemplate.id] || selectedTemplate.description,
        selectedMaterialIds: Array.from(selectedContextIds),
        selectedWorkIds: Array.from(selectedWorkIds),
        title: primaryTitle,
        text: combinedText
      };
      setLongformContext(state);
      setShowLongformTool(true);
      return;
    }
    // TODO: hook up other模板的生成逻辑（当前保持占位）
  };

  const handleSaveLongformWork = () => {
    if (isSavingLongformWork) return;
    setIsSavingLongformWork(true);

    window.dispatchEvent(new CustomEvent('xhs-longimage-save', {
      detail: {
        onSave: (payload: { title?: string; text?: string; images: string[]; coverImage?: string }) => {
          if (!payload?.images?.length) {
            setIsSavingLongformWork(false);
            alert('暂无可保存的图片');
            return;
          }
          const workTitle = payload.title?.trim() || longformContext.title || '长图文作品';
          const workContent = payload.text || longformContext.text || '';
          const newWork: Work = {
            id: `work-${Date.now()}`,
            title: workTitle,
            type: 'Image',
            date: 'Just now',
            content: workContent,
            preview: workContent ? (workContent.substring(0, 100) + (workContent.length > 100 ? '...' : '')) : '',
            imageUrl: payload.coverImage || payload.images[0],
            images: payload.images,
          };
          onUpdateWorks(prev => [newWork, ...prev]);
          setSelectedWork(newWork);
          setWorksListMode('works');
          setIsSavingLongformWork(false);
        },
        onError: (message?: string) => {
          setIsSavingLongformWork(false);
          if (message) {
            alert(message);
          }
        }
      }
    }));
  };

  const handleToggleReference = (item: ProjectItem | Work | LocalFileItem | Material) => {
    setChatReferences(prev => {
       const exists = prev.find(i => i.id === item.id);
       if (exists) {
          return prev.filter(i => i.id !== item.id);
       } else {
          return [...prev, item];
       }
    });
  };
  
  const handleRemoveReference = (id: string) => {
    setChatReferences(prev => prev.filter(i => i.id !== id));
  };

  // 将卡片对应的内容整理为可发给模型的文本/文件（前端不变，只是在发送时打包）
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
      reader.readAsDataURL(file);
    });
  };

  const buildAttachmentText = async (
    refs: (ProjectItem | Work | LocalFileItem | Material | TextSelectionItem)[]
  ): Promise<string> => {
    if (!refs || refs.length === 0) return '';

    const attachments = await Promise.all(refs.map(async (ref) => {
      const base: any = {
        id: (ref as any).id,
        type: (ref as any).type,
        title: (ref as any).title || (ref as any).name || 'Untitled',
        sourceUrl: (ref as any).sourceUrl,
        mediaUrl: (ref as any).mediaUrl,
        images: (ref as any).images,
        preview: (ref as any).preview,
        content: (ref as any).content,
      };

      if ((ref as any).type === 'local-file' && (ref as LocalFileItem).file) {
        const file = (ref as LocalFileItem).file;
        const base64 = await readFileAsBase64(file);
        return {
          ...base,
          file: {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            base64,
          },
        };
      }

      return base;
    }));

    return `附件列表（请作为上下文使用）：\n${JSON.stringify(attachments, null, 2)}`;
  };

  const handleSendMessage = async (messageOverride?: string, options?: { agentMode?: 'agent' | 'ask' | 'write' | 'search' | 'image'; modelId?: string; imageModelId?: string }) => {
    const agentMode = options?.agentMode ?? selectedAgentMode;
    const modelOverride = options?.modelId;

    if (agentMode === 'image') {
      setChatError('图片模型无法用于文本对话，请选择 Ask/Write 模式');
      return;
    }

    const messageToSend = (messageOverride ?? chatInput).trim();
    if (!messageToSend) return;

    const userMsg = { role: 'user', content: messageToSend };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    if (!messageOverride) setChatInput('');
    setChatError(null);
    setIsSendingChat(true);

    try {
      const attachmentText = await buildAttachmentText(chatReferences);
      const payloadHistory = [...chatHistory];
      if (attachmentText) {
        // 单独一条消息承载附件内容，避免影响用户原始输入
        payloadHistory.push({ role: 'user', content: attachmentText });
      }
      payloadHistory.push(userMsg);

      if (options?.agentMode && options.agentMode !== selectedAgentMode) {
        setSelectedAgentMode(options.agentMode);
      }
      if (options?.imageModelId && options?.agentMode === 'image') {
        setSelectedImageModel(options.imageModelId);
      }
      if (modelOverride && options?.agentMode !== 'image') {
        setSelectedModel(modelOverride);
      }

      const modelId = modelOverride || selectedModel || OPENROUTER_FALLBACK_MODEL;
      const reply = await callOpenRouterChat(payloadHistory, modelId);
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
      addWorkFromContent(reply);
    } catch (err: any) {
      const msg = err?.message || '调用大模型失败';
      setChatError(msg);
      setChatHistory(prev => [...prev, { role: 'system', type: 'error', content: msg }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleShortcut = (cmd: ShortcutCommand) => {
    const agentMode = cmd.agentMode || selectedAgentMode;
    const modelId = agentMode === 'image' ? (cmd.imageModelId || selectedImageModel) : (cmd.modelId || selectedModel);

    if (cmd.agentMode) setSelectedAgentMode(cmd.agentMode);
    if (agentMode === 'image' && cmd.imageModelId) setSelectedImageModel(cmd.imageModelId);
    if (agentMode !== 'image' && cmd.modelId) setSelectedModel(cmd.modelId);

    let content = cmd.prompt;
    if (chatReferences.length > 0) {
        const refTitles = chatReferences.map(r => {
             const title = (r as any).title || (r as any).name || "Untitled";
             const type = (r as any).type;
             return `[${type}: ${title}]`;
        }).join(', ');
        content += `\n\n(References: ${refTitles})`;
    }

    handleSendMessage(content, { agentMode, modelId: modelId || undefined, imageModelId: cmd.imageModelId });
  };

  const addShortcutCommand = () => {
    const newShortcut: ShortcutCommand = {
      id: `sc-${Date.now()}`,
      name: '新建快捷指令',
      prompt: '',
      icon: 'sparkles',
      agentMode: selectedAgentMode,
      modelId: selectedModel,
      imageModelId: selectedImageModel
    };
    setShortcuts(prev => [newShortcut, ...prev]);
    setActiveShortcutId(newShortcut.id);
  };

  const updateShortcutCommand = (id: string, updates: Partial<ShortcutCommand>) => {
    setShortcuts(prev => prev.map(sc => sc.id === id ? { ...sc, ...updates } : sc));
  };

  const deleteShortcutCommand = (id: string) => {
    setShortcuts(prev => {
      const next = prev.filter(sc => sc.id !== id);
      if (activeShortcutId === id) {
        setActiveShortcutId(next[0]?.id || null);
      }
      return next;
    });
  };

  const handleCopyResponse = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedReplyIndex(index);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedReplyIndex(null), 1500);
  };

  const handleDownloadResponse = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-response.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveResponseToMaterials = (content: string) => {
    const newItem: ProjectItem = {
      id: `chat-${Date.now()}`,
      type: 'text',
      title: deriveTitleFromContent(content),
      preview: content.substring(0, 80) + (content.length > 80 ? '...' : ''),
      timeAgo: 'Just now',
      content
    };

    const updatedProject = { ...project, items: [newItem, ...project.items] };
    onUpdateProject(updatedProject);
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setChatInput('');
    setChatError(null);
    setIsSendingChat(false);
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setChatInput('');
    setChatError(null);
    setIsSendingChat(false);
    setChatReferences([]);
  };

  const handleTextMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
        const newSelection: TextSelectionItem = {
            id: `sel-${Date.now()}`,
            type: 'text-selection',
            title: 'Selected Text',
            content: text,
            preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        };

        setChatReferences(prev => {
            const others = prev.filter(item => (item as any).type !== 'text-selection');
            return [...others, newSelection];
        });
    }
  };

  const handleCreateNote = () => {
    const newNote: ProjectItem = {
      id: `note-${Date.now()}`,
      type: 'text',
      title: 'Untitled Note',
      preview: '',
      timeAgo: 'Just now',
      content: ''
    };
    const updatedProject = { ...project, items: [newNote, ...project.items] };
    onUpdateProject(updatedProject);
    setSelectedMaterial(newNote);
    setIsEditing(true);
    setShowAddMenu(false);
  };

  // --- MODIFIED: ASYNC HANDLE ADD LINK ---
  const handleAddLink = async (url: string) => {
    // Call the simulation scraper
    const scrapedData = await scrapeUrlContent(url);
    
    // Ensure unique ID even if scraping happens fast
    const uniqueId = `link-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newLink: ProjectItem = {
      id: uniqueId,
      type: scrapedData.type,
      title: scrapedData.title,
      source: getHostname(url),
      timeAgo: 'Just now',
      content: scrapedData.content, 
      sourceUrl: url,
      author: scrapedData.author,
      imageUrl: scrapedData.imageUrl,
      mediaUrl: scrapedData.mediaUrl,
      images: scrapedData.images // Pass the extracted images
    };

    const updatedProject = { ...project, items: [newLink, ...project.items] };
    onUpdateProject(updatedProject);
    setShowLinkModal(false);
    setShowAddMenu(false);
    setSelectedMaterial(newLink);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       let type: ProjectItem['type'] = 'text';
       
       if (file.type.startsWith('image/')) type = 'image';
       else if (file.type.startsWith('video/')) type = 'video';
       else if (file.type === 'application/pdf') type = 'pdf';
       
       const newFile: ProjectItem = {
         id: `file-${Date.now()}`,
         type: type,
         title: file.name,
         preview: `${(file.size / 1024).toFixed(1)} KB`,
         timeAgo: 'Just now',
         content: `File upload: ${file.name}`,
         file: file, 
         imageUrl: type === 'image' ? URL.createObjectURL(file) : undefined
       };
       const updatedProject = { ...project, items: [newFile, ...project.items] };
       onUpdateProject(updatedProject);
       setSelectedMaterial(newFile);
    }
    setShowAddMenu(false);
  };

  const handleCreateGroup = () => {
    const newGroup: ProjectItem = {
      id: `group-${Date.now()}`,
      type: 'folder',
      title: 'New Group',
      timeAgo: 'Just now'
    };
    const updatedProject = { ...project, items: [newGroup, ...project.items] };
    onUpdateProject(updatedProject);
    setShowAddMenu(false);
  };

  const handleContentUpdate = (newContent: string) => {
    setEditContent(newContent);
    const updatedItems = project.items.map(item => {
        if (item.id === selectedMaterial.id) {
            return { ...item, content: newContent, preview: newContent.substring(0, 100) };
        }
        return item;
    });
    const updatedProject = { ...project, items: updatedItems };
    onUpdateProject(updatedProject);
    const updatedSelected = updatedItems.find(i => i.id === selectedMaterial.id);
    if (updatedSelected) setSelectedMaterial(updatedSelected);
  };

  const deriveTitleFromContent = (text: string) => {
    const firstLine = (text || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .find(l => l.length > 0) || '';
    let cleaned = firstLine
      .replace(/^#+\s*/, '')
      .replace(/^[-*•]\s*/, '');
    if (!cleaned) cleaned = 'Chat Response';
    const maxLen = 80;
    return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}...` : cleaned;
  };

  const extractFirstImage = (content: string): string | undefined => {
    const match = content.match(/!\[[^\]]*]\(([^)]+)\)/);
    return match ? match[1] : undefined;
  };

  const addWorkFromContent = (content: string) => {
    const imageUrl = extractFirstImage(content);
    const newWork: Work = {
      id: `work-${Date.now()}`,
      title: deriveTitleFromContent(content),
      type: 'Page',
      date: 'Just now',
      content,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      imageUrl,
      images: imageUrl ? [imageUrl] : undefined,
    };
    onUpdateWorks(prev => [newWork, ...prev]);
    setSelectedWork(newWork);
  };

  const handleTitleUpdate = (newTitle: string) => {
    setEditTitle(newTitle);
    const updatedItems = project.items.map(item => {
        if (item.id === selectedMaterial.id) {
            return { ...item, title: newTitle };
        }
        return item;
    });
    const updatedProject = { ...project, items: updatedItems };
    onUpdateProject(updatedProject);
    const updatedSelected = updatedItems.find(i => i.id === selectedMaterial.id);
    if (updatedSelected) setSelectedMaterial(updatedSelected);
  };

  const handleMarkPublished = (workId: string, info: PublishInfo) => {
    onUpdateWorks(prev => prev.map(w => w.id === workId ? { ...w, publishedTo: Array.from(new Set([...(w.publishedTo || []), info.platform])) } : w));
    if (selectedWork?.id === workId) {
      setSelectedWork(prev => prev ? { ...prev, publishedTo: Array.from(new Set([...(prev.publishedTo || []), info.platform])) } : prev);
    }
  };

  // ... (Rest of component functions: handleDeleteItem, handleRenameItem, handleMoveItem, handleDownloadItem, handleOpenLink, getAgentButtonContent, filteredProjectItems, FILTER_OPTIONS, currentModel, modelOptionsToUse) ...

  const handleDeleteItem = (itemId: string) => {
    const newItems = project.items.filter(i => i.id !== itemId);
    onUpdateProject({ ...project, items: newItems });
    setActiveMenuId(null);
    if (selectedMaterial.id === itemId) {
        setSelectedMaterial(newItems[0] || MOCK_MATERIALS[0]);
    }
  };

  const handleRenameItem = (newName: string) => {
    if (!renameModal.itemId) return;
    const newItems = project.items.map(i => i.id === renameModal.itemId ? { ...i, title: newName } : i);
    onUpdateProject({ ...project, items: newItems });
    setRenameModal({ isOpen: false, itemId: null });
  };

  const handleMoveItem = (targetId: string, isProject: boolean) => {
     if (!moveModal.itemId) return;
     const newItems = project.items.filter(i => i.id !== moveModal.itemId);
     onUpdateProject({ ...project, items: newItems });
     setMoveModal({ isOpen: false, itemId: null });
     setActiveMenuId(null);
     alert(isProject ? `Moved to project!` : `Moved to group!`);
  };

  const handleDownloadItem = (item: ProjectItem) => {
      console.log(`Downloading ${item.title}...`);
      alert(`Started download for: ${item.title}`);
      setActiveMenuId(null);
  };

  const handleOpenLink = (item: ProjectItem) => {
      const url = item.sourceUrl || (item.type === 'link' ? item.content : null);
      if (url) {
          window.open(url, '_blank');
      }
      setActiveMenuId(null);
  };

  const getAgentButtonContent = () => {
    switch(selectedAgentMode) {
        case 'ask': return <><MessageSquareIcon className="w-4 h-4 flex-shrink-0" /> <span className="truncate max-w-[85px]">Ask</span></>;
        case 'search': return <><GlobeIcon className="w-4 h-4 flex-shrink-0" /> <span className="truncate max-w-[85px]">Search Internet</span></>;
        case 'write': return <><PenToolIcon className="w-4 h-4 flex-shrink-0" /> <span className="truncate max-w-[85px]">Write Document</span></>;
        case 'image': return <><ImageIcon className="w-4 h-4 flex-shrink-0" /> <span className="truncate max-w-[85px]">Create Image</span></>;
        default: return <><span className="text-lg leading-none font-bold flex-shrink-0">∞</span> <span className="truncate max-w-[85px]">Agent</span></>;
    }
  };


  // Filter Items Logic
  const filteredProjectItems = project.items.filter(item => {
    if (filterType === 'All') return true;

    const mockItem = MOCK_MATERIALS.find(m => m.id === item.id);
    const itemType = item.type;

    if (filterType === 'Article') {
       return (mockItem && (mockItem.type === 'Web' || mockItem.type === 'PDF')) || (!mockItem && (itemType === 'text' || itemType === 'pdf' || itemType === 'article')); 
    }
    if (filterType === 'Note') {
       return (mockItem && mockItem.type === 'Note') || (!mockItem && itemType === 'text');
    }
    if (filterType === 'Image') {
       return (mockItem && mockItem.type === 'Image') || itemType === 'image';
    }
    if (filterType === 'Link') {
       return itemType === 'link' || itemType === 'xiaohongshu';
    }
    if (filterType === 'Video') {
       return (mockItem && mockItem.type === 'Video') || itemType === 'video';
    }
    if (filterType === 'Other') {
       return itemType === 'folder';
    }
    return true;
  });

  const FILTER_OPTIONS = ['All', 'Article', 'Note', 'Image', 'Link', 'Video', 'Other'];

  const currentModel = selectedAgentMode === 'image' 
    ? IMAGE_MODEL_OPTIONS.find(m => m.id === selectedImageModel)
    : MODEL_OPTIONS.find(m => m.id === selectedModel);

  const modelOptionsToUse = selectedAgentMode === 'image' ? IMAGE_MODEL_OPTIONS : MODEL_OPTIONS;
  const activeShortcut = shortcuts.find(sc => sc.id === activeShortcutId) || shortcuts[0] || null;
  const draftAgentMode = activeShortcut?.agentMode || selectedAgentMode;
  const draftModelId = draftAgentMode === 'image' ? (activeShortcut?.imageModelId || selectedImageModel) : (activeShortcut?.modelId || selectedModel);
  const shortcutModelOptionsToUse = draftAgentMode === 'image' ? IMAGE_MODEL_OPTIONS : MODEL_OPTIONS;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
      {showShortcutOverlay && (
        <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm flex">
          <div className="relative flex-1 bg-[#f6f6f8] overflow-hidden">
             <button 
               onClick={() => setShowShortcutOverlay(false)}
               className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300"
             >
               <XIcon className="w-4 h-4" />
             </button>

             <div className="h-full flex gap-6 px-8 py-6 overflow-hidden">
               <div className="w-72 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                 <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                   <div className="text-sm font-semibold text-gray-900">快捷指令</div>
                 </div>
                 <div className="px-4 py-3">
                   <button 
                     onClick={addShortcutCommand}
                     className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                   >
                     <PlusIcon className="w-4 h-4" /> 新建快捷指令
                   </button>
                 </div>
                 <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
                   {shortcuts.map(sc => {
                     const isActive = sc.id === activeShortcutId;
                     return (
                      <button
                        key={sc.id}
                        onClick={() => setActiveShortcutId(sc.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-2 mb-2 ${isActive ? 'bg-gray-100 border-gray-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                          {renderShortcutIcon(sc.icon)}
                        </span>
                        <span className="truncate text-sm font-medium text-gray-900">{sc.name || '未命名指令'}</span>
                      </button>
                     );
                   })}
                 </div>
               </div>

               <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                        {renderShortcutIcon(activeShortcut?.icon)}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{activeShortcut?.name || '新建快捷指令'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="分享"><ShareIcon className="w-4 h-4" /></button>
                      {activeShortcut && (
                        <button className="p-2 rounded-full hover:bg-red-50 text-red-500" title="删除" onClick={() => deleteShortcutCommand(activeShortcut.id)}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {activeShortcut ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600">名称</label>
                        <input 
                          value={activeShortcut.name}
                          onChange={(e) => updateShortcutCommand(activeShortcut.id, { name: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                          placeholder="输入快捷指令名称"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600">指令</label>
                        <div className="border border-gray-200 rounded-xl bg-gray-50">
                          <textarea 
                            value={activeShortcut.prompt}
                            onChange={(e) => updateShortcutCommand(activeShortcut.id, { prompt: e.target.value })}
                            className="w-full bg-transparent border-none outline-none px-3 py-3 text-sm min-h-[160px] resize-none"
                            placeholder="Ask anything"
                          />
                          <div className="flex items-center justify-between px-3 pb-3">
                             <div className="flex items-center gap-2">
                               <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                                 <PlusIcon className="w-4 h-4" />
                               </button>
                               <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                                 <PaperclipIcon className="w-4 h-4" />
                               </button>
                             </div>
                             <div className="flex items-center gap-2 text-xs text-gray-600">
                               <div className="relative" ref={shortcutAgentMenuRef}>
                                 <button 
                                    onClick={() => setShowShortcutAgentMenu(!showShortcutAgentMenu)}
                                    className="px-2 py-1 rounded-lg bg-white border border-gray-200 flex items-center gap-1 hover:border-gray-300"
                                 >
                                    <span className="text-gray-700">{draftAgentMode === 'write' ? 'Write' : draftAgentMode === 'image' ? 'Image' : draftAgentMode === 'search' ? 'Search' : 'Ask'}</span>
                                    <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                                 </button>
                                 {showShortcutAgentMenu && (
                                   <div className="absolute bottom-full left-0 mb-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 origin-bottom-left">
                                     {['ask','write','search','image'].map(mode => (
                                       <button
                                         key={mode}
                                         onClick={() => { updateShortcutCommand(activeShortcut.id, { agentMode: mode as any }); setShowShortcutAgentMenu(false); }}
                                         className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                       >
                                         <span className="capitalize">{mode}</span>
                                         {draftAgentMode === mode && <CheckIcon className="w-4 h-4 text-gray-900" />}
                                       </button>
                                     ))}
                                   </div>
                                 )}
                               </div>

                               <div className="relative" ref={shortcutModelSelectorRef}>
                                 <button 
                                   onClick={() => setShowShortcutModelSelector(!showShortcutModelSelector)}
                                   className="px-2 py-1 rounded-lg bg-white border border-gray-200 flex items-center gap-1 hover:border-gray-300"
                                 >
                                   {getModelIcon(shortcutModelOptionsToUse.find(m => m.id === draftModelId)?.provider || 'openai')}
                                   <span className="text-gray-700 truncate w-28 text-left">{shortcutModelOptionsToUse.find(m => m.id === draftModelId)?.name || '选择模型'}</span>
                                   <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                                 </button>
                                 {showShortcutModelSelector && (
                                   <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 origin-bottom-left max-h-[320px] overflow-y-auto custom-scrollbar">
                                      {shortcutModelOptionsToUse.map(model => {
                                        const isSelected = draftModelId === model.id;
                                        return (
                                          <button
                                            key={model.id}
                                            onClick={() => {
                                               if (draftAgentMode === 'image') {
                                                 updateShortcutCommand(activeShortcut.id, { imageModelId: model.id });
                                               } else {
                                                 updateShortcutCommand(activeShortcut.id, { modelId: model.id });
                                               }
                                               setShowShortcutModelSelector(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 relative"
                                          >
                                            {getModelIcon(model.provider)}
                                            <span className="truncate">{model.name}</span>
                                            {isSelected && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                          </button>
                                        );
                                      })}
                                   </div>
                                 )}
                               </div>

                               {draftAgentMode === 'image' && (
                                 <div className="relative" ref={shortcutImageStyleSelectorRef}>
                                   <button
                                     onClick={() => setShowShortcutImageStyleSelector(!showShortcutImageStyleSelector)}
                                     className="px-2 py-1 rounded-lg bg-white border border-gray-200 flex items-center gap-1 hover:border-gray-300"
                                   >
                                     <LayoutIcon className="w-4 h-4" />
                                     <span className="text-gray-700">风格</span>
                                     <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                                   </button>
                                   {showShortcutImageStyleSelector && (
                                     <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 px-2">
                                       <div className="text-xs text-gray-500 px-2 mb-2">风格占位（使用主界面的图片配置）</div>
                                     </div>
                                   )}
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-600">描述</label>
                          <span className="text-[11px] text-gray-400">{(activeShortcut.description || '').length}/300</span>
                        </div>
                        <textarea 
                          value={activeShortcut.description || ''}
                          onChange={(e) => updateShortcutCommand(activeShortcut.id, { description: e.target.value.slice(0, 300) })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none min-h-[100px]"
                          placeholder="补充说明，便于区分和分享"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">暂无快捷指令</div>
                  )}
               </div>
             </div>
          </div>
        </div>
      )}
      
      {/* 1. TOP HEADER (White, fixed) */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 z-20 relative shadow-sm">
        
        {/* Left: Back Button & Project Selector */}
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            title="Back to Dashboard"
          >
             <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="h-5 w-px bg-gray-200"></div>

          {/* Project Dropdown Trigger */}
          <div className="relative">
             <button 
               className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors" 
               onClick={() => setShowProjectDropdown(!showProjectDropdown)}
             >
                <div className="text-gray-700">{project.icon}</div>
                <span className="font-semibold text-gray-900 text-sm">{project.name}</span>
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
             </button>

             {/* Dropdown Menu */}
             {showProjectDropdown && (
               <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Project</div>
                   {projects.map(p => (
                       <button 
                          key={p.id}
                          onClick={() => {
                            onSwitchProject(p);
                            setShowProjectDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mx-1 mb-1 transition-colors ${p.id === project.id ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                       >
                          <span className={p.id === project.id ? "text-gray-900" : "text-gray-400"}>{p.icon}</span>
                          <span className={`flex-1 text-left ${p.id === project.id ? "font-bold" : "font-medium"}`}>{p.name}</span>
                          {p.id === project.id && <CheckSquareIcon className="w-4 h-4 text-blue-600" />}
                       </button>
                   ))}
               </div>
             )}
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center gap-6">
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex items-center gap-2 text-sm font-medium py-1 ${activeTab === 'chat' ? 'text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <MessageSquareIcon className="w-4 h-4" />
             Chat
           </button>
           <button 
             onClick={() => setActiveTab('materials')}
             className={`flex items-center gap-2 text-sm font-medium py-1 ${activeTab === 'materials' ? 'text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <SparklesIcon className="w-4 h-4" />
             Materials
           </button>
           <button 
             onClick={() => setActiveTab('works')}
             className={`flex items-center gap-2 text-sm font-medium py-1 ${activeTab === 'works' ? 'text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <PenToolIcon className="w-4 h-4" />
             Works
           </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
           <Button variant="secondary" size="sm" className="h-8 px-3 rounded-full text-xs gap-1 border-gray-200">
             <PlusIcon className="w-3 h-3" /> Invite
           </Button>
           <Button variant="primary" size="sm" className="h-8 px-4 rounded-full text-xs bg-purple-500 hover:bg-purple-600 border-none text-white gap-1">
             <SparklesIcon className="w-3 h-3" /> Upgrade
           </Button>
           <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
             H
           </div>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN LAYOUT CONTAINER (Light Gray Background) */}
      <div className="flex flex-1 overflow-hidden bg-[#F7F7F9] p-3 gap-3">
        
        {/* COLUMN 1: LEFT SIDEBAR (Materials OR Works List) */}
        <div 
          className="bg-white rounded-2xl flex flex-col flex-shrink-0 shadow-sm border border-gray-200/50 overflow-hidden"
          style={{ width: leftColWidth }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
             {activeTab === 'works' ? (
               <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                  <button
                    onClick={() => setWorksListMode('works')}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${worksListMode === 'works' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Works
                  </button>
                  <button
                    onClick={() => setWorksListMode('materials')}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${worksListMode === 'materials' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Materials
                  </button>
               </div>
             ) : (
                <div className="relative" ref={filterRef}>
                   <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center gap-1.5 text-sm font-bold text-gray-900 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                   >
                      <span>{filterType === 'All' ? 'Type' : filterType}</span>
                      <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                   </button>
                   
                   {/* Type Filter Dropdown */}
                   {isFilterOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-30 animate-in fade-in slide-in-from-top-1">
                          {FILTER_OPTIONS.map(opt => (
                              <button 
                                key={opt}
                                onClick={() => { setFilterType(opt); setIsFilterOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
                              >
                                <span>{opt}</span>
                                {filterType === opt && <CheckIcon className="w-4 h-4 text-blue-600" />}
                              </button>
                          ))}
                      </div>
                   )}
                </div>
             )}
             
             <div className="flex gap-2 text-gray-400">
               {activeTab !== 'works' && <SearchIcon className="w-4 h-4 hover:text-gray-600 cursor-pointer" />}
               <MoreHorizontalIcon className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
               {activeTab === 'works' && <span className="text-gray-400 -rotate-90"><ChevronDownIcon className="w-4 h-4"/></span>}
             </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
             {activeTab === 'works' ? (
                worksListMode === 'works' ? (
                  // WORKS LIST
                 works.map(work => (
                    <div 
                      key={work.id} 
                      onClick={() => {
                          if (selectedTemplate?.id === 't-longform-image') {
                            toggleWorkSelection(work);
                            setSelectedWork(null);
                          } else {
                            setSelectedWork(work);
                            setChatReferences([work]);
                          }
                        }}
                      className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${(selectedWork?.id === work.id || selectedWorkIds.has(work.id)) ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                    >
                        <div className="mt-0.5 flex-shrink-0 p-1 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
                          {selectedTemplate?.id === 't-longform-image' ? (
                            selectedWorkIds.has(work.id) ? <CheckSquareIcon className="w-4 h-4 text-gray-900" /> : <SquareIcon className="w-4 h-4 text-gray-400" />
                          ) : (
                            getIconForWork(work.type)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <h4 className={`text-sm font-medium leading-snug mb-1 line-clamp-2 ${(selectedWork?.id === work.id || selectedWorkIds.has(work.id)) ? 'text-gray-900' : 'text-gray-700'}`}>{work.title}</h4>
                            <div className="flex items-center gap-1">
                              {work.publishedTo?.includes('wechat') && (
                                <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] border border-green-100">
                                  已发公众号
                                </span>
                              )}
                              {work.publishedTo?.includes('xiaohongshu') && (
                                <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] border border-red-100">
                                  已发小红书
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{work.date}</span>
                        </div>
                     </div>
                  ))
                ) : (
                  // MATERIALS CHECKLIST (moved from right column)
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2 pt-2">
                      <button 
                        className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                        onClick={toggleSelectAll}
                      >
                        {selectedContextIds.size === MOCK_MATERIALS.length ? (
                          <CheckSquareIcon className="w-4 h-4 text-gray-900" />
                        ) : (
                          <SquareIcon className="w-4 h-4 text-gray-400" />
                        )}
                        <span>Select All</span>
                      </button>
                      <span className="text-[11px] text-gray-400">{selectedContextIds.size} selected</span>
                    </div>
                    {MOCK_MATERIALS.map(material => {
                      const isSelected = selectedContextIds.has(material.id);
                      return (
                        <div 
                           key={material.id} 
                           className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                           onClick={() => toggleContextSelection(material.id)}
                        >
                           <div className="mt-0.5 text-gray-400">
                              {isSelected ? <CheckSquareIcon className="w-4 h-4 text-gray-900" /> : <SquareIcon className="w-4 h-4" /> }
                           </div>
                           <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  {getIconForType(material.type)}
                                  <h4 className={`text-sm leading-snug line-clamp-2 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                     {material.title}
                                  </h4>
                               </div>
                               <div className="text-xs text-gray-400 pl-6 flex items-center justify-between">
                                  <span>{material.date}</span>
                                  {material.sourceUrl && <LinkIcon className="w-3 h-3"/>}
                               </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                )
             ) : (
               // MATERIALS LIST
               filteredProjectItems.length > 0 ? (
                  filteredProjectItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                         const mockMatch = MOCK_MATERIALS.find(m => m.id === item.id);
                         const target = mockMatch || item;
                         setSelectedMaterial(target);
                         setIsEditing(false); // Reset edit mode on select

                         setChatReferences([target]);
                      }}
                      className={`group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedMaterial.id === item.id ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                    >
                       <div className="mt-0.5 flex-shrink-0">
                          {getSourceIcon(item.sourceUrl, item.type)}
                       </div>
                       <div className="flex-1 min-w-0 pr-6">
                          <h4 className={`text-sm mb-1 leading-snug line-clamp-2 ${selectedMaterial.id === item.id ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                             {item.title || "Untitled Item"}
                          </h4>
                          <span className="text-xs text-gray-400">{item.timeAgo}</span>
                       </div>

                       {/* Hover Menu Button */}
                       <button 
                          className={`absolute right-2 top-3 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-all ${activeMenuId === item.id ? 'opacity-100 bg-gray-200/50' : 'opacity-0 group-hover:opacity-100'}`}
                          onClick={(e) => {
                             e.stopPropagation();
                             setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                       >
                          <MoreHorizontalIcon className="w-4 h-4" />
                       </button>

                       {/* Dropdown Menu */}
                       {activeMenuId === item.id && (
                          <div 
                             ref={menuRef}
                             className="absolute top-8 right-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 origin-top-right"
                             onClick={(e) => e.stopPropagation()}
                          >
                             <button onClick={() => { setRenameModal({isOpen: true, itemId: item.id}); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                <EditIcon className="w-4 h-4 text-gray-400" /> Rename
                             </button>
                             <button onClick={() => setActiveMenuId(null)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                <StarIcon className="w-4 h-4 text-gray-400" /> Favorite
                             </button>
                             <button onClick={() => { setMoveModal({isOpen: true, itemId: item.id}); setActiveMenuId(null); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                <div className="flex items-center gap-2.5"><FileInputIcon className="w-4 h-4 text-gray-400" /> Move to</div>
                                <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                             </button>
                             <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                <CopyIcon className="w-4 h-4 text-gray-400" /> Create Copy
                             </button>
                             <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                <FileTextIcon className="w-4 h-4 text-gray-400" /> Convert to Doc
                             </button>
                             
                             <div className="h-px bg-gray-100 my-1"></div>
                             
                             {(item.sourceUrl || item.type === 'link') && (
                                <button onClick={() => handleOpenLink(item)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                  <ExternalLinkIcon className="w-4 h-4 text-gray-400" /> Open Original
                                </button>
                             )}
                             <button onClick={() => handleDownloadItem(item)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                <DownloadIcon className="w-4 h-4 text-gray-400" /> Download
                             </button>
                             
                             <div className="h-px bg-gray-100 my-1"></div>
                             
                             <button onClick={() => handleDeleteItem(item.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                                <TrashIcon className="w-4 h-4" /> Delete
                             </button>
                          </div>
                       )}
                    </div>
                  ))
               ) : (
                 <div className="p-4 text-center text-gray-400 text-sm">
                   No items match filter.
                 </div>
               )
             )}
          </div>
        </div>

        {/* RESIZER 1 (Left-Center) */}
        <div 
          className="w-1 cursor-col-resize hover:bg-blue-400/30 transition-colors rounded-full -ml-2 -mr-1 z-10 flex flex-col justify-center"
          onMouseDown={() => {
             setIsResizingLeft(true);
             document.body.style.cursor = 'col-resize';
          }}
        >
        </div>

        {/* COLUMN 2: CENTER (Preview OR Creation Templates) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden relative min-w-[400px]">
          {showLongformTool && (
              <div className="absolute inset-0 z-30 bg-white overflow-y-auto">
              <div className="flex justify-end items-center gap-3 p-4">
                <button
                  className="w-11 h-11 rounded-2xl border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-100 shadow-sm flex items-center justify-center transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title="保存到作品"
                  onClick={handleSaveLongformWork}
                  disabled={isSavingLongformWork}
                >
                  {isSavingLongformWork ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                </button>
                <button
                  className="w-11 h-11 rounded-2xl border border-gray-200 bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200 flex items-center justify-center transition-all disabled:bg-gray-200 disabled:text-gray-400"
                  title="???????"
                  onClick={() => window.dispatchEvent(new Event('xhs-longimage-download'))}
                >
                  <DownloadIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCloseLongformTool}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center shadow-sm border border-gray-200"
                  title="???????"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <XhsLongImageTool
                  ratio={longformContext.ratio}
                  prompt={longformContext.prompt}
                  selectedMaterialIds={longformContext.selectedMaterialIds}
                  selectedWorkIds={longformContext.selectedWorkIds}
                  initialTitle={longformContext.title}
                  initialText={longformContext.text}
                />
              </div>
            </div>
          )}
          {/* ... (Existing Content Render Logic) ... */}
          {activeTab === 'works' ? (
             selectedWork ? (
                // --- WORK PREVIEW VIEW ---
                <WorkPreviewView 
                  work={selectedWork} 
                  onBack={() => setSelectedWork(null)} 
                  onSelectText={handleTextMouseUp} 
                  onPublished={handleMarkPublished}
                />
             ) : selectedTemplate ? (
               // --- TEMPLATE DETAIL VIEW ---
               <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white relative rounded-2xl">
                  {/* ... (Template View Content) ... */}
                  <div className="w-full max-w-lg">
                      <button 
                        onClick={() => { resetTemplateSelections(); setSelectedTemplate(null); setWorksListMode('works'); }} 
                        className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-gray-500 lg:hidden"
                      >
                        <ArrowRightIcon className="w-5 h-5 rotate-180" />
                      </button>
                      <div className="flex flex-col items-center text-center">
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gray-50 shadow-sm border border-gray-100`}>
                              {selectedTemplate.icon}
                           </div>
                           <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedTemplate.title}</h2>
                           <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                               {selectedTemplate.description}
                           </p>
                               {selectedTemplate.id === 't-longform-image' && null}
                           <div className="w-full bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-10 flex flex-col gap-2 text-blue-800">
                               <div className="flex items-center gap-2">
                                 <CheckSquareIcon className="w-5 h-5" />
                                 <span className="font-medium">选中资料：<span className="font-bold">{selectedContextIds.size}</span></span>
                               </div>
                               <div className="flex items-center gap-2 text-sm">
                                 <PenToolIcon className="w-4 h-4" />
                                 <span>选中作品：<span className="font-bold">{selectedWorkIds.size}</span></span>
                               </div>
                               <div className="flex items-center gap-2 text-sm text-gray-700">
                                 <EditIcon className="w-4 h-4" />
                                 <span>提示词：<span className="font-semibold truncate" title={templatePrompts[selectedTemplate.id] || selectedTemplate.defaultPrompt || ''}>{templatePrompts[selectedTemplate.id] || selectedTemplate.defaultPrompt || '暂无提示词'}</span></span>
                               </div>
                           </div>
                          <div className="flex items-center gap-4 w-full">
                              <Button 
                                variant="secondary" 
                                size="lg" 
                                className="flex-1 rounded-full border-gray-300 py-3" 
                                onClick={() => { resetTemplateSelections(); setSelectedTemplate(null); setWorksListMode('works'); }}
                              >
                                Cancel
                              </Button>
                              <Button variant="primary" size="lg" className="flex-1 rounded-full bg-black hover:bg-gray-800 py-3 gap-2 shadow-lg" onClick={handleGenerateTemplate}>
                                <SparklesIcon className="w-5 h-5" /> Generate
                              </Button>
                          </div>
                      </div>
                  </div>
               </div>
             ) : (
               // --- CREATION TEMPLATES GALLERY ---
               <div className="flex-1 overflow-y-auto p-12 bg-white rounded-2xl custom-scrollbar">
                  {/* ... (Template Gallery Content) ... */}
                      <div className="max-w-5xl mx-auto">
                         <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                            <Button variant="secondary" size="sm" className="rounded-full px-4 gap-2">
                               <PlusIcon className="w-4 h-4" /> New Template
                            </Button>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CREATION_TEMPLATES.map(template => (
                              <div 
                                 key={template.id} 
                                 onClick={() => {
                                   resetTemplateSelections();
                                    setSelectedTemplate(template);
                                    if (template.id === 't-longform-image') {
                                      setWorksListMode('works');
                                    } else {
                                      setWorksListMode('materials');
                                    }
                                 }}
                                 className="relative group rounded-xl border border-gray-200 bg-white/90 hover:shadow-sm transition-all cursor-pointer overflow-hidden p-3 min-h-[110px]"
                              >
                                 <div className="flex items-start gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${template.accent || 'bg-gray-100 text-gray-700'}`}>
                                       {template.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center justify-between gap-2">
                                          <h4 className="text-base font-semibold text-gray-900 truncate">{template.title}</h4>
                                          <button 
                                             className="p-1 rounded-full hover:bg-gray-100 text-gray-500 z-10"
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTemplate(template);
                                             }}
                                             title="编辑提示词"
                                          >
                                             <EditIcon className="w-4 h-4" />
                                          </button>
                                       </div>
                                       <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-1">
                                          {templatePrompts[template.id] || template.description}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-3">
                                    <LayoutIcon className="w-3 h-3" />
                                    {template.tag}
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
             )
          ) : (
             // CONTENT PREVIEW VIEW
             <>
               {/* Center Toolbar */}
               <div className="h-12 flex items-center justify-between px-6 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><GridIcon className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><ListIcon className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><SidebarIcon className="w-4 h-4 rotate-90" /></Button>
                    <div className="relative" ref={addMenuRef}>
                      <Button variant="ghost" size="sm" className={`p-1.5 rounded hover:bg-gray-100 ${showAddMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`} onClick={() => setShowAddMenu(!showAddMenu)}>
                         <PlusIcon className="w-4 h-4" />
                      </Button>
                      {showAddMenu && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95">
                          <button onClick={handleCreateNote} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                             <FileTextIcon className="w-4 h-4 text-gray-500" /> New Note
                          </button>
                          <button onClick={() => setShowLinkModal(true)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                             <LinkIcon className="w-4 h-4 text-gray-500" /> Add Link
                          </button>
                          <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                             <PaperclipIcon className="w-4 h-4 text-gray-500" /> Add File
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button onClick={handleCreateGroup} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 bg-gray-50/50">
                             <FolderPlusIcon className="w-4 h-4 text-gray-500" /> New Group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-3 text-gray-400 border-r border-gray-200 pr-3 mr-1">
                        <SidebarIcon className="w-4 h-4" />
                        <DownloadIcon className="w-4 h-4" />
                        <LinkIcon className="w-4 h-4" />
                        <MoreHorizontalIcon className="w-4 h-4" />
                     </div>
                  </div>
               </div>

               {/* Content Scroll Area - REPLACED WITH CONTENT RENDERER */}
               <div 
                  className="flex-1 overflow-hidden" 
                  onMouseUp={handleTextMouseUp}
               >
                   <ContentRenderer 
                      item={selectedMaterial} 
                      isEditing={isEditing} 
                      editContent={editContent} 
                      editTitle={editTitle}
                      onEditChange={handleContentUpdate} 
                      onTitleChange={handleTitleUpdate}
                   />
               </div>
             </>
          )}
        </div>

        {/* RESIZER 2 (Center-Right) */}
        <div 
          className="w-1 cursor-col-resize hover:bg-blue-400/30 transition-colors rounded-full -ml-1 -mr-2 z-10 flex flex-col justify-center"
          onMouseDown={() => {
             setIsResizingRight(true);
             document.body.style.cursor = 'col-resize';
          }}
        >
        </div>

        {/* COLUMN 3: RIGHT SIDEBAR (Chat) */}
        <div 
          className="bg-white rounded-2xl flex flex-col flex-shrink-0 shadow-sm border border-gray-200/50 overflow-hidden z-10"
          style={{ width: rightColWidth }}
        >
           {/* Chat interface (shared with Materials) */}
           <>
                <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4">
                    <span className="font-medium text-gray-900 text-sm">Chat</span>
                    <div className="flex items-center gap-3 text-gray-400">
                      {isSendingChat && (
                        <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-2 py-1">
                          <RefreshCwIcon className="w-3 h-3 animate-spin" />
                          <span>助手正在工作</span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={handleClearChat}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="清空当前对话"
                      >
                        <RefreshCwIcon className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={handleNewChat}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="新建对话"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30 custom-scrollbar">
                    {/* Chat History Messages */}
                    {chatHistory.length === 0 && !isSendingChat && (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-2xl bg-white/60">
                        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-3 shadow-sm">
                          <LogoIcon className="w-6 h-6" />
                        </div>
                        <div className="text-base font-semibold text-gray-900">How can I help you?</div>
                        <div className="text-sm text-gray-500 mt-1">Start a new conversation</div>
                      </div>
                    )}

                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.role === 'user' ? (
                            <div className="bg-white p-3 rounded-2xl rounded-tr-sm shadow-sm border border-gray-100 text-sm text-gray-800 max-w-[90%] mb-1">
                                <div className="flex items-center gap-1 mb-1 text-purple-500">
                                  <SparklesIcon className="w-3 h-3" />
                                </div>
                                <MarkdownMessage content={msg.content} />
                            </div>
                          ) : (
                            msg.type === 'error' ? (
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-xs text-gray-500 w-full mb-1">
                                    <AlertCircleIcon className="w-3 h-3 text-gray-400" />
                                    {msg.content}
                                </div>
                            ) : msg.type === 'warning' ? (
                                <div className="flex items-start gap-2 bg-orange-50 px-3 py-2 rounded-lg text-xs text-orange-700 w-full border border-orange-100 mb-1">
                                    <AlertCircleIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    <span>
                                    {msg.content.split('Upgrade Plan').map((part: string, i: number, arr: string[]) => (
                                        <React.Fragment key={i}>
                                            {part}
                                            {i < arr.length - 1 && <span className="text-blue-600 underline cursor-pointer">Upgrade Plan</span>}
                                        </React.Fragment>
                                    ))}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 max-w-[90%]">
                                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                        <MessageSquareIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                      <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-sm text-gray-800">
                                          <MarkdownMessage content={msg.content} />
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <button
                                          type="button"
                                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                          title="Copy"
                                          onClick={() => handleCopyResponse(msg.content, idx)}
                                        >
                                          <CopyIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                          title="Download"
                                          onClick={() => handleDownloadResponse(msg.content)}
                                        >
                                          <DownloadIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                          title="Add to Library"
                                          onClick={() => handleSaveResponseToMaterials(msg.content)}
                                        >
                                          <FolderPlusIcon className="w-4 h-4" />
                                        </button>
                                        {copiedReplyIndex === idx && (
                                          <span className="text-xs text-green-600 ml-1">Copied</span>
                                        )}
                                      </div>
                                    </div>
                                </div>
                            )
                          )}
                      </div>
                    ))}
                    
                    {isSendingChat && (
                      <div className="flex items-start gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-1">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                          <SparklesIcon className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-900 text-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-800 text-sm flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:-0.2s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.2s]"></span>
                          </div>
                          <span className="text-xs font-medium tracking-wide">正在处理你的请求...</span>
                        </div>
                      </div>
                    )}
                    
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <div className="flex items-center gap-2">
                          {shortcuts.slice(0, 2).map(sc => (
                              <button 
                                  key={sc.id}
                                  onClick={() => handleShortcut(sc)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-100 hover:border-gray-300 transition-colors"
                              >
                                  {renderShortcutIcon(sc.icon)}
                                  {sc.name}
                              </button>
                          ))}
                          <div className="relative" ref={shortcutMenuRef}>
                              <button 
                                  onClick={() => setShowShortcutMenu(!showShortcutMenu)}
                                  className="flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                  <MoreHorizontalIcon className="w-4 h-4 text-gray-500" />
                              </button>
                              {showShortcutMenu && (
                                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 origin-bottom-left">
                                      {shortcuts.slice(2).map(sc => (
                                          <button 
                                              key={sc.id}
                                              onClick={() => {
                                                  handleShortcut(sc);
                                                  setShowShortcutMenu(false);
                                              }}
                                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                          >
                                              {renderShortcutIcon(sc.icon)}
                                              {sc.name}
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowShortcutOverlay(true)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                          <SettingsIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {chatReferences.length > 0 && (
                      <div className="flex flex-nowrap overflow-x-auto gap-2 mb-2 custom-scrollbar pb-2">
                         {chatReferences.map((ref, idx) => {
                             const title = (ref as any).title || (ref as any).name || "File";
                             const icon = (ref as any).type === 'local-file' ? <PaperclipIcon className="w-4 h-4" /> :
                                          (ref as any).type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                                          (ref as any).type === 'video' ? <PlayCircleIcon className="w-4 h-4" /> :
                                          (ref as any).type === 'text-selection' ? <QuoteIcon className="w-4 h-4 text-purple-500" /> :
                                          <FileTextIcon className="w-4 h-4" />;
                             const preview = (ref as any).preview || (ref as any).content?.substring(0, 30) || "No preview";

                             return (
                               <div key={(ref as any).id || idx} className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-3 shadow-sm relative group">
                                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 flex-shrink-0">
                                     {icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="text-xs font-medium text-gray-900 truncate">{title}</div>
                                     <div className="text-[10px] text-gray-400 truncate">{preview}</div>
                                  </div>
                                  <button 
                                     onClick={() => handleRemoveReference(ref.id)} 
                                     className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                                  >
                                     <XIcon className="w-3 h-3" />
                                  </button>
                               </div>
                             );
                         })}
                      </div>
                    )}

                    <div className="relative">
                      <textarea 
                        placeholder="Describe a task" 
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-gray-200 focus:bg-white transition-colors resize-none"
                        rows={3}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={isSendingChat}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      </div>
                    </div>
                    {chatError && <div className="text-xs text-red-500 mt-1 px-1">⚠ {chatError}</div>}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 relative">
                          <button 
                             onClick={() => setShowRefPicker(!showRefPicker)}
                             className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showRefPicker ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                             ref={refPickerRef}
                          >
                            <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showRefPicker ? 'rotate-45' : ''}`} />
                          </button>
                          
                          {showRefPicker && (
                             <ChatReferencePicker 
                                projects={projects}
                                works={works}
                                selectedIds={new Set(chatReferences.map(r => r.id))}
                                onToggle={handleToggleReference}
                                onClose={() => setShowRefPicker(false)}
                             />
                          )}

                          <div className="relative" ref={agentMenuRef}>
                             <button 
                                onClick={() => setShowAgentMenu(!showAgentMenu)}
                                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors ${showAgentMenu ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:text-gray-900'}`}
                             >
                                {getAgentButtonContent()} <ChevronDownIcon className="w-3 h-3" />
                             </button>

                             {showAgentMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 origin-bottom-left">
                                    <div className="px-1 space-y-0.5">
                                        <button 
                                            onClick={() => { setSelectedAgentMode('agent'); setShowAgentMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 relative"
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center text-lg leading-none font-bold">∞</span>
                                            <span>Agent</span>
                                            {selectedAgentMode === 'agent' && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedAgentMode('ask'); setShowAgentMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 relative"
                                        >
                                            <MessageSquareIcon className="w-4 h-4" />
                                            <span>Ask</span>
                                            {selectedAgentMode === 'ask' && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                        </button>
                                    </div>
                                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                    <div className="px-1 space-y-0.5">
                                        <button 
                                             onClick={() => { setSelectedAgentMode('search'); setShowAgentMenu(false); }}
                                             className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 relative"
                                        >
                                            <GlobeIcon className="w-4 h-4" />
                                            <span>Search Internet</span>
                                            {selectedAgentMode === 'search' && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                        </button>
                                         <button 
                                             onClick={() => { setSelectedAgentMode('write'); setShowAgentMenu(false); }}
                                             className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 relative"
                                        >
                                            <PenToolIcon className="w-4 h-4" />
                                            <span>Write Document</span>
                                            {selectedAgentMode === 'write' && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                        </button>
                                         <button 
                                             onClick={() => { setSelectedAgentMode('image'); setShowAgentMenu(false); }}
                                             className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 relative"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            <span>Create Image</span>
                                            {selectedAgentMode === 'image' && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                        </button>
                                    </div>
                                </div>
                             )}
                          </div>

                          {(selectedAgentMode === 'ask' || selectedAgentMode === 'write' || selectedAgentMode === 'image') && (
                             <div className="relative" ref={modelSelectorRef}>
                                <button 
                                   onClick={() => setShowModelSelector(!showModelSelector)}
                                   className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors ${showModelSelector ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                   <div className="flex-shrink-0">
                                      {getModelIcon(currentModel?.provider || 'openai')} 
                                   </div>
                                   <span className="w-[70px] text-left truncate">{currentModel?.name || "Select Model"}</span>
                                   <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
                                </button>

                                {showModelSelector && (
                                   <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 origin-bottom-left max-h-[400px] overflow-y-auto custom-scrollbar">
                                       <div className="px-1 space-y-0.5">
                                          {modelOptionsToUse.map(model => {
                                             const isSelected = selectedAgentMode === 'image' ? (selectedImageModel === model.id) : (selectedModel === model.id);
                                             return (
                                              <button 
                                                 key={model.id}
                                                 onClick={() => { 
                                                    if (selectedAgentMode === 'image') setSelectedImageModel(model.id);
                                                    else setSelectedModel(model.id);
                                                    setShowModelSelector(false); 
                                                 }}
                                                 className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 relative"
                                              >
                                                  <div className="flex-shrink-0">
                                                    {getModelIcon(model.provider)}
                                                  </div>
                                                  <div className="flex items-center gap-2 min-w-0">
                                                      <span className="truncate">{model.name}</span>
                                                      {model.tags && model.tags.map((tag, i) => (
                                                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${tag.color}`}>
                                                              {tag.label}
                                                          </span>
                                                      ))}
                                                  </div>
                                                  {isSelected && <CheckIcon className="w-4 h-4 text-gray-900 absolute right-3" />}
                                              </button>
                                             );
                                          })}
                                       </div>
                                   </div>
                                )}
                             </div>
                          )}
                          
                          {selectedAgentMode === 'image' && (
                             <div className="relative" ref={imageStyleSelectorRef}>
                                <button 
                                   onClick={() => setShowImageStyleSelector(!showImageStyleSelector)}
                                   className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors ${showImageStyleSelector ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                   <LayoutIcon className="w-4 h-4" />
                                   <span>Style</span>
                                   <ChevronDownIcon className="w-3 h-3" />
                                </button>

                                {showImageStyleSelector && (
                                   <div className="absolute bottom-full right-0 mb-2 w-[340px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 origin-bottom-right">
                                      <div className="mb-4">
                                         <div className="text-xs font-bold text-gray-900 mb-2">图片尺寸</div>
                                         <div className="flex gap-2">
                                            {['Horizontal', 'Square', 'Vertical'].map(size => (
                                               <button 
                                                  key={size}
                                                  onClick={() => setImageSize(size)}
                                                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-colors ${imageSize === size ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                               >
                                                  {size === 'Horizontal' && <span className="w-3 h-2 border border-current rounded-[1px]"></span>}
                                                  {size === 'Square' && <span className="w-2.5 h-2.5 border border-current rounded-[1px]"></span>}
                                                  {size === 'Vertical' && <span className="w-2 h-3 border border-current rounded-[1px]"></span>}
                                                  {size === 'Horizontal' ? '横向' : size === 'Square' ? '正方形' : '纵向'}
                                               </button>
                                            ))}
                                         </div>
                                      </div>
                                      <div>
                                         <div className="text-xs font-bold text-gray-900 mb-2">图片风格</div>
                                         <div className="grid grid-cols-4 gap-2">
                                            {IMAGE_STYLES.map(style => (
                                               <button 
                                                  key={style.id}
                                                  onClick={() => setImageStyle(style.id)}
                                                  className="flex flex-col items-center gap-1 group"
                                               >
                                                  <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${imageStyle === style.id ? 'border-gray-900 ring-2 ring-gray-100 ring-offset-1' : 'border-transparent group-hover:border-gray-200'}`}>
                                                     <img src={style.img} alt={style.label} className="w-full h-full object-cover" />
                                                  </div>
                                                  <span className={`text-[10px] ${imageStyle === style.id ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                                                     {style.label}
                                                  </span>
                                               </button>
                                            ))}
                                         </div>
                                      </div>
                                   </div>
                                )}
                             </div>
                          )}

                      </div>
                      <button 
                        onClick={() => handleSendMessage()}
                        disabled={isSendingChat || !chatInput.trim()}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isSendingChat || !chatInput.trim() ? 'bg-gray-200 text-white opacity-60 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-primary-500'}`}
                        title="Send (Ctrl/Cmd + Enter)"
                      >
                      <ArrowRightIcon className="w-4 h-4 -rotate-90" />
                      </button>
                    </div>
                </div>
             </>
        </div>
      </div>
      
      <AddLinkModal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} onAdd={handleAddLink} />
      
      <RenameModal 
         isOpen={renameModal.isOpen} 
         initialName={project.items.find(i => i.id === renameModal.itemId)?.title || ''}
         onClose={() => setRenameModal({isOpen: false, itemId: null})} 
         onRename={handleRenameItem} 
      />

      <MoveToModal
         isOpen={moveModal.isOpen}
         onClose={() => setMoveModal({isOpen: false, itemId: null})}
         onMove={handleMoveItem}
         projects={projects}
         currentProject={project}
      />

      {/* Template Prompt Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[150] bg-black/30 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                 <div className="flex items-center gap-2">
                   <span className="text-gray-700">{editingTemplate.icon}</span>
                   <h3 className="text-lg font-semibold text-gray-900">编辑提示词 - {editingTemplate.title}</h3>
                 </div>
                 <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500" onClick={() => setEditingTemplate(null)}>
                   <XIcon className="w-4 h-4" />
                 </button>
              </div>
              <div className="p-5 space-y-4">
                 <div>
                   <div className="text-sm text-gray-600 mb-2">提示词（用于该功能生成文案/图像时的默认引导）</div>
                   <textarea 
                     className="w-full min-h-[160px] rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 text-sm text-gray-800 p-3 resize-none"
                     value={editingPrompt}
                     onChange={(e) => setEditingPrompt(e.target.value)}
                     placeholder="输入提示词，例如：请将选中资料整理为长图文，包含要点摘要、分段标题与视觉描述。"
                   />
                 </div>
                 <div className="flex items-center justify-end gap-3">
                   <Button variant="secondary" size="sm" className="rounded-full px-4" onClick={() => setEditingTemplate(null)}>取消</Button>
                   <Button 
                     variant="primary" 
                     size="sm" 
                     className="rounded-full px-5 bg-black hover:bg-gray-800"
                     onClick={() => {
                       setTemplatePrompts(prev => ({ ...prev, [editingTemplate.id]: editingPrompt || editingTemplate.description }));
                       setEditingTemplate(null);
                     }}
                   >
                     保存
                   </Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export const WorkspacePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [works, setWorks] = useState<Work[]>(MOCK_WORKS);

  const handleCreateProject = (name: string, icon: React.ReactNode) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      itemCount: 0,
      lastUpdated: 'Just now',
      icon,
      items: []
    };
    setProjects([newProject, ...projects]);
    setIsCreateModalOpen(false);
    setCurrentProject(newProject);
  };

  const handleUpdateProject = (updated: Project) => {
     setProjects(projects.map(p => p.id === updated.id ? updated : p));
     setCurrentProject(updated);
  };

  if (currentProject) {
    return (
      <ProjectDetailView 
        project={currentProject} 
        projects={projects}
        works={works}
        onBack={() => setCurrentProject(null)}
        onSwitchProject={setCurrentProject}
        onUpdateProject={handleUpdateProject}
        onUpdateWorks={setWorks}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8">
       <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
             <h1 className="text-3xl font-bold text-gray-900">Workspace</h1>
             <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full gap-2">
                <PlusIcon className="w-4 h-4" /> New Project
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {projects.map(project => (
               <div 
                 key={project.id}
                 onClick={() => setCurrentProject(project)}
                 className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
               >
                  <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 text-xl group-hover:scale-110 transition-transform">
                        {project.icon}
                     </div>
                     <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{project.itemCount} items</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-500">Last updated {project.lastUpdated}</p>
               </div>
             ))}
             
             {/* New Project Card */}
             <button 
               onClick={() => setIsCreateModalOpen(true)}
               className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-all min-h-[200px]"
             >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                   <PlusIcon className="w-6 h-6" />
                </div>
                <span className="font-medium">Create New Project</span>
             </button>
          </div>
       </div>

       <CreateProjectModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={handleCreateProject} 
       />
    </div>
  );
};
