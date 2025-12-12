import React, { useState, useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  type: 'Doc' | 'Slide' | 'Page';
  date: string;
  content?: string;
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

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tag: string;
}

const CREATION_TEMPLATES: Template[] = [
  { 
    id: 't1', 
    title: 'Briefing digest', 
    description: 'Overview of selected materials featuring key insights and highlights.', 
    icon: <FileTextIcon className="w-8 h-8 text-blue-500" />,
    color: 'border-l-4 border-l-blue-400',
    tag: 'Page'
  },
  { 
    id: 't2', 
    title: 'Blog post', 
    description: 'Insight-driven blog article highlighting surprising or counter-intuitive points.', 
    icon: <PenToolIcon className="w-8 h-8 text-purple-500" />,
    color: 'border-l-4 border-l-purple-400',
    tag: 'Page'
  },
  { 
    id: 't3', 
    title: 'Research guide', 
    description: 'Generate an insightful research guide based on the selected materials.', 
    icon: <DatabaseIcon className="w-8 h-8 text-indigo-500" />,
    color: 'border-l-4 border-l-indigo-400',
    tag: 'Page'
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
const SHORTCUT_COMMANDS = [
  { id: 'cmd1', label: 'Summarize', icon: <FileTextIcon className="w-3 h-3 text-blue-500"/>, prompt: 'Please summarize the following content concisely:' },
  { id: 'cmd2', label: 'Key Takeaways', icon: <SparklesIcon className="w-3 h-3 text-yellow-500"/>, prompt: 'Extract the key takeaways and insights from this:' },
  { id: 'cmd3', label: 'Explain Simple', icon: <SmileIcon className="w-3 h-3 text-green-500"/>, prompt: 'Explain the concepts here in simple terms:' },
  { id: 'cmd4', label: 'Translate to CN', icon: <GlobeIcon className="w-3 h-3 text-purple-500"/>, prompt: 'Translate the following content into professional Chinese:' },
  { id: 'cmd5', label: 'Draft Email', icon: <MessageSquareIcon className="w-3 h-3 text-gray-500"/>, prompt: 'Draft a professional email based on this information:' },
  { id: 'cmd6', label: 'Action Items', icon: <CheckSquareIcon className="w-3 h-3 text-teal-500"/>, prompt: 'Create a checklist of actionable items from this:' },
];

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

  const WECHAT_API_KEY = "6d95009ffa75064c88af";
  const MEOW_API_KEY = "lyyyu0xksg9gbg91-91a7hymet1bl";
  
  // 1. WeChat API - PRIORITY 1
  if (url.includes('mp.weixin.qq.com')) {
      try {
         const targetUrl = "http://data.wxrank.com/weixin/artinfo";
         // Use a CORS proxy to bypass Mixed Content (http vs https) and CORS headers restrictions
         const proxyUrl = "https://corsproxy.io/?" + targetUrl;

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
          const response = await fetch('https://api.meowload.net/openapi/extract/post', {
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


// --- CHAT REFERENCE PICKER ---

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
                 <article className="prose prose-gray max-w-none prose-p:text-gray-700 prose-p:leading-loose prose-headings:font-bold prose-headings:text-gray-900">
                    {(item.content || editContent).split('\n').map((para, i) => {
                      // Custom Image Parser for simulated content
                      if (para.trim().startsWith('{{IMG:') && para.trim().endsWith('}}')) {
                          const imgUrl = para.trim().replace('{{IMG:', '').replace('}}', '');
                          return (
                            <div key={i} className="my-6">
                               <img src={imgUrl} alt="Content" className="w-full rounded-xl shadow-sm" />
                            </div>
                          );
                      }
                      // Standard Paragraph
                      return <p key={i}>{para}</p>;
                    })}
                 </article>
             )}
           </>
         )}
      </div>
    </div>
  );
}

// ... (Rest of the file remains unchanged, including WorkPreviewView, ProjectDetailView, WorkspacePage) ...

const WorkPreviewView: React.FC<{ work: Work; onBack: () => void }> = ({ work, onBack }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
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
             <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
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
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
         <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{work.title}</h1>
            <div className="prose prose-lg prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold">
               {work.content ? (
                 work.content.split('\n').map((para, i) => (
                    <p key={i} className={para.startsWith('--') ? 'text-gray-400 text-sm' : ''}>{para}</p>
                 ))
               ) : (
                 <p className="text-gray-400 italic">No content available for this preview.</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

const ProjectDetailView: React.FC<{ 
  project: Project;
  projects: Project[]; 
  initialMaterialId?: string;
  onBack: () => void;
  onSwitchProject: (p: Project) => void;
  onUpdateProject: (p: Project) => void;
}> = ({ project, projects, initialMaterialId, onBack, onSwitchProject, onUpdateProject }) => {
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
  const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set(['1', '2', '3'])); 
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Chat History
  const [chatHistory, setChatHistory] = useState<any[]>(CHAT_HISTORY);

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

  // Shortcut Menu State
  const [showShortcutMenu, setShowShortcutMenu] = useState(false);
  const shortcutMenuRef = useRef<HTMLDivElement>(null);

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

  const toggleSelectAll = () => {
    if (selectedContextIds.size === MOCK_MATERIALS.length) {
      setSelectedContextIds(new Set());
    } else {
      setSelectedContextIds(new Set(MOCK_MATERIALS.map(m => m.id)));
    }
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

  const handleShortcut = (cmd: typeof SHORTCUT_COMMANDS[0]) => {
    let content = cmd.prompt;
    if (chatReferences.length > 0) {
        const refTitles = chatReferences.map(r => {
             const title = (r as any).title || (r as any).name || "Untitled";
             const type = (r as any).type;
             return `[${type}: ${title}]`;
        }).join(', ');
        content += `\n\n(References: ${refTitles})`;
    }

    const userMsg = { role: 'user', content: content };
    setChatHistory(prev => [...prev, userMsg]);

    setTimeout(() => {
        setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: `Here is the ${cmd.label} based on your request... \n\n(AI generated content placeholder for ${chatReferences.length} items)`
        }]);
    }, 800);
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

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
      
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
               <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                  <span>Works</span>
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
          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4 custom-scrollbar">
             {activeTab === 'works' ? (
                // WORKS LIST
                MOCK_WORKS.map(work => (
                   <div 
                     key={work.id} 
                     onClick={() => {
                        setSelectedWork(work);
                        // Also automatically add to chat references (Single Select)
                        setChatReferences([work]);
                     }}
                     className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedWork?.id === work.id ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                   >
                      <div className="mt-0.5 flex-shrink-0 p-1 bg-gray-50 border border-gray-100 rounded">
                        {getIconForWork(work.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium leading-snug mb-1 line-clamp-2 ${selectedWork?.id === work.id ? 'text-gray-900' : 'text-gray-700'}`}>{work.title}</h4>
                        <span className="text-xs text-gray-400">{work.date}</span>
                      </div>
                   </div>
                ))
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

                         // Automatically add to chat references if not already there (Single Select)
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
          {/* ... (Existing Content Render Logic) ... */}
          {activeTab === 'works' ? (
             selectedWork ? (
                // --- WORK PREVIEW VIEW ---
                <WorkPreviewView work={selectedWork} onBack={() => setSelectedWork(null)} />
             ) : selectedTemplate ? (
               // --- TEMPLATE DETAIL VIEW ---
               <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white relative rounded-2xl">
                  {/* ... (Template View Content) ... */}
                  <div className="w-full max-w-lg">
                      <button onClick={() => setSelectedTemplate(null)} className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-gray-500 lg:hidden">
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
                          <div className="w-full bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-10 flex items-center justify-center gap-2 text-blue-800">
                              <CheckSquareIcon className="w-5 h-5" />
                              <span className="font-medium">Selected materials: <span className="font-bold">{selectedContextIds.size}</span></span>
                          </div>
                          <div className="flex items-center gap-4 w-full">
                              <Button variant="secondary" size="lg" className="flex-1 rounded-full border-gray-300 py-3" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
                              <Button variant="primary" size="lg" className="flex-1 rounded-full bg-black hover:bg-gray-800 py-3 gap-2 shadow-lg" onClick={() => { /* Generate Action */ }}>
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
                  <div className="max-w-4xl mx-auto">
                     <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">What do you want to create?</h1>
                        <Button variant="secondary" size="sm" className="rounded-full px-4 gap-2">
                           <PlusIcon className="w-4 h-4" /> New Template
                        </Button>
                     </div>
                     <p className="text-gray-500 mb-8">Select a type, or view templates to create quickly.</p>
                     <div className="flex gap-4 mb-10">
                        <div className="flex-1 border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all bg-white group">
                           <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <FileTextIcon className="w-5 h-5" />
                           </div>
                           <span className="font-medium text-gray-700">Doc</span>
                        </div>
                        <div className="flex-1 border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all bg-white group">
                           <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                              <MicIcon className="w-5 h-5" />
                           </div>
                           <span className="font-medium text-gray-700">Podcast</span>
                        </div>
                     </div>
                     <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Templates</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CREATION_TEMPLATES.map(template => (
                           <div 
                              key={template.id} 
                              onClick={() => setSelectedTemplate(template)}
                              className={`group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer overflow-hidden ${template.color}`}
                           >
                              <div className="mb-4">{template.icon}</div>
                              <h4 className="text-lg font-bold text-gray-900 mb-2">{template.title}</h4>
                              <p className="text-sm text-gray-500 leading-relaxed mb-8">{template.description}</p>
                              <div className="absolute bottom-6 left-6 flex items-center text-xs text-gray-400 gap-1">
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

        {/* COLUMN 3: RIGHT SIDEBAR (Chat OR Material Context Selector) */}
        <div 
          className="bg-white rounded-2xl flex flex-col flex-shrink-0 shadow-sm border border-gray-200/50 overflow-hidden z-10"
          style={{ width: rightColWidth }}
        >
           {/* ... (Right sidebar logic remains largely the same, reusing existing state/props) ... */}
           {activeTab === 'works' ? (
              // CONTEXT SELECTION (Checklist)
              <>
                 <div className="h-12 border-b border-gray-100 flex items-center px-4 bg-gray-50/50">
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={toggleSelectAll}
                    >
                       {selectedContextIds.size === MOCK_MATERIALS.length ? (
                          <CheckSquareIcon className="w-4 h-4 text-gray-900" />
                       ) : (
                          <SquareIcon className="w-4 h-4 text-gray-400" />
                       )}
                       <span className="font-bold text-sm text-gray-700">Select All</span>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-2 bg-white custom-scrollbar">
                    {MOCK_MATERIALS.map(material => {
                      const isSelected = selectedContextIds.has(material.id);
                      return (
                        <div 
                           key={material.id} 
                           className={`flex items-start gap-3 p-3 mb-1 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
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
                 
                 {!selectedTemplate && !selectedWork && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                       <Button className="w-full bg-gray-900 text-white rounded-lg py-3 shadow-lg flex items-center justify-center gap-2 hover:bg-black">
                          <SparklesIcon className="w-4 h-4" />
                          Generate ({selectedContextIds.size})
                       </Button>
                    </div>
                 )}
              </>
           ) : (
              // CHAT INTERFACE
              <>
                <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4">
                    <span className="font-medium text-gray-900 text-sm">Chat</span>
                    <div className="flex gap-3 text-gray-400">
                      <RefreshCwIcon className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                      <PlusIcon className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30 custom-scrollbar">
                    {/* Chat History Messages */}
                    <div className="flex justify-end">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
                        <SparklesIcon className="w-3 h-3 text-purple-500" />
                        Explain with Doodles
                      </div>
                    </div>

                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.role === 'user' ? (
                            <div className="bg-white p-3 rounded-2xl rounded-tr-sm shadow-sm border border-gray-100 text-sm text-gray-800 max-w-[90%] mb-1 whitespace-pre-wrap">
                                <div className="flex items-center gap-1 mb-1 text-purple-500">
                                  <SparklesIcon className="w-3 h-3" />
                                </div>
                                {msg.content}
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
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-sm text-gray-800 whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            )
                          )}
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded shadow-sm"><DownloadIcon className="w-3 h-3" /></button>
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">Video to Article</span>
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">Handwritten Notes 2.0</span>
                      <button className="ml-auto p-1 text-gray-400 hover:text-gray-600"><MoreHorizontalIcon className="w-3 h-3" /></button>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <div className="flex items-center gap-2">
                          {SHORTCUT_COMMANDS.slice(0, 2).map(sc => (
                              <button 
                                  key={sc.id}
                                  onClick={() => handleShortcut(sc)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-100 hover:border-gray-300 transition-colors"
                              >
                                  {sc.icon}
                                  {sc.label}
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
                                      {SHORTCUT_COMMANDS.slice(2).map(sc => (
                                          <button 
                                              key={sc.id}
                                              onClick={() => {
                                                  handleShortcut(sc);
                                                  setShowShortcutMenu(false);
                                              }}
                                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                          >
                                              {sc.icon}
                                              {sc.label}
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                      <button 
                          onClick={() => alert("Shortcut Settings - Coming Soon")}
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
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"><PaperclipIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
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
                                works={MOCK_WORKS}
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
                      <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-white hover:bg-primary-500 transition-colors">
                          <ArrowRightIcon className="w-4 h-4 -rotate-90" />
                      </button>
                    </div>
                </div>
              </>
           )}
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
    </div>
  );
};

export const WorkspacePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        onBack={() => setCurrentProject(null)}
        onSwitchProject={setCurrentProject}
        onUpdateProject={handleUpdateProject}
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
