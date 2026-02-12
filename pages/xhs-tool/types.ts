export enum CanvasRatio {
  RATIO_1_1 = '1:1',
  RATIO_3_4 = '3:4',
  RATIO_4_5 = '4:5',
  RATIO_9_16 = '9:16',
}

export interface RatioConfig {
  width: number;
  height: number;
  label: string;
}

export const RATIO_MAP: Record<CanvasRatio, RatioConfig> = {
  [CanvasRatio.RATIO_1_1]: { width: 1080, height: 1080, label: '1:1 正方形' },
  [CanvasRatio.RATIO_3_4]: { width: 1080, height: 1440, label: '3:4 竖版' },
  [CanvasRatio.RATIO_4_5]: { width: 1080, height: 1350, label: '4:5 竖版' },
  [CanvasRatio.RATIO_9_16]: { width: 1080, height: 1920, label: '9:16 全屏' },
};

export type BlockType = 'paragraph' | 'title' | 'quote';

export interface ContentBlock {
  type: BlockType;
  text: string;
}

export interface PageContent {
  blocks: ContentBlock[];
  pageIndex: number;
}

export interface CoverData {
  title: string;
  abstract: string;
  imageUrl: string;
  imagePrompt: string;
}

export enum CanvasTheme {
  WHITE = 'white',
  COFFEE = 'coffee',
  DARK = 'dark',
}

export interface ThemeConfig {
  bg: string;
  text: string;
  title: string;
  quote: string;
  quoteBorder: string;
  label: string;
  footerText: string;
  footerPage: string;
}

export const THEME_MAP: Record<CanvasTheme, ThemeConfig> = {
  [CanvasTheme.WHITE]: {
    bg: '#ffffff',
    text: '#1a1a1a',
    title: '#000000',
    quote: '#666666',
    quoteBorder: '#E5E7EB',
    label: '清爽白',
    footerText: '#E5E7EB',
    footerPage: '#F9FAFB',
  },
  [CanvasTheme.COFFEE]: {
    bg: '#F5F0E6',
    text: '#4A3728',
    title: '#2D1E16',
    quote: '#8B735B',
    quoteBorder: '#D2C4B1',
    label: '咖啡暖',
    footerText: '#D2C4B1',
    footerPage: '#ECE4D5',
  },
  [CanvasTheme.DARK]: {
    bg: '#1A1A1A',
    text: '#E5E7EB',
    title: '#FFFFFF',
    quote: '#9CA3AF',
    quoteBorder: '#374151',
    label: '沉稳黑',
    footerText: '#374151',
    footerPage: '#262626',
  },
};

export enum CanvasTemplate {
  CLASSIC = 'classic',
  MINIMAL = 'minimal',
  MAGAZINE = 'magazine',
}

export interface TemplateConfig {
  label: string;
  hasBorder: boolean;
  headerStyle: 'line' | 'none' | 'dot';
  footerStyle: 'side' | 'center';
}

export const TEMPLATE_MAP: Record<CanvasTemplate, TemplateConfig> = {
  [CanvasTemplate.CLASSIC]: {
    label: '经典',
    hasBorder: false,
    headerStyle: 'none',
    footerStyle: 'side',
  },
  [CanvasTemplate.MINIMAL]: {
    label: '极简',
    hasBorder: false,
    headerStyle: 'none',
    footerStyle: 'side',
  },
  [CanvasTemplate.MAGAZINE]: {
    label: '杂志',
    hasBorder: true,
    headerStyle: 'line',
    footerStyle: 'center',
  },
};
