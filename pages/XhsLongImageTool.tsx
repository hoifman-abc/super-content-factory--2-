
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { 
  Type as TypeIcon, 
  Settings, 
  Download, 
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

export default function App() {
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [ratio, setRatio] = useState<CanvasRatio>(CanvasRatio.RATIO_3_4);
  const [theme, setTheme] = useState<CanvasTheme>(CanvasTheme.WHITE);
  const [template, setTemplate] = useState<CanvasTemplate>(CanvasTemplate.MINIMAL);
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

  const hasCover = useMemo(() => !!(title || coverData), [title, coverData]);
  const totalPreviewPages = useMemo(() => (hasCover ? 1 : 0) + pages.length, [hasCover, pages]);

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
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              textDecorationThickness: '2px',
              textDecorationColor: underlineColor
            }} 
            className="px-1.5 py-0.5 rounded-sm inline-block mx-0.5"
          >
            {innerText}
          </mark>
        );
      }
      return <span key={i} style={{ fontWeight: 400 }}>{part}</span>;
    });
  };

  const getBlockHTML = (block: ContentBlock, fSize: number) => {
    const lineH = 1.9; 
    let style = `font-size: ${fSize}px; line-height: ${lineH}; margin-bottom: 1.5em; white-space: pre-wrap; word-break: break-all; font-family: 'Noto Serif SC', serif; font-weight: 400;`;
    const highlightBg = theme === CanvasTheme.DARK ? 'rgba(180, 83, 9, 0.4)' : 'rgba(254, 249, 195, 0.8)';
    
    let content = block.text.replace(/==(.*?)==/g, `<mark style="background-color: ${highlightBg}; color: inherit; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-decoration: underline; text-underline-offset: 4px;">$1</mark>`);
    
    if (block.type === 'title') {
      style = `font-size: ${fSize * 1.4}px; font-weight: 900; margin-bottom: 1em; line-height: 1.3; font-family: 'FZXiaoBiaoSong', 'Noto Serif SC', serif;`;
      return `<h2 style="${style}">${content}</h2>`;
    } else if (block.type === 'quote') {
      style = `font-size: ${fSize}px; border-left: 8px solid #ddd; padding-left: 30px; margin-bottom: 1.5em; line-height: ${lineH}; font-family: 'Noto Serif SC', serif; font-weight: 400;`;
      return `<blockquote style="${style}">${content}</blockquote>`;
    }
    return `<p style="${style}">${content}</p>`;
  };

  const paginateText = useCallback(() => {
    if (!text || !measureRef.current) {
      setPages([]);
      return;
    }

    const config = RATIO_MAP[ratio];
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const verticalPadding = currentTemplate.hasBorder ? 320 : 280;
    const maxContentHeight = config.height - verticalPadding; 
    
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
    }
    setPages(currentPages);
  }, [text, ratio, fontSize, theme, template]);

  useEffect(() => {
    paginateText();
  }, [paginateText]);

  const optimizeText = async () => {
    if (!text && !title) return;
    setIsOptimizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位专业的小红书运营专家。请将以下标题和正文进行排版优化。\n\n当前标题：${title}\n当前正文：\n${text}\n\n规则：\n1. 优化标题，使其更有张力。\n2. 使用 "# 标题" 标记正文中的核心重点句子作为内文大字标题。\n3. 使用 "> 引用" 标记金句、名言或需要强调的内容。\n4. 使用 "==文字==" 标记段落中的关键词语。\n5. 增加适当的 Emoji。\n\n请按如下格式返回：\n[NEW_TITLE] 优化的标题\n[NEW_BODY] 优化的正文内容`,
      });
      if (response.text) {
        const content = response.text;
        const newTitle = content.match(/\[NEW_TITLE\]\s*(.*)/)?.[1] || title;
        const newBody = content.match(/\[NEW_BODY\]\s*([\s\S]*)/)?.[1] || text;
        setTitle(newTitle.trim());
        setText(newBody.trim());
      }
    } catch (err) {
      alert("AI 优化失败");
    } finally {
      setIsOptimizing(false);
    }
  };

  const generateCover = async () => {
    if (!text && !title) return;
    setIsGeneratingCover(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位顶级视觉创意总监。请深度阅读以下文章，执行以下视觉策划任务：
        1. 身份提炼：谁在说话？谁在听？（例如：15年经验的公考导师在给焦虑的学员传授秘籍）。
        2. 场景叙事：构思一个极具“代入感”的、能讲述故事的视觉概念。
           - 若是导师/教育类：不要只画一张桌子。构思诸如：老旧台灯下密密麻麻的批注笔记特写、讲台上导师充满张力的手势与台下专注的侧影、或者是一张写满公式但充满希望的黑板前的背影。
           - 若是成就/职场类：构思诸如：拿到录取通知书那一刻颤抖的双手、深夜写字楼里唯一亮着的窗口、或者是职场精英在窗前俯瞰城市的光影交织。
        3. 提炼摘要：提炼一句非常有共鸣感的精华摘要（不超过 30 个字）。
        4. 生成绘图提示词：将上述叙事场景转化为专业的 AI 绘图提示词（英文）。要求：极其专业的摄影质感（Cinematic Photography），电影级光影（Chiaroscuro lighting），构图具有深度感。**绝对严禁画面出现任何文字、字母、符号或书籍封面上的假字**。

        文章标题：${title}
        正文内容：${text.substring(0, 1000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              abstract: { type: Type.STRING },
              storyPersona: { type: Type.STRING },
              visualConcept: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ['abstract', 'storyPersona', 'visualConcept', 'imagePrompt']
          }
        }
      });

      const data = JSON.parse(textResponse.text || '{}');
      const finalPrompt = `Professional cinematic depth-of-field photography, ${data.imagePrompt}. Mastery of light and shadow, ultra-realistic textures, emotional atmosphere, 8k resolution, NO TEXT, NO LOGO, NO WORDS ON PAPER.`;
      
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ text: finalPrompt }],
        config: { imageConfig: { aspectRatio: ratio === CanvasRatio.RATIO_1_1 ? '1:1' : ratio === CanvasRatio.RATIO_9_16 ? '9:16' : '3:4' } }
      });

      let base64Image = '';
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) base64Image = `data:image/png;base64,${part.inlineData.data}`;
      }

      setCoverData({
        title: title || '未命名标题',
        abstract: data.abstract,
        imageUrl: base64Image,
        imagePrompt: finalPrompt,
        // 保存上下文用于重绘
        originalContext: { title, text, previousConcept: data.visualConcept }
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = (coverData as any).originalContext;
      
      // 用户点击重绘说明对上个方案不满意，要求重新思考视觉切入点
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `用户不满意之前的视觉创意（之前的创意是：${context?.previousConcept || '未知'}）。
        请你作为创意总监，跳出之前的框架，为这篇文章提供一个【截然不同】的新叙事场景。
        例如：如果之前是老师讲课的广角，这次请聚焦到“学生正在划重点的手部特写”或“一张充满故事感的准考证”；
        如果之前是白天的学习，这次请尝试“深夜雨夜书桌旁的孤寂与专注”。
        
        要求：
        1. 依然要保持与文章高度相关，具有极强的代入感。
        2. 生成全新的绘图提示词（英文）。
        3. **严禁出现文字**。
        
        文章标题：${context?.title}
        正文参考：${context?.text?.substring(0, 500)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualConcept: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ['visualConcept', 'imagePrompt']
          }
        }
      });

      const data = JSON.parse(textResponse.text || '{}');
      const finalPrompt = `Professional artistic photography, ${data.imagePrompt}. Dramatic cinematic lighting, emotional narrative feel, high detail, photorealistic, NO TEXT, NO WORDS.`;

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ text: finalPrompt }],
        config: { imageConfig: { aspectRatio: ratio === CanvasRatio.RATIO_1_1 ? '1:1' : ratio === CanvasRatio.RATIO_9_16 ? '9:16' : '3:4' } }
      });

      let base64Image = '';
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) base64Image = `data:image/png;base64,${part.inlineData.data}`;
      }

      setCoverData({ 
        ...coverData, 
        imageUrl: base64Image, 
        imagePrompt: finalPrompt,
        originalContext: { ...context, previousConcept: data.visualConcept }
      } as any);
    } catch (err) {
      console.error(err);
      alert("图片重塑失败，请重试");
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const exportAll = async () => {
    if (pages.length === 0 && !title) return;
    setIsProcessing(true);
    const zip = new JSZip();
    try {
      const hasCover = title || coverData;
      if (hasCover) {
        const coverEl = document.getElementById('page-cover');
        if (coverEl) {
          const dataUrl = await toPng(coverEl, { 
            pixelRatio: 2,
            backgroundColor: currentTheme.bg,
            style: { transform: 'scale(1)', margin: '0', padding: '0' }
          });
          zip.file(`xhs_page_1_cover.png`, dataUrl.split(',')[1], { base64: true });
        }
      }

      for (let i = 0; i < pages.length; i++) {
        const element = document.getElementById(`page-${i}`);
        if (element) {
          const dataUrl = await toPng(element, { 
            pixelRatio: 2,
            backgroundColor: currentTheme.bg,
            style: { transform: 'scale(1)', margin: '0', padding: '0' }
          });
          zip.file(`xhs_page_${hasCover ? i + 2 : i + 1}.png`, dataUrl.split(',')[1], { base64: true });
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `小红书图文_${new Date().getTime()}.zip`;
      link.click();
    } catch (err) {
      alert("导出失败");
    } finally {
      setIsProcessing(false);
    }
  };

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F4F7] text-gray-900 overflow-hidden font-['Noto_Serif_SC',serif]">
      <aside className="w-full md:w-[420px] bg-white border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto z-20 shadow-xl">
        <header className="flex items-center gap-3 mb-1">
          <div className="bg-red-500 p-2.5 rounded-2xl shadow-lg shadow-red-100">
            <ImageIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-800">图文排版大师</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Smart AI Production</p>
          </div>
        </header>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 tracking-[0.2em]">
              <AlignLeft className="w-3 h-3 text-red-500" /> 封面大标题
            </label>
            <input
              type="text"
              className="w-full p-4 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-4 focus:ring-red-500/5 outline-none text-base font-bold transition-all placeholder:text-gray-300"
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

          <div className="pt-4 border-t border-gray-100 space-y-5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"><Layout className="w-3 h-3" /> 排版模板</div>
            <div className="flex gap-2">
              {(Object.keys(TEMPLATE_MAP) as CanvasTemplate[]).map((temp) => (
                <button 
                  key={temp} 
                  onClick={() => setTemplate(temp)} 
                  className={`flex-1 py-2 px-3 text-[10px] rounded-xl border-2 font-black uppercase transition-all ${template === temp ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                >
                  {TEMPLATE_MAP[temp].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"><Palette className="w-3 h-3" /> 设计配色</div>
            <div className="flex items-center gap-3">
              {(Object.keys(THEME_MAP) as CanvasTheme[]).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setTheme(t)} 
                  title={THEME_MAP[t].label}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all p-0.5 ${theme === t ? 'border-red-500 scale-110 shadow-md ring-4 ring-red-500/10' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="w-full h-full rounded-full border border-black/5" style={{ backgroundColor: THEME_MAP[t].bg }} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"><Settings2 className="w-3 h-3" /> 尺寸与字号</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(RATIO_MAP) as CanvasRatio[]).map((r) => (
                <button key={r} onClick={() => setRatio(r)} className={`py-2 px-3 text-[10px] rounded-xl border-2 font-black uppercase ${ratio === r ? 'border-red-500 bg-red-50 text-red-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                  {RATIO_MAP[r].label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">排版字号</span><span className="text-sm font-black text-red-500">{fontSize}PX</span></div>
              <input type="range" min="24" max="60" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
          </div>

          <button
            onClick={exportAll}
            disabled={isProcessing || (pages.length === 0 && !title)}
            className="w-full py-5 mt-2 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-gray-200 disabled:bg-gray-200"
          >
            {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
            打包下载长图文 ({totalPreviewPages}P)
          </button>
        </section>
      </aside>

      <main className="flex-1 relative flex flex-col items-center justify-center bg-[#F8F9FB] overflow-hidden">
        {!hasCover && pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center opacity-20 max-w-sm">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6"><TypeIcon className="w-12 h-12 text-gray-400" /></div>
            <h3 className="text-xl font-black mb-2">排版大师为您服务</h3>
            <p className="text-xs font-medium">在左侧输入内容，我们将为您自动生成符合小红书风格的多页文字卡片。</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-10 select-none overflow-hidden" style={{ perspective: '1200px' }}>
            {totalPreviewPages > 1 && (
              <>
                <button 
                  onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPreviewIndex === 0}
                  className="absolute left-12 z-30 p-5 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-gray-100 text-gray-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button 
                  onClick={() => setCurrentPreviewIndex(prev => Math.min(totalPreviewPages - 1, prev + 1))}
                  disabled={currentPreviewIndex === totalPreviewPages - 1}
                  className="absolute right-12 z-30 p-5 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-gray-100 text-gray-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}

            <div className="relative w-full h-[85%] flex items-center justify-center overflow-hidden">
              <div 
                className="flex h-full will-change-transform"
                style={{ 
                  transform: `translateX(-${currentPreviewIndex * 100}%)`,
                  width: `${totalPreviewPages * 100}%`,
                  transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {hasCover && (
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
                        <div id="page-cover" style={{ width: `${RATIO_MAP[ratio].width}px`, height: `${RATIO_MAP[ratio].height}px`, backgroundColor: currentTheme.bg, transform: 'scale(0.45)', transformOrigin: 'top left', display: 'flex', flexDirection: 'column', fontFamily: "'FZXiaoBiaoSong', 'Noto Serif SC', serif", position: 'relative' }}>
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
                              <h1 style={{ fontSize: `${fontSize * 2.3}px`, lineHeight: 1.1, fontWeight: 900, color: currentTheme.title, marginBottom: '60px', textAlign: 'left', wordBreak: 'break-all' }}>
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
                                  fontFamily: "'Noto Serif SC', serif",
                                  fontWeight: 400
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
                  const slideIndex = hasCover ? index + 1 : index;
                  const isActive = currentPreviewIndex === slideIndex;
                  const pageDisplayNum = (hasCover ? 2 : 1) + index;
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
                        <span className="text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase bg-white/50 px-4 py-1.5 rounded-full shadow-sm">Page {index + 1}</span>
                        <div 
                          className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden rounded-sm bg-white"
                          style={{ width: `${RATIO_MAP[ratio].width * 0.45}px`, height: `${RATIO_MAP[ratio].height * 0.45}px` }}
                        >
                          <div id={`page-${index}`} style={{ width: `${RATIO_MAP[ratio].width}px`, height: `${RATIO_MAP[ratio].height}px`, backgroundColor: currentTheme.bg, transform: 'scale(0.45)', transformOrigin: 'top left', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div className="flex-1 px-[100px] py-[100px]">
                              {page.blocks.map((block, bIdx) => (
                                <div key={bIdx} style={{ 
                                  fontSize: `${fontSize * (block.type === 'title' ? 1.4 : 1)}px`,
                                  fontWeight: block.type === 'title' ? 900 : 400,
                                  lineHeight: block.type === 'title' ? 1.3 : 1.9,
                                  marginBottom: '1.5em',
                                  color: block.type === 'title' ? currentTheme.title : block.type === 'quote' ? currentTheme.quote : currentTheme.text,
                                  borderLeft: block.type === 'quote' ? `10px solid ${currentTheme.quoteBorder}` : 'none',
                                  paddingLeft: block.type === 'quote' ? '40px' : '0',
                                  textAlign: 'justify',
                                  fontFamily: block.type === 'title' ? "'FZXiaoBiaoSong', 'Noto Serif SC', serif" : "'Noto Serif SC', serif"
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

            <div className="mt-8 flex flex-col items-center gap-5">
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


